-- ============================================================
-- SERVI — Colonnes "extras" du profil prestataire (SIRET, logo, relance, photos)
-- À exécuter dans Supabase → SQL Editor. Idempotent (relançable sans risque).
-- ============================================================
alter table public."PrestataireProfile" add column if not exists siret        text;
alter table public."PrestataireProfile" add column if not exists logo         text;   -- URL du logo (bucket avatars)
alter table public."PrestataireProfile" add column if not exists "relanceDays" integer not null default 0; -- relance auto après N jours (0 = off), Premium
alter table public."PrestataireProfile" add column if not exists photos       text[];  -- galerie de réalisations (URLs)
alter table public."PrestataireProfile" add column if not exists experience   integer; -- années d'expérience
