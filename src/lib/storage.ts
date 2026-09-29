import type { Currency, PlanId } from './offers'

export type UserRole = 'student' | 'admin' | 'affiliate'
export type DemoSession = {
  id: string
  name: string
  email: string
  bio?: string
  location?: string
  avatarUrl?: string
  role: UserRole
  plan: PlanId | 'demo'
  planStartedAt: string
  expiresAt?: string
  currency?: Currency
  referralCode?: string
}

export type MockEvent = { id: string; type: 'click' | 'signup' | 'sale'; at: string; code: string; detail?: string; value?: number; currency?: Currency; userId?: string }
export type MockOrder = { id: string; at: string; userId: string; plan: PlanId; currency: Currency; refCode?: string; status: 'approved-demo'; commission: number }
export type MockPayout = { id: string; at: string; code: string; currency: Currency; amount: number; status: 'requested-demo' }
export type QuizProfile = { name: string; description: string; nextStep: string }
export type StudentReview = { id: string; userId: string; name: string; rating: number; text: string; createdAt: string; isSample?: boolean }

const keys = {
  session: 'cripto-mentoria:session',
  progress: 'cripto-mentoria:progress',
  quiz: 'cripto-mentoria:quiz-profile',
  events: 'cripto-mentoria:affiliate-events',
  orders: 'cripto-mentoria:mock-orders',
  referral: 'cripto-mentoria:referral',
  pending: 'cripto-mentoria:pending-order',
  quizzes: 'cripto-mentoria:quiz-results',
  certificate: 'cripto-mentoria:certificate',
  payouts: 'cripto-mentoria:payout-requests',
  reviews: 'cripto-mentoria:reviews'
} as const

const sampleReviews: StudentReview[] = [
  { id: 'sample-review-1', userId: 'sample', name: 'Exemplo 01', rating: 5, text: 'Exemplo demonstrativo: separar ativo, rede e carteira ajuda a fazer perguntas melhores antes de qualquer decisão.', createdAt: '2026-01-10T12:00:00.000Z', isSample: true },
  { id: 'sample-review-2', userId: 'sample', name: 'Exemplo 02', rating: 5, text: 'Exemplo demonstrativo: o cenário hipotético deixa mais claro como uma queda pode afetar um valor em reais.', createdAt: '2026-01-11T12:00:00.000Z', isSample: true },
  { id: 'sample-review-3', userId: 'sample', name: 'Exemplo 03', rating: 4, text: 'Exemplo demonstrativo: entender margem e exposição antes de estudar futuros organiza a leitura do risco.', createdAt: '2026-01-12T12:00:00.000Z', isSample: true }
]

const volatileStorage = new Map<string, string>()

export function getStoredValue(key: string) {
  if (volatileStorage.has(key)) return volatileStorage.get(key) ?? null
  try { return window.localStorage.getItem(key) }
  catch { return null }
}

export function setStoredValue(key: string, value: string) {
  volatileStorage.set(key, value)
  try { window.localStorage.setItem(key, value) }
  catch { /* Keep the current session usable when browser storage is unavailable. */ }
}

export function removeStoredValue(key: string) {
  volatileStorage.delete(key)
  try { window.localStorage.removeItem(key) }
  catch { /* In-memory state can still be cleared when browser storage is unavailable. */ }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = getStoredValue(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  setStoredValue(key, JSON.stringify(value))
}

export const getSession = () => readJson<DemoSession | null>(keys.session, null)
export const setSession = (value: DemoSession | null) => value ? writeJson(keys.session, value) : removeStoredValue(keys.session)
export const getCompletedLessons = () => readJson<string[]>(keys.progress, [])
export const saveCompletedLesson = (lessonId: string) => writeJson(keys.progress, [...new Set([...getCompletedLessons(), lessonId])])
export const getQuizResults = () => readJson<Record<string, { score: number; passed: boolean; at: string }>>(keys.quizzes, {})
export const saveQuizResult = (moduleId: string, score: number, total: number) => writeJson(keys.quizzes, { ...getQuizResults(), [moduleId]: { score, passed: score >= Math.ceil(total * 2 / 3), at: new Date().toISOString() } })
export const getCertificate = () => readJson<{ name: string; issuedAt: string } | null>(keys.certificate, null)
export const saveCertificate = (name: string) => writeJson(keys.certificate, { name, issuedAt: new Date().toISOString() })
export const getQuizProfile = () => readJson<QuizProfile | null>(keys.quiz, null)
export const saveQuizProfile = (value: QuizProfile) => writeJson(keys.quiz, value)
export const clearPendingOrder = () => removeStoredValue(keys.pending)
export const setPendingOrder = (value: { plan: PlanId; currency: Currency }) => writeJson(keys.pending, value)
export const getPendingOrder = () => readJson<{ plan: PlanId; currency: Currency } | null>(keys.pending, null)
export const getReferralCode = () => getStoredValue(keys.referral) || undefined
export const rememberReferral = (code: string) => setStoredValue(keys.referral, code.toUpperCase())
export const getMockEvents = () => readJson<MockEvent[]>(keys.events, [])
export const getMockOrders = () => readJson<MockOrder[]>(keys.orders, [])
export const getMockPayouts = () => readJson<MockPayout[]>(keys.payouts, [])
export const getReviews = () => readJson<StudentReview[]>(keys.reviews, sampleReviews)
export function addReview(input: Omit<StudentReview, 'id' | 'createdAt' | 'isSample'>) {
  const review: StudentReview = { ...input, id: makeId(), createdAt: new Date().toISOString() }
  writeJson(keys.reviews, [...getReviews(), review])
  return review
}
export function removeReview(id: string) {
  writeJson(keys.reviews, getReviews().filter((review) => review.id !== id))
}

export function requestMockPayout(code: string, currency: Currency, amount: number) {
  writeJson(keys.payouts, [...getMockPayouts(), { id: makeId(), at: new Date().toISOString(), code, currency, amount, status: 'requested-demo' }])
}

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function trackReferralClick(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return
  rememberReferral(normalized)
  const events = getMockEvents()
  events.push({ id: makeId(), type: 'click', at: new Date().toISOString(), code: normalized, detail: window.location.pathname })
  writeJson(keys.events, events)
}

export function trackDemoSignup(code: string | undefined, userId: string) {
  if (!code) return
  const events = getMockEvents()
  if (events.some((event) => event.type === 'signup' && event.code === code && event.userId === userId)) return
  events.push({ id: makeId(), type: 'signup', at: new Date().toISOString(), code, userId })
  writeJson(keys.events, events)
}

export function trackDemoSale(input: { code?: string; userId: string; plan: PlanId; currency: Currency; amount: number }) {
  const { code, userId, plan, currency, amount } = input
  const orders = getMockOrders()
  orders.push({ id: makeId(), at: new Date().toISOString(), userId, plan, currency, refCode: code, status: 'approved-demo', commission: amount * 0.2 })
  writeJson(keys.orders, orders)
  if (code) {
    const events = getMockEvents()
    events.push({ id: makeId(), type: 'sale', at: new Date().toISOString(), code, userId, value: amount, currency, detail: plan })
    writeJson(keys.events, events)
  }
}

export function formatExpiry(plan: PlanId, start: Date) {
  if (plan === 'lifetime') return undefined
  const expiry = new Date(start)
  expiry.setDate(expiry.getDate() + (plan === 'month' ? 30 : 90))
  return expiry.toISOString()
}
