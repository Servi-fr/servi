-- ============================================================
-- SERVI — TOUTES les migrations (idempotent, relançable)
-- Colle ce fichier entier dans Supabase → SQL Editor → Run.
-- (N'inclut PAS mobile-setup.sql ni cleanup-demo-data.sql)
-- ============================================================

-- ▼▼▼ notifications-storage.sql ▼▼▼
-- ============================================================
-- SERVI — Notifications + photos de profil (Storage)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Colonne token push (pour les notifications device)
-- ------------------------------------------------------------
alter table public."User" add column if not exists "pushToken" text;

-- ------------------------------------------------------------
-- 2) Notifications in-app : RLS (chacun lit/maj les siennes)
-- ------------------------------------------------------------
grant select, update on public."Notification" to authenticated;
alter table public."Notification" enable row level security;

drop policy if exists "servi_notif_read" on public."Notification";
create policy "servi_notif_read" on public."Notification"
  for select to authenticated using ("userId" = auth.uid()::text);

drop policy if exists "servi_notif_update" on public."Notification";
create policy "servi_notif_update" on public."Notification"
  for update to authenticated using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

-- ------------------------------------------------------------
-- 3) Trigger : nouvelle réservation → notif au prestataire
-- ------------------------------------------------------------
create or replace function public.servi_notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare client_name text;
begin
  select coalesce(name, 'Un client') into client_name from public."User" where id = new."clientId";
  insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
  values (gen_random_uuid()::text, new."prestataireId", 'booking',
          'Nouvelle demande de réservation',
          client_name || ' souhaite réserver « ' || new.service || ' »',
          false, '/booking/' || new.id, now(), now());
  return new;
end; $$;

drop trigger if exists trg_servi_notify_new_booking on public."Booking";
create trigger trg_servi_notify_new_booking
  after insert on public."Booking"
  for each row execute function public.servi_notify_new_booking();

-- ------------------------------------------------------------
-- 4) Trigger : changement de statut → notif au client
-- ------------------------------------------------------------
create or replace function public.servi_notify_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare pro_name text; label text;
begin
  if new.status is distinct from old.status then
    select coalesce(name, 'Le prestataire') into pro_name from public."User" where id = new."prestataireId";
    label := case new.status::text
      when 'CONFIRMED' then 'acceptée ✅'
      when 'CANCELLED' then 'refusée / annulée'
      when 'COMPLETED' then 'terminée'
      else new.status::text end;
    insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
    values (gen_random_uuid()::text, new."clientId", 'booking',
            'Réservation ' || label,
            pro_name || ' — « ' || new.service || ' »',
            false, '/booking/' || new.id, now(), now());
  end if;
  return new;
end; $$;

drop trigger if exists trg_servi_notify_booking_status on public."Booking";
create trigger trg_servi_notify_booking_status
  after update on public."Booking"
  for each row execute function public.servi_notify_booking_status();

-- ------------------------------------------------------------
-- 5) Storage : bucket public « avatars » (photos de profil)
--    Lecture publique ; chaque user n'écrit que dans son dossier {uid}/...
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "servi_avatars_read" on storage.objects;
create policy "servi_avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "servi_avatars_insert" on storage.objects;
create policy "servi_avatars_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "servi_avatars_update" on storage.objects;
create policy "servi_avatars_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ▼▼▼ client-profile-fix.sql ▼▼▼
-- ============================================================
-- SERVI — Fix réservations : tout utilisateur doit avoir une ClientProfile
-- À exécuter dans Supabase → SQL Editor. Idempotent.
--
-- Cause du bug : la table Booking a une FK "Booking_clientProfile_fkey" qui
-- exige que le clientId existe dans ClientProfile.userId. Or les comptes créés
-- via l'app mobile n'ont qu'un User (+ parfois un PrestataireProfile), jamais
-- de ClientProfile → l'insert de réservation échoue (violation de FK) → aucune
-- réservation n'est créée. On garantit donc une ClientProfile pour chacun.
-- ============================================================

-- 1) Backfill : une ClientProfile pour chaque User qui n'en a pas encore.
insert into public."ClientProfile" (id, "userId", strengths, rating)
select gen_random_uuid()::text, u.id, '{}'::text[], 0
from public."User" u
where not exists (select 1 from public."ClientProfile" c where c."userId" = u.id);

-- 2) Trigger : tout nouvel utilisateur reçoit automatiquement sa ClientProfile.
create or replace function public.servi_ensure_client_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public."ClientProfile" (id, "userId", strengths, rating)
    values (gen_random_uuid()::text, new.id, '{}'::text[], 0)
    on conflict ("userId") do nothing;
  exception when others then
    null; -- ne bloque jamais la création du compte
  end;
  return new;
end; $$;

drop trigger if exists trg_servi_ensure_client_profile on public."User";
create trigger trg_servi_ensure_client_profile
  after insert on public."User"
  for each row execute function public.servi_ensure_client_profile();

-- Vérif : nombre de users encore sans ClientProfile (doit renvoyer 0)
-- select count(*) from public."User" u
--   where not exists (select 1 from public."ClientProfile" c where c."userId" = u.id);

-- ▼▼▼ harden-triggers.sql ▼▼▼
-- ============================================================
-- SERVI — Durcissement des triggers (notif + push)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- Objectif : une erreur dans la notif OU le push ne doit JAMAIS
-- annuler (rollback) la réservation. On encapsule tout dans des
-- blocs exception qui avalent l'erreur silencieusement.
-- ============================================================

-- 1) Nouvelle réservation → notif au prestataire (best-effort)
create or replace function public.servi_notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare client_name text;
begin
  begin
    select coalesce(name, 'Un client') into client_name from public."User" where id = new."clientId";
    insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
    values (gen_random_uuid()::text, new."prestataireId", 'booking',
            'Nouvelle demande de réservation',
            client_name || ' souhaite réserver « ' || new.service || ' »',
            false, '/booking/' || new.id, now(), now());
  exception when others then
    null; -- on ne bloque jamais la création de la réservation
  end;
  return new;
end; $$;

-- 2) Changement de statut → notif au client (best-effort)
create or replace function public.servi_notify_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare pro_name text; label text;
begin
  begin
    if new.status is distinct from old.status then
      select coalesce(name, 'Le prestataire') into pro_name from public."User" where id = new."prestataireId";
      label := case new.status::text
        when 'CONFIRMED' then 'acceptée ✅'
        when 'CANCELLED' then 'refusée / annulée'
        when 'COMPLETED' then 'terminée'
        else new.status::text end;
      insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
      values (gen_random_uuid()::text, new."clientId", 'booking',
              'Réservation ' || label,
              pro_name || ' — « ' || new.service || ' »',
              false, '/booking/' || new.id, now(), now());
    end if;
  exception when others then
    null;
  end;
  return new;
end; $$;

-- 3) Notification créée → push device (best-effort)
create or replace function public.servi_push_on_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform net.http_post(
      url := 'https://sugovioteynfkxbkkzdy.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_Zsz2XP1t78deqQJ9sC1FTQ_PZCuybu_'
      ),
      body := jsonb_build_object('type', 'INSERT', 'table', 'Notification', 'record', to_jsonb(new))
    );
  exception when others then
    null; -- un échec d'envoi push ne bloque pas la notif
  end;
  return new;
end; $$;

-- ▼▼▼ push-webhook.sql ▼▼▼
-- ============================================================
-- SERVI — Webhook push en SQL (équivalent d'un Database Webhook)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- À chaque Notification créée → appelle l'Edge Function send-push (via pg_net).
-- ============================================================

-- pg_net : permet à Postgres d'appeler une URL (déjà dispo sur Supabase).
create extension if not exists pg_net;

create or replace function public.servi_push_on_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://sugovioteynfkxbkkzdy.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_Zsz2XP1t78deqQJ9sC1FTQ_PZCuybu_'
    ),
    body := jsonb_build_object('type', 'INSERT', 'table', 'Notification', 'record', to_jsonb(new))
  );
  return new;
end; $$;

drop trigger if exists trg_servi_push on public."Notification";
create trigger trg_servi_push
  after insert on public."Notification"
  for each row execute function public.servi_push_on_notification();

-- Vérif rapide : le trigger est bien là ?
-- select tgname from pg_trigger where tgrelid = 'public."Notification"'::regclass and not tgisinternal;

-- ▼▼▼ booking-address.sql ▼▼▼
-- ============================================================
-- SERVI — Adresse d'intervention sur la réservation
-- À exécuter dans Supabase → SQL Editor. Idempotent. Aucune donnée existante touchée.
-- Stocke l'adresse validée (BAN) + les précisions du client sur chaque Booking.
-- Les policies RLS existantes couvrent déjà toutes les colonnes : rien à changer.
-- ============================================================

alter table public."Booking" add column if not exists address text;
alter table public."Booking" add column if not exists notes   text;

-- ▼▼▼ membership.sql ▼▼▼
-- ============================================================
-- SERVI — Paliers membres (Free / Premium / Pro)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- ============================================================

-- Palier sur le compte (client: FREE|PREMIUM ; prestataire: FREE|PRO).
alter table public."User" add column if not exists plan text not null default 'FREE';

-- Abonnement Stripe Billing (rempli par le webhook Stripe).
create table if not exists public."Subscription" (
  id               text primary key,
  "userId"         text not null references public."User"(id) on delete cascade,
  plan             text not null,                 -- PREMIUM | PRO
  status           text not null default 'active',-- active | canceled | past_due
  "stripeSubId"    text,
  "currentPeriodEnd" timestamptz,
  "createdAt"      timestamptz not null default now(),
  "updatedAt"      timestamptz not null default now()
);

alter table public."Subscription" enable row level security;
grant select on public."Subscription" to authenticated;
drop policy if exists "servi_sub_read" on public."Subscription";
create policy "servi_sub_read" on public."Subscription"
  for select to authenticated using ("userId" = auth.uid()::text);

-- ▼▼▼ saved-addresses.sql ▼▼▼
-- ============================================================
-- SERVI — Carnet d'adresses client (adresses d'intervention enregistrées)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- ============================================================

create table if not exists public."SavedAddress" (
  id          text primary key,
  "userId"    text not null references public."User"(id) on delete cascade,
  label       text not null,            -- "Domicile", "Bureau", "Maman"…
  address     text not null,            -- libellé complet (validé BAN)
  lat         double precision,
  lng         double precision,
  "isDefault" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_savedaddress_user on public."SavedAddress"("userId");

alter table public."SavedAddress" enable row level security;
grant select, insert, update, delete on public."SavedAddress" to authenticated;

drop policy if exists "servi_addr_all" on public."SavedAddress";
create policy "servi_addr_all" on public."SavedAddress"
  for all to authenticated
  using ("userId" = auth.uid()::text)
  with check ("userId" = auth.uid()::text);

-- ▼▼▼ prestataire-siret.sql ▼▼▼
-- ============================================================
-- SERVI — Colonnes "extras" du profil prestataire (SIRET, logo, relance)
-- À exécuter dans Supabase → SQL Editor. Idempotent (relançable sans risque).
-- ============================================================
alter table public."PrestataireProfile" add column if not exists siret       text;
alter table public."PrestataireProfile" add column if not exists logo        text;  -- URL du logo (bucket avatars)
alter table public."PrestataireProfile" add column if not exists "relanceDays" integer not null default 0; -- relance auto après N jours sans nouvelle (0 = désactivé), réservé Premium
