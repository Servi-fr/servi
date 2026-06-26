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
