-- ============================================================
-- SERVI — SIRET sur le profil prestataire
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- ============================================================
alter table public."PrestataireProfile" add column if not exists siret text;
