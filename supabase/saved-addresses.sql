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
