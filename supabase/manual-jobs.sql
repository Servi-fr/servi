-- ============================================================
-- SERVI — Missions perso du prestataire (clients hors SERVI)
-- À exécuter dans Supabase → SQL Editor. Idempotent. (Déjà appliqué en base.)
-- ============================================================
create table if not exists public."ManualJob" (
  id            text primary key default gen_random_uuid()::text,
  "proId"       text not null references public."User"(id) on delete cascade,
  "clientName"  text not null,
  "clientPhone" text,
  service       text not null,
  date          timestamptz not null,
  "durationMin" integer not null default 60,
  price         double precision not null default 0,
  address       text,
  notes         text,
  status        text not null default 'PLANNED', -- PLANNED | DONE | CANCELLED
  "createdAt"   timestamptz not null default now()
);
create index if not exists idx_manualjob_pro on public."ManualJob"("proId", date);

alter table public."ManualJob" enable row level security;
grant select, insert, update, delete on public."ManualJob" to authenticated;
drop policy if exists "servi_manualjob_own" on public."ManualJob";
create policy "servi_manualjob_own" on public."ManualJob"
  for all to authenticated
  using ("proId" = auth.uid()::text) with check ("proId" = auth.uid()::text);
