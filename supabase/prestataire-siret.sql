-- ============================================================
-- SERVI — SIRET + logo sur le profil prestataire
-- À exécuter dans Supabase → SQL Editor. Idempotent (relançable sans risque).
-- ============================================================
alter table public."PrestataireProfile" add column if not exists siret text;
alter table public."PrestataireProfile" add column if not exists logo  text; -- URL du logo (bucket avatars)
