-- ============================================================
-- SERVI — Nettoyage des données de démonstration
-- À exécuter AVANT l'ouverture au grand public (Dashboard → SQL Editor).
-- Supprime les 8 prestataires de démo + leurs réservations de test.
-- (Pense aussi à mettre EXPO_PUBLIC_USE_SEED_FALLBACK=false au build.)
-- ============================================================

-- Réservations de test liées aux prestataires de démo
delete from public."Message"
  where "chatRoomId" in (
    select r.id from public."ChatRoom" r
    join public."Booking" b on b.id = r."bookingId"
    where b."prestataireId" like 'demo-%'
  );
delete from public."ChatRoom"
  where "bookingId" in (select id from public."Booking" where "prestataireId" like 'demo-%');
delete from public."Review"
  where "bookingId" in (select id from public."Booking" where "prestataireId" like 'demo-%');
delete from public."Booking" where "prestataireId" like 'demo-%';

-- Profils + comptes de démo
delete from public."PrestataireProfile" where id like 'pp-%';
delete from public."User" where id like 'demo-%';

-- ✅ Les vrais comptes (dont le tien) ne sont pas touchés.
