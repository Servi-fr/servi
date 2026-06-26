-- ============================================================
-- SERVI — Demandes de prestation (intake client + matchmaking)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- ============================================================
create table if not exists public."ServiceRequest" (
  id          text primary key,
  "userId"    text not null references public."User"(id) on delete cascade,
  category    text not null,
  frequency   text,            -- Ponctuel | Hebdomadaire | Mensuel
  details     text,
  address     text,
  lat         double precision,
  lng         double precision,
  status      text not null default 'open',
  "createdAt" timestamptz not null default now()
);
create index if not exists idx_servicerequest_cat on public."ServiceRequest"(category);

alter table public."ServiceRequest" enable row level security;
grant select, insert, update, delete on public."ServiceRequest" to authenticated;

drop policy if exists "servi_request_own" on public."ServiceRequest";
create policy "servi_request_own" on public."ServiceRequest"
  for all to authenticated
  using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);
