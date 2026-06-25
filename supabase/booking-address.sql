-- ============================================================
-- SERVI — Adresse d'intervention sur la réservation
-- À exécuter dans Supabase → SQL Editor. Idempotent. Aucune donnée existante touchée.
-- Stocke l'adresse validée (BAN) + les précisions du client sur chaque Booking.
-- Les policies RLS existantes couvrent déjà toutes les colonnes : rien à changer.
-- ============================================================

alter table public."Booking" add column if not exists address text;
alter table public."Booking" add column if not exists notes   text;
