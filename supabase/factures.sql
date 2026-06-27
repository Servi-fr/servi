-- ============================================================
-- SERVI — Devis & Factures (P-3)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- Une seule table : type = 'devis' | 'facture'.
-- ============================================================
create table if not exists public."BillingDoc" (
  id              text primary key,
  type            text not null,                 -- devis | facture
  number          text not null,                 -- ex. FACT-2026-0001 / DEV-2026-0001
  "bookingId"     text references public."Booking"(id) on delete set null,
  "prestataireId" text not null references public."User"(id) on delete cascade,
  "clientName"    text,
  service         text,
  total           double precision,
  "createdAt"     timestamptz not null default now()
);
create index if not exists idx_billingdoc_presta on public."BillingDoc"("prestataireId");

alter table public."BillingDoc" enable row level security;
grant select, insert on public."BillingDoc" to authenticated;

drop policy if exists "servi_billing_own" on public."BillingDoc";
create policy "servi_billing_own" on public."BillingDoc"
  for all to authenticated
  using ("prestataireId" = auth.uid()::text) with check ("prestataireId" = auth.uid()::text);
