-- ============================================================
-- SERVI — Annonces sponsorisées (B6 : prestataires mis en avant sur l'accueil)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- ============================================================
create table if not exists public."SponsoredListing" (
  id              text primary key,
  "prestataireId" text not null references public."User"(id) on delete cascade,
  category        text,
  city            text,
  status          text not null default 'active',  -- active | paused
  "createdAt"     timestamptz not null default now()
);
create index if not exists idx_sponsored_status on public."SponsoredListing"(status);

alter table public."SponsoredListing" enable row level security;
grant select on public."SponsoredListing" to anon, authenticated;
grant insert, update, delete on public."SponsoredListing" to authenticated;

-- Lecture publique (pour afficher les mises en avant à tous).
drop policy if exists "servi_sponsored_read" on public."SponsoredListing";
create policy "servi_sponsored_read" on public."SponsoredListing" for select using (true);

-- Le prestataire gère ses propres mises en avant.
drop policy if exists "servi_sponsored_own" on public."SponsoredListing";
create policy "servi_sponsored_own" on public."SponsoredListing"
  for all to authenticated
  using ("prestataireId" = auth.uid()::text) with check ("prestataireId" = auth.uid()::text);
