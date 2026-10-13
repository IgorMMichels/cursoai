-- Provisiona perfil, papel de aluno e link de afiliado somente depois que o e-mail é confirmado.
-- Cadastros não confirmados não reservam o @id nem recebem affiliate_profiles ativo.

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  attributed_code text;
begin
  -- Conta sem e-mail confirmado: nada é criado ainda. O provisionamento roda na confirmação.
  if new.email_confirmed_at is null then
    return new;
  end if;

  -- Já provisionada (evita conflito em atualizações posteriores de auth.users).
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  if requested_username = '' then
    requested_username := 'user-' || substr(replace(new.id::text, '-', ''), 1, 16);
  end if;
  if not public.is_affiliate_username_available(requested_username) then
    raise exception 'ID indisponível. Use um ID único de 3 a 24 caracteres.' using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), requested_username);

  insert into public.app_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  insert into public.affiliate_profiles (user_id, referral_code, commission_bps, active)
  values (new.id, requested_username, 2000, true)
  on conflict (user_id) do nothing;

  attributed_code := public.resolve_affiliate_referral_code(new.raw_user_meta_data ->> 'referral_code');
  if attributed_code is not null then
    insert into public.affiliate_events (referral_code, event_type, user_id, source_path)
    values (attributed_code, 'signup', new.id, '/login');
  end if;

  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

-- Dispara no insert (conta já confirmada, ex.: criada pelo painel) e na confirmação do e-mail.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute procedure public.create_profile_for_new_user();
