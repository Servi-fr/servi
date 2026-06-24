-- ============================================================
-- SERVI — Activation backend pour l'app mobile
-- Projet Supabase : sugovioteynfkxbkkzdy (le même que le web)
-- À exécuter dans : Dashboard → SQL Editor → New query → Run
-- 100% idempotent : peut être relancé sans risque.
-- L'app web (Prisma/role postgres) BYPASSE la RLS → rien n'est cassé.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Backfill : une ligne public."User" pour chaque compte auth
--    existant (les nouveaux comptes sont gérés par le trigger).
--    Indispensable pour que clientId d'une réservation soit valide.
-- ------------------------------------------------------------
insert into public."User" (id, email, name, role, "createdAt", "updatedAt")
select u.id,
       u.email,
       coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', u.email),
       'CLIENT',
       now(), now()
from auth.users u
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2) Droits + RLS
--    Catalogue prestataires lisible publiquement ; chacun gère ses réservations.
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public."User", public."PrestataireProfile", public."Review" to anon, authenticated;
grant select, insert on public."Booking" to authenticated;

alter table public."User"               enable row level security;
alter table public."PrestataireProfile" enable row level security;
alter table public."Review"             enable row level security;
alter table public."Booking"            enable row level security;

-- Prestataires (role PRESTATAIRE) lisibles par tous ; chacun voit aussi sa propre ligne.
drop policy if exists "servi_user_read" on public."User";
create policy "servi_user_read" on public."User"
  for select using (role = 'PRESTATAIRE' or id = auth.uid()::text);

-- Chacun peut mettre à jour sa propre fiche.
drop policy if exists "servi_user_update_self" on public."User";
create policy "servi_user_update_self" on public."User"
  for update using (id = auth.uid()::text) with check (id = auth.uid()::text);

-- Profils prestataires : lecture publique (catalogue).
drop policy if exists "servi_prestataire_read" on public."PrestataireProfile";
create policy "servi_prestataire_read" on public."PrestataireProfile"
  for select using (true);

-- Avis : lecture publique.
drop policy if exists "servi_review_read" on public."Review";
create policy "servi_review_read" on public."Review"
  for select using (true);

-- Réservations : un utilisateur connecté crée et lit les siennes.
drop policy if exists "servi_booking_insert" on public."Booking";
create policy "servi_booking_insert" on public."Booking"
  for insert to authenticated
  with check ("clientId" = auth.uid()::text);

drop policy if exists "servi_booking_read" on public."Booking";
create policy "servi_booking_read" on public."Booking"
  for select to authenticated
  using ("clientId" = auth.uid()::text or "prestataireId" = auth.uid()::text);

-- ------------------------------------------------------------
-- 3) Prestataires de démonstration (réversibles — voir bloc 4)
--    service = nom de catégorie (l'app le mappe automatiquement).
-- ------------------------------------------------------------
insert into public."User" (id, email, name, role, image, "createdAt", "updatedAt") values
  ('demo-menage-1',     'demo.menage@serviapp.app',     'Awa Diop',      'PRESTATAIRE', null, now(), now()),
  ('demo-jardinage-1',  'demo.jardinage@serviapp.app',  'Hugo Bernard',  'PRESTATAIRE', null, now(), now()),
  ('demo-plomberie-1',  'demo.plomberie@serviapp.app',  'Karim Haddad',  'PRESTATAIRE', null, now(), now()),
  ('demo-electricite-1','demo.electricite@serviapp.app','Sofia Lopez',   'PRESTATAIRE', null, now(), now()),
  ('demo-coaching-1',   'demo.coaching@serviapp.app',   'Marc Lefevre',  'PRESTATAIRE', null, now(), now()),
  ('demo-cours-1',      'demo.cours@serviapp.app',      'Julien Mercier','PRESTATAIRE', null, now(), now()),
  ('demo-beaute-1',     'demo.beaute@serviapp.app',     'Chloé Dubois',  'PRESTATAIRE', null, now(), now()),
  ('demo-bricolage-1',  'demo.bricolage@serviapp.app',  'Paul Girard',   'PRESTATAIRE', null, now(), now())
on conflict (id) do nothing;

insert into public."PrestataireProfile" (id, "userId", service, "hourlyRate", description, skills, rating, zone) values
  ('pp-menage-1','demo-menage-1','Ménage',25,'10 ans d''expérience dans l''entretien de domiciles. Produits écologiques, ponctualité garantie.', array['Ménage','Repassage','Vitres'],4.9,'Paris 11e'),
  ('pp-jardinage-1','demo-jardinage-1','Jardinage',30,'Paysagiste diplômé : tonte, taille, plantation et conseils d''aménagement.', array['Tonte','Taille','Plantation'],4.9,'Boulogne'),
  ('pp-plomberie-1','demo-plomberie-1','Plomberie',45,'Artisan plombier, intervention en urgence 7j/7. Devis transparent avant intervention.', array['Dépannage','Sanitaire','Chauffe-eau'],4.9,'Paris 12e'),
  ('pp-electricite-1','demo-electricite-1','Électricité',50,'Mise aux normes, tableaux électriques, dépannage. Certifiée Qualifelec.', array['Dépannage','Mise aux normes','Domotique'],4.9,'Paris 18e'),
  ('pp-coaching-1','demo-coaching-1','Coaching',40,'Coach sportif diplômé. Programmes personnalisés à domicile ou en extérieur.', array['Remise en forme','Renforcement','Perte de poids'],5.0,'Paris 8e'),
  ('pp-cours-1','demo-cours-1','Cours particuliers',28,'Agrégé de mathématiques. Préparation bac, prépa et concours.', array['Maths','Physique','Méthodologie'],4.9,'Paris 5e'),
  ('pp-beaute-1','demo-beaute-1','Beauté',35,'Coiffeuse professionnelle : coupe, couleur, coiffure événementielle à domicile.', array['Coupe','Couleur','Mariage'],4.9,'Paris 16e'),
  ('pp-bricolage-1','demo-bricolage-1','Bricolage',38,'Homme toutes mains : montage de meubles, fixations, petites réparations.', array['Montage','Réparations','Pose'],4.8,'Paris 20e')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 4) (Optionnel) Retirer les prestataires de démonstration :
-- delete from public."PrestataireProfile" where id like 'pp-%';
-- delete from public."User" where id like 'demo-%';
-- ============================================================
