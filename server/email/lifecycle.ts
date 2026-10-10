import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createAdminClient,
  isEnabled,
  makeUnsubscribeToken,
  renderMarketingEmail,
  resendRequest,
  retryDelayMs,
  type EmailLocale,
  type EmailKind,
  type QueueItem,
} from './runtime.ts'

type Environment = Record<string, string | undefined>
type UserRecord = { id: string; email?: string; created_at: string; confirmed_at?: string | null; email_confirmed_at?: string | null }

export type LifecycleStats = { scanned: number; queued: number; sent: number; suppressed: number; retried: number; failed: number }

export async function runMarketingLifecycle(environment: Environment, dependencies: {
  client?: SupabaseClient
  fetcher?: typeof fetch
  now?: Date
} = {}): Promise<LifecycleStats> {
  const siteUrl = environment.SITE_URL?.trim()
  const from = environment.RESEND_FROM?.trim()
  const interestedSegmentId = environment.RESEND_INTERESTED_SEGMENT_ID?.trim()
  const unsubscribeSecret = environment.EMAIL_UNSUBSCRIBE_SECRET?.trim()
  const companyName = environment.MARKETING_COMPANY_NAME?.trim()
  const postalAddress = environment.MARKETING_POSTAL_ADDRESS?.trim()
  const client = dependencies.client ?? createAdminClient(environment)
  const fetcher = dependencies.fetcher ?? fetch
  const now = dependencies.now ?? new Date()
  const stats: LifecycleStats = { scanned: 0, queued: 0, sent: 0, suppressed: 0, retried: 0, failed: 0 }

  const pages = await listUsers(client, 100)
  const allUsers = pages.flat()
  stats.scanned = allUsers.length
  if (environment.RESEND_API_KEY?.trim()) await syncResendContactConsents({ client, users: allUsers, environment, fetcher, now })
  if (!isEnabled(environment) || !siteUrl || !from || !interestedSegmentId || !unsubscribeSecret || !companyName || !postalAddress) return stats
  for (const users of pages) {
    const confirmed = users.filter((user) => Boolean(user.email && user.email_confirmed_at))
    if (!confirmed.length) continue
    const ids = confirmed.map((user) => user.id)
    const [{ data: preferences, error: prefError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
      client.from('email_preferences').select('user_id, marketing_opt_in, email_locale').in('user_id', ids),
      client.from('subscriptions').select('user_id, status, starts_at, expires_at').in('user_id', ids),
    ])
    if (prefError) throw prefError
    if (subscriptionError) throw subscriptionError
    const progress = await listProgress(client, ids)
    const preferenceByUser = new Map((preferences ?? []).map((row) => [row.user_id, row]))
    const latestProgress = new Map<string, number>()
    for (const row of progress ?? []) {
      const timestamp = Date.parse(row.completed_at)
      latestProgress.set(row.user_id, Math.max(latestProgress.get(row.user_id) ?? 0, timestamp))
    }
    const activeSubscriptions = new Set((subscriptions ?? []).filter((row) => row.status === 'active' && (!row.starts_at || Date.parse(row.starts_at) <= now.getTime()) && (!row.expires_at || Date.parse(row.expires_at) > now.getTime())).map((row) => row.user_id))
    const candidates: Array<{ user_id: string; email: string; kind: EmailKind; campaign_key: string; email_segment: 'active' | 'inactive'; email_locale: EmailLocale; idempotency_key: string }> = []
    for (const user of confirmed) {
      const preference = preferenceByUser.get(user.id)
      if (!user.email || !preference?.marketing_opt_in) continue
      const emailLocale = normalizeEmailLocale(preference.email_locale)
      const confirmedAge = now.getTime() - Date.parse(user.email_confirmed_at!)
      const segment = activeSubscriptions.has(user.id) ? 'active' : 'inactive'
      if (confirmedAge >= 0 && confirmedAge <= 7 * DAY) {
        candidates.push({ user_id: user.id, email: user.email, kind: 'welcome', campaign_key: 'welcome-v1', email_segment: segment, email_locale: emailLocale, idempotency_key: makeQueueIdempotencyKey(user.id, 'welcome', 'welcome-v1') })
      }
      if (segment === 'active' && confirmedAge >= DAY && confirmedAge <= 14 * DAY && !latestProgress.has(user.id)) {
        candidates.push({ user_id: user.id, email: user.email, kind: 'first_lesson', campaign_key: 'first-lesson-v1', email_segment: segment, email_locale: emailLocale, idempotency_key: makeQueueIdempotencyKey(user.id, 'first_lesson', 'first-lesson-v1') })
      }
      const lastProgress = latestProgress.get(user.id)
      if (lastProgress && now.getTime() - lastProgress >= 7 * DAY && now.getTime() - lastProgress <= 45 * DAY) {
        candidates.push({
          user_id: user.id,
          email: user.email,
          kind: 'reengagement',
          campaign_key: `inactive-v1-${new Date(lastProgress).toISOString()}`,
          email_segment: segment,
          email_locale: emailLocale,
          idempotency_key: makeQueueIdempotencyKey(user.id, 'reengagement', `inactive-v1-${new Date(lastProgress).toISOString()}`),
        })
      }
    }
    if (candidates.length) {
      const { data, error } = await client.from('email_marketing_queue').upsert(candidates, {
        onConflict: 'user_id,kind,campaign_key', ignoreDuplicates: true,
      }).select('id')
      if (error) throw error
      stats.queued += data?.length ?? 0
    }
  }

  const { data: queue, error: claimError } = await client.rpc('claim_email_marketing_queue', { p_limit: 25 })
  if (claimError) throw claimError
  for (const item of (queue ?? []) as QueueItem[]) {
    try {
      const sent = await deliverQueuedEmail({ client, item, environment, interestedSegmentId, from, siteUrl, unsubscribeSecret, companyName, postalAddress, fetcher, now })
      if (sent === 'suppressed') stats.suppressed += 1
      else stats.sent += 1
    } catch (error) {
      const attempt = item.attempts ?? 1
      const retryable = isRetryableDeliveryError(error)
      const exhausted = !retryable || attempt >= 5
      const message = error instanceof Error ? error.message : 'Unknown email delivery error'
      const { error: updateError } = await client.from('email_marketing_queue').update({
        status: exhausted ? 'failed' : 'pending',
        available_at: new Date(now.getTime() + retryDelayMs(attempt)).toISOString(),
        claimed_at: null,
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq('id', item.id).eq('status', 'processing')
      if (updateError) throw updateError
      if (exhausted) await releaseUserLock(client, item, false)
      if (exhausted) stats.failed += 1
      else stats.retried += 1
    }
  }
  return stats
}

async function listUsers(client: SupabaseClient, maximumPages: number) {
  const pages: UserRecord[][] = []
  for (let page = 1; page <= maximumPages; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    pages.push(data.users as UserRecord[])
    if (data.users.length < 1000) break
    if (page === maximumPages) throw new Error(`Supabase Auth pagination exceeded ${maximumPages * 1000} users; refusing to silently skip accounts.`)
  }
  return pages
}

async function listProgress(client: SupabaseClient, userIds: string[]) {
  const rows: Array<{ user_id: string; completed_at: string }> = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('lesson_progress')
      .select('user_id, completed_at')
      .in('user_id', userIds)
      .order('user_id', { ascending: true })
      .order('lesson_id', { ascending: true })
      .order('completed_at', { ascending: true })
      .range(offset, offset + 999)
    if (error) throw error
    rows.push(...(data ?? []))
    if ((data?.length ?? 0) < 1000) return rows
  }
}

async function deliverQueuedEmail(input: {
  client: SupabaseClient
  item: QueueItem
  environment: Environment
  interestedSegmentId: string
  from: string
  siteUrl: string
  unsubscribeSecret: string
  companyName: string
  postalAddress: string
  fetcher: typeof fetch
  now: Date
}) {
  const { client, item } = input
  const [{ data: preference, error: preferenceError }, { data: authResult, error: authError }, { data: suppression, error: suppressionError }] = await Promise.all([
    client.from('email_preferences').select('marketing_opt_in').eq('user_id', item.user_id).maybeSingle(),
    client.auth.admin.getUserById(item.user_id),
    client.from('email_marketing_suppressions').select('email').eq('email', item.email.toLowerCase()).maybeSingle(),
  ])
  if (preferenceError) throw preferenceError
  if (authError) throw authError
  if (suppressionError) throw suppressionError
  const currentUser = authResult.user as UserRecord | null
  const confirmed = Boolean(currentUser?.email_confirmed_at)
  if (!preference?.marketing_opt_in || !confirmed || !currentUser?.email || currentUser.email.toLowerCase() !== item.email.toLowerCase() || suppression) {
    await finishSuppressed(client, item)
    await releaseUserLock(client, item, false)
    return 'suppressed'
  }
  if (!await checkQueuedEligibility(client, item, item.attempts === 1, input.now)) {
    await finishSuppressed(client, item)
    await releaseUserLock(client, item, false)
    return 'suppressed'
  }

  let currentContact = await getResendContact(input.environment, item.email, input.fetcher)
  if (currentContact?.unsubscribed) {
    await suppressContact(client, item.user_id, item.email, 'unsubscribe', 'resend_contact', true)
    await finishSuppressed(client, item)
    await releaseUserLock(client, item, false)
    return 'suppressed'
  }
  if (!currentContact) {
    try {
      currentContact = await resendRequest<{ id: string; unsubscribed?: boolean }>(input.environment, '/contacts', {
        method: 'POST', body: JSON.stringify({ email: item.email }),
      }, input.fetcher)
    } catch (error) {
      // Another invocation may have created the same contact. Re-read it before deciding to retry.
      const existing = await getResendContact(input.environment, item.email, input.fetcher)
      if (!existing) throw error
      if (existing?.unsubscribed) {
        await suppressContact(client, item.user_id, item.email, 'unsubscribe', 'resend_contact', true)
        await finishSuppressed(client, item)
        await releaseUserLock(client, item, false)
        return 'suppressed'
      }
      if (!existing) throw error
      currentContact = existing
    }
  }
  const contactKey = encodeURIComponent(currentContact.id || item.email)
  await attachContactToSegment(input.environment, contactKey, input.interestedSegmentId, input.fetcher)
  if (item.email_segment === 'active' && input.environment.RESEND_ACTIVE_SEGMENT_ID?.trim()) {
    await attachContactToSegment(input.environment, contactKey, input.environment.RESEND_ACTIVE_SEGMENT_ID.trim(), input.fetcher)
  } else if (item.email_segment === 'inactive' && input.environment.RESEND_ACTIVE_SEGMENT_ID?.trim()) {
    await removeContactFromSegment(input.environment, contactKey, input.environment.RESEND_ACTIVE_SEGMENT_ID.trim(), input.fetcher)
  }

  if (!await checkQueuedEligibility(client, item, false, input.now)) {
    await finishSuppressed(client, item)
    await releaseUserLock(client, item, false)
    return 'suppressed'
  }
  const payload = item.payload ?? createEmailPayload(item, input)
  if (!item.payload) {
    const { error } = await client.from('email_marketing_queue').update({ payload }).eq('id', item.id).eq('status', 'processing').is('payload', null)
    if (error) throw error
    item.payload = payload
  }
  const response = await input.fetcher('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(8_000),
    headers: {
      Authorization: `Bearer ${input.environment.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': item.idempotency_key,
    },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string }
  if (!response.ok || !result.id) throw new Error(`Resend ${response.status}: ${result.message ?? 'email send failed'}`)
  const { error: deliveryError } = await client.from('email_marketing_deliveries').upsert({
    queue_id: item.id,
    user_id: item.user_id,
    email: item.email,
    kind: item.kind,
    idempotency_key: item.idempotency_key,
    resend_email_id: result.id,
  }, { onConflict: 'queue_id' })
  if (deliveryError) throw deliveryError
  const { error: queueError } = await client.from('email_marketing_queue').update({
    status: 'sent', resend_email_id: result.id, claimed_at: null, last_error: null, updated_at: new Date().toISOString(),
  }).eq('id', item.id).eq('status', 'processing')
  if (queueError) throw queueError
  await releaseUserLock(client, item, true, input.now)
  const { error: contactError } = await client.from('email_marketing_contacts').upsert({ user_id: item.user_id, email: item.email.toLowerCase(), resend_subscribed: true, email_segment: item.email_segment, updated_at: input.now.toISOString() }, { onConflict: 'user_id' })
  if (contactError) throw contactError
  return 'sent'
}

async function checkQueuedEligibility(client: SupabaseClient, item: QueueItem, refreshSegment: boolean, at = new Date()) {
  const now = at.getTime()
  const [{ data: userResult, error: userError }, { data: preference, error: preferenceError }, { data: latest, error: progressError }, { data: suppression, error: suppressionError }] = await Promise.all([
    client.auth.admin.getUserById(item.user_id),
    client.from('email_preferences').select('marketing_opt_in').eq('user_id', item.user_id).maybeSingle(),
    client.from('lesson_progress').select('completed_at').eq('user_id', item.user_id).order('completed_at', { ascending: false }).limit(1),
    client.from('email_marketing_suppressions').select('email').eq('email', item.email.toLowerCase()).maybeSingle(),
  ])
  if (userError) throw userError
  if (preferenceError) throw preferenceError
  if (progressError) throw progressError
  if (suppressionError) throw suppressionError
  const user = userResult.user as UserRecord | null
  if (!user?.email_confirmed_at || user.email?.toLowerCase() !== item.email.toLowerCase() || !preference?.marketing_opt_in || suppression) return false
  const confirmedAge = now - Date.parse(user.email_confirmed_at)
  const lastProgress = latest?.[0] ? Date.parse(latest[0].completed_at) : 0
  if (item.kind === 'welcome' && !(confirmedAge >= 0 && confirmedAge <= 7 * DAY)) return false
  if (item.kind === 'first_lesson' && !(confirmedAge >= DAY && confirmedAge <= 14 * DAY && !lastProgress)) return false
  if (item.kind === 'reengagement' && !(lastProgress && now - lastProgress >= 7 * DAY && now - lastProgress <= 45 * DAY && item.campaign_key === `inactive-v1-${new Date(lastProgress).toISOString()}`)) return false

  const { data: subscriptions, error: subscriptionError } = await client.from('subscriptions').select('status, starts_at, expires_at').eq('user_id', item.user_id)
  if (subscriptionError) throw subscriptionError
  const active = (subscriptions ?? []).some((subscription) => subscription.status === 'active'
    && (!subscription.starts_at || Date.parse(subscription.starts_at) <= now)
    && (!subscription.expires_at || Date.parse(subscription.expires_at) > now))
  const currentSegment = active ? 'active' : 'inactive'
  if (item.kind === 'first_lesson' && currentSegment !== 'active') return false
  if (refreshSegment) {
    item.email_segment = currentSegment
    const { error } = await client.from('email_marketing_queue').update({ email_segment: item.email_segment }).eq('id', item.id).eq('status', 'processing')
    if (error) throw error
  } else if (currentSegment !== item.email_segment) {
    return false
  }
  return true
}

async function getResendContact(environment: Environment, email: string, fetcher: typeof fetch) {
  const response = await fetcher(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
    signal: AbortSignal.timeout(8_000),
    headers: { Authorization: `Bearer ${environment.RESEND_API_KEY}` },
  })
  if (response.status === 404) return null
  const payload = await response.json().catch(() => ({})) as { id?: string; email?: string; unsubscribed?: boolean; message?: string }
  if (!response.ok) throw new Error(`Resend ${response.status}: ${payload.message ?? 'contact lookup failed'}`)
  if (!payload.id) throw new Error('Resend contact response is missing an id')
  return { ...payload, id: payload.id }
}

async function attachContactToSegment(environment: Environment, contactKey: string, segmentId: string, fetcher: typeof fetch) {
  try {
    await resendRequest(environment, `/contacts/${contactKey}/segments/${encodeURIComponent(segmentId)}`, { method: 'POST' }, fetcher)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith('Resend 409:')) throw error
  }
}

async function removeContactFromSegment(environment: Environment, contactKey: string, segmentId: string, fetcher: typeof fetch) {
  try {
    await resendRequest(environment, `/contacts/${contactKey}/segments/${encodeURIComponent(segmentId)}`, { method: 'DELETE' }, fetcher)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.startsWith('Resend 404:')) throw error
  }
}

function createEmailPayload(item: QueueItem, input: {
  from: string; siteUrl: string; unsubscribeSecret: string; companyName: string; postalAddress: string
}) {
  const expiresAt = Math.floor((Date.parse(item.created_at) + 365 * DAY) / 1000)
  const token = makeUnsubscribeToken(item.user_id, input.unsubscribeSecret, expiresAt)
  const unsubscribeUrl = new URL('/api/email/unsubscribe', input.siteUrl)
  unsubscribeUrl.searchParams.set('token', token)
  unsubscribeUrl.searchParams.set('locale', item.email_locale)
  const email = renderMarketingEmail({
    kind: item.kind, segment: item.email_segment, locale: item.email_locale, name: '', siteUrl: input.siteUrl,
    unsubscribeUrl: unsubscribeUrl.toString(), companyName: input.companyName, postalAddress: input.postalAddress,
  })
  return { from: input.from, to: [item.email], subject: email.subject, html: email.html, text: email.text, headers: email.headers }
}

function isRetryableDeliveryError(error: unknown) {
  if (error instanceof TypeError || (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name))) return true
  const status = error instanceof Error ? /^Resend (\d{3}):/.exec(error.message)?.[1] : undefined
  return status === '429' || Boolean(status && Number(status) >= 500)
}

async function releaseUserLock(client: SupabaseClient, item: QueueItem, sent: boolean, at = new Date()) {
  const { error } = await client.from('email_marketing_user_locks').update({
    claimed_at: sent ? at.toISOString() : null,
    ...(sent ? { last_sent_at: at.toISOString() } : {}),
  }).eq('user_id', item.user_id).eq('queue_id', item.id)
  if (error) throw error
}

async function syncResendContactConsents(input: {
  client: SupabaseClient; users: UserRecord[]; environment: Environment; fetcher: typeof fetch; now: Date
}) {
  for (let offset = 0; offset < input.users.length; offset += 500) {
    const users = input.users.slice(offset, offset + 500).filter((user) => user.email && user.email_confirmed_at)
    if (!users.length) continue
    const ids = users.map((user) => user.id)
    const [{ data: preferences, error: preferenceError }, { data: contacts, error: contactError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
      input.client.from('email_preferences').select('user_id, marketing_opt_in, consent_granted_at').in('user_id', ids),
      input.client.from('email_marketing_contacts').select('user_id, email, resend_subscribed, email_segment').in('user_id', ids),
      input.client.from('subscriptions').select('user_id, status, starts_at, expires_at').in('user_id', ids),
    ])
    if (preferenceError) throw preferenceError
    if (contactError) throw contactError
    if (subscriptionError) throw subscriptionError
    const optedIn = new Set((preferences ?? []).filter((row) => row.marketing_opt_in).map((row) => row.user_id))
    const preferenceByUser = new Map((preferences ?? []).map((row) => [row.user_id, row]))
    const { data: suppressions, error: suppressionError } = await input.client.from('email_marketing_suppressions').select('email, reason, created_at').in('email', users.map((user) => user.email!.toLowerCase()))
    if (suppressionError) throw suppressionError
    const suppressionByEmail = new Map((suppressions ?? []).map((row) => [row.email, row]))
    const byId = new Map(users.map((user) => [user.id, user]))
    const activeUsers = new Set((subscriptions ?? []).filter((row) => row.status === 'active'
      && (!row.starts_at || Date.parse(row.starts_at) <= input.now.getTime())
      && (!row.expires_at || Date.parse(row.expires_at) > input.now.getTime())).map((row) => row.user_id))
    for (const contact of contacts ?? []) {
      const user = byId.get(contact.user_id)
      if (!user?.email) continue
      if (!optedIn.has(contact.user_id) && contact.resend_subscribed) {
        try {
          await resendRequest(input.environment, `/contacts/${encodeURIComponent(contact.email)}`, {
            method: 'PATCH', body: JSON.stringify({ unsubscribed: true }),
          }, input.fetcher)
        } catch (error) {
          if (!(error instanceof Error) || !error.message.startsWith('Resend 404:')) throw error
        }
        const { error } = await input.client.from('email_marketing_contacts').update({ resend_subscribed: false, updated_at: input.now.toISOString() }).eq('user_id', contact.user_id)
        if (error) throw error
        continue
      }
      if (!contact.resend_subscribed || !optedIn.has(contact.user_id)) continue
      const currentSegment = activeUsers.has(contact.user_id) ? 'active' : 'inactive'
      if (contact.email_segment === currentSegment) continue
      const activeSegmentId = input.environment.RESEND_ACTIVE_SEGMENT_ID?.trim()
      if (activeSegmentId) {
        const resendContact = await getResendContact(input.environment, contact.email, input.fetcher)
        if (!resendContact) {
          const { error } = await input.client.from('email_marketing_contacts').update({ resend_subscribed: false, email_segment: currentSegment, updated_at: input.now.toISOString() }).eq('user_id', contact.user_id)
          if (error) throw error
          continue
        }
        const contactKey = encodeURIComponent(resendContact.id)
        if (currentSegment === 'active') await attachContactToSegment(input.environment, contactKey, activeSegmentId, input.fetcher)
        else await removeContactFromSegment(input.environment, contactKey, activeSegmentId, input.fetcher)
      }
      const { error } = await input.client.from('email_marketing_contacts').update({ email_segment: currentSegment, updated_at: input.now.toISOString() }).eq('user_id', contact.user_id)
      if (error) throw error
    }
    for (const user of users) {
      const preference = preferenceByUser.get(user.id)
      const email = user.email!.toLowerCase()
      const suppression = suppressionByEmail.get(email)
      const consentAt = preference?.consent_granted_at ? Date.parse(preference.consent_granted_at) : NaN
      const suppressedAt = suppression?.created_at ? Date.parse(suppression.created_at) : NaN
      if (!preference?.marketing_opt_in || suppression?.reason !== 'unsubscribe' || !Number.isFinite(consentAt) || !Number.isFinite(suppressedAt) || consentAt <= suppressedAt) continue
      let contactExists = true
      try {
        await resendRequest(input.environment, `/contacts/${encodeURIComponent(email)}`, {
          method: 'PATCH', body: JSON.stringify({ unsubscribed: false }),
        }, input.fetcher)
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('Resend 404:')) throw error
        contactExists = false
      }
      const { error: deleteError } = await input.client.from('email_marketing_suppressions').delete().eq('email', email).eq('reason', 'unsubscribe').eq('created_at', suppression.created_at)
      if (deleteError) throw deleteError
      const { error: trackedContactError } = await input.client.from('email_marketing_contacts').upsert({
        user_id: user.id, email, resend_subscribed: contactExists,
        email_segment: activeUsers.has(user.id) ? 'active' : 'inactive', updated_at: input.now.toISOString(),
      }, { onConflict: 'user_id' })
      if (trackedContactError) throw trackedContactError
    }
  }
}

async function finishSuppressed(client: SupabaseClient, item: QueueItem) {
  const { error } = await client.from('email_marketing_queue').update({
    status: 'suppressed', claimed_at: null, updated_at: new Date().toISOString(),
  }).eq('id', item.id).eq('status', 'processing')
  if (error) throw error
}

async function suppressContact(client: SupabaseClient, userId: string, email: string, reason: 'unsubscribe' | 'bounce' | 'complaint', source: string, resendAlreadyUnsubscribed = false, occurredAt?: string) {
  const normalizedEmail = email.toLowerCase()
  const { error: suppressionError } = await client.rpc('record_email_marketing_suppression', {
    p_email: normalizedEmail,
    p_reason: reason,
    p_source: source,
    p_created_at: occurredAt ?? new Date().toISOString(),
  })
  if (suppressionError) throw suppressionError
  const { error: preferenceError } = await client.from('email_preferences').update({ marketing_opt_in: false }).eq('user_id', userId)
  if (preferenceError) throw preferenceError
  if (resendAlreadyUnsubscribed) {
    const { error: contactError } = await client.from('email_marketing_contacts').upsert({ user_id: userId, email: normalizedEmail, resend_subscribed: false, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (contactError) throw contactError
  }
  const { error: queueError } = await client.from('email_marketing_queue').update({ status: 'suppressed', claimed_at: null, updated_at: new Date().toISOString() }).eq('email', normalizedEmail).in('status', ['pending', 'processing'])
  if (queueError) throw queueError
}

export async function optOutUser(environment: Environment, userId: string, source: string, client = createAdminClient(environment), fetcher: typeof fetch = fetch) {
  const { data, error } = await client.auth.admin.getUserById(userId)
  if (error) throw error
  const email = data.user?.email?.toLowerCase()
  if (!email) throw new Error('Account email was not found')
  await suppressContact(client, userId, email, 'unsubscribe', source)
  if (environment.RESEND_API_KEY?.trim()) {
    try {
      await resendRequest(environment, `/contacts/${encodeURIComponent(email)}`, {
        method: 'PATCH', body: JSON.stringify({ unsubscribed: true }),
      }, fetcher)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith('Resend 404:')) throw error
    }
    const { error: contactError } = await client.from('email_marketing_contacts').update({ resend_subscribed: false, updated_at: new Date().toISOString() }).eq('user_id', userId)
    if (contactError) throw contactError
  }
}

export async function recordResendWebhook(environment: Environment, event: {
  id: string
  type: string
  created_at?: string
  data?: { email_id?: string; email?: string; to?: string[]; [key: string]: unknown }
}, client = createAdminClient(environment)) {
  const email = (event.data?.email ?? event.data?.to?.[0])?.toLowerCase() ?? null
  const emailId = event.data?.email_id ?? null
  const { error: logError } = await client.from('email_marketing_events').upsert({
    event_id: event.id,
    event_type: event.type,
    resend_email_id: emailId,
    email,
    payload: event,
  }, { onConflict: 'event_id', ignoreDuplicates: true })
  if (logError) throw logError
  if (!['email.bounced', 'email.complained', 'contact.unsubscribed', 'contact.updated'].includes(event.type)) return

  const optedOut = event.type === 'contact.unsubscribed' || (event.type === 'contact.updated' && event.data?.unsubscribed === true)
  if (event.type === 'contact.updated' && !optedOut) return
  const reason = optedOut ? 'unsubscribe' : event.type === 'email.complained' ? 'complaint' : 'bounce'
  const occurredAt = event.created_at && Number.isFinite(Date.parse(event.created_at)) ? event.created_at : new Date().toISOString()
  if (!email && !event.data?.to?.length && !emailId) return
  const targetEmails = email ? [email] : event.data?.to?.map((entry) => entry.toLowerCase()) ?? []
  if (!targetEmails.length && emailId) {
    const { data, error } = await client.from('email_marketing_deliveries').select('email').eq('resend_email_id', emailId).maybeSingle()
    if (error) throw error
    if (data?.email) targetEmails.push(data.email.toLowerCase())
  }
  for (const targetEmail of targetEmails) {
    const userId = await findAuthUserIdByEmail(client, targetEmail)
    if (userId) {
      const { data: preference, error: preferenceError } = await client.from('email_preferences').select('marketing_opt_in, consent_granted_at').eq('user_id', userId).maybeSingle()
      if (preferenceError) throw preferenceError
      const consentAt = preference?.consent_granted_at ? Date.parse(preference.consent_granted_at) : NaN
      if (optedOut && preference?.marketing_opt_in && Number.isFinite(consentAt) && consentAt > Date.parse(occurredAt)) continue
      await suppressContact(client, userId, targetEmail, reason, `resend:${event.type}`, true, occurredAt)
    }
    else {
      const { error } = await client.rpc('record_email_marketing_suppression', {
        p_email: targetEmail, p_reason: reason, p_source: `resend:${event.type}`, p_created_at: occurredAt,
      })
      if (error) throw error
      const { error: queueError } = await client.from('email_marketing_queue').update({ status: 'suppressed', claimed_at: null, updated_at: new Date().toISOString() }).eq('email', targetEmail).in('status', ['pending', 'processing'])
      if (queueError) throw queueError
    }
  }
}

async function findAuthUserIdByEmail(client: SupabaseClient, email: string) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) return match.id
    if (data.users.length < 1000) break
    if (page === 100) throw new Error('Supabase Auth email lookup exceeded 100000 users; refusing to silently miss a suppression event.')
  }
  return null
}

export function makeQueueIdempotencyKey(userId: string, kind: EmailKind, campaignKey: string) {
  return `marketing/${kind}/${userId}/${campaignKey}`
}

function normalizeEmailLocale(value: unknown): EmailLocale {
  return value === 'en' || value === 'es' ? value : 'pt-BR'
}

const DAY = 24 * 60 * 60 * 1000
