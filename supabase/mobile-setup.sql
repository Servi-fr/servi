-- ============================================================
-- SERVI — Activation backend complète pour l'app mobile
-- Projet Supabase : sugovioteynfkxbkkzdy (le même que le web)
-- À exécuter dans : Dashboard → SQL Editor → New query → Run
-- 100% idempotent : peut être relancé sans risque.
-- L'app web (Prisma/role postgres) BYPASSE la RLS → rien n'est cassé.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Backfill : une ligne public."User" pour chaque compte auth.
-- ------------------------------------------------------------
insert into public."User" (id, email, name, role, "createdAt", "updatedAt")
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', u.email),
       'CLIENT', now(), now()
from auth.users u
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 1b) Nouvelle colonne : rayon d'intervention (km).
--     (« certifications » et « skills » existent déjà dans le schéma.)
-- ------------------------------------------------------------
alter table public."PrestataireProfile" add column if not exists "radiusKm" integer default 10;

-- ------------------------------------------------------------
-- 2) Droits (grants) pour les rôles anon / authenticated
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public."User", public."PrestataireProfile", public."Review" to anon, authenticated;
grant update on public."User" to authenticated;
grant insert, update on public."PrestataireProfile" to authenticated;
grant select, insert, update on public."Booking" to authenticated;
grant insert on public."Review" to authenticated;
grant select, insert on public."ChatRoom", public."Message" to authenticated;

-- ------------------------------------------------------------
-- 3) RLS
-- ------------------------------------------------------------
alter table public."User"               enable row level security;
alter table public."PrestataireProfile" enable row level security;
alter table public."Review"             enable row level security;
alter table public."Booking"            enable row level security;
alter table public."ChatRoom"           enable row level security;
alter table public."Message"            enable row level security;

-- — User : catalogue prestataires public + chacun lit/édite sa fiche —
drop policy if exists "servi_user_read" on public."User";
create policy "servi_user_read" on public."User"
  for select using (role = 'PRESTATAIRE' or id = auth.uid()::text);

drop policy if exists "servi_user_update_self" on public."User";
create policy "servi_user_update_self" on public."User"
  for update using (id = auth.uid()::text) with check (id = auth.uid()::text);

-- — PrestataireProfile : lecture publique + chacun gère la sienne —
drop policy if exists "servi_prestataire_read" on public."PrestataireProfile";
create policy "servi_prestataire_read" on public."PrestataireProfile"
  for select using (true);

drop policy if exists "servi_prestataire_insert" on public."PrestataireProfile";
create policy "servi_prestataire_insert" on public."PrestataireProfile"
  for insert to authenticated with check ("userId" = auth.uid()::text);

drop policy if exists "servi_prestataire_update" on public."PrestataireProfile";
create policy "servi_prestataire_update" on public."PrestataireProfile"
  for update to authenticated using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

-- — Review : lecture publique + dépôt par l'auteur —
drop policy if exists "servi_review_read" on public."Review";
create policy "servi_review_read" on public."Review"
  for select using (true);

drop policy if exists "servi_review_insert" on public."Review";
create policy "servi_review_insert" on public."Review"
  for insert to authenticated with check ("fromUserId" = auth.uid()::text);

-- — Booking : créer / lire / mettre à jour les siennes —
drop policy if exists "servi_booking_insert" on public."Booking";
create policy "servi_booking_insert" on public."Booking"
  for insert to authenticated with check ("clientId" = auth.uid()::text);

drop policy if exists "servi_booking_read" on public."Booking";
create policy "servi_booking_read" on public."Booking"
  for select to authenticated
  using ("clientId" = auth.uid()::text or "prestataireId" = auth.uid()::text);

drop policy if exists "servi_booking_update" on public."Booking";
create policy "servi_booking_update" on public."Booking"
  for update to authenticated
  using ("clientId" = auth.uid()::text or "prestataireId" = auth.uid()::text)
  with check ("clientId" = auth.uid()::text or "prestataireId" = auth.uid()::text);

-- — ChatRoom : accessible aux 2 parties de la réservation liée —
drop policy if exists "servi_chatroom_access" on public."ChatRoom";
create policy "servi_chatroom_access" on public."ChatRoom"
  for select to authenticated using (
    exists (select 1 from public."Booking" b
            where b.id = public."ChatRoom"."bookingId"
              and (b."clientId" = auth.uid()::text or b."prestataireId" = auth.uid()::text)));

drop policy if exists "servi_chatroom_insert" on public."ChatRoom";
create policy "servi_chatroom_insert" on public."ChatRoom"
  for insert to authenticated with check (
    exists (select 1 from public."Booking" b
            where b.id = public."ChatRoom"."bookingId"
              and (b."clientId" = auth.uid()::text or b."prestataireId" = auth.uid()::text)));

-- — Message : lisible / postable par les 2 parties de la réservation —
drop policy if exists "servi_message_read" on public."Message";
create policy "servi_message_read" on public."Message"
  for select to authenticated using (
    exists (select 1 from public."ChatRoom" r
            join public."Booking" b on b.id = r."bookingId"
            where r.id = public."Message"."chatRoomId"
              and (b."clientId" = auth.uid()::text or b."prestataireId" = auth.uid()::text)));

drop policy if exists "servi_message_insert" on public."Message";
create policy "servi_message_insert" on public."Message"
  for insert to authenticated with check (
    "senderId" = auth.uid()::text and
    exists (select 1 from public."ChatRoom" r
            join public."Booking" b on b.id = r."bookingId"
            where r.id = public."Message"."chatRoomId"
              and (b."clientId" = auth.uid()::text or b."prestataireId" = auth.uid()::text)));

-- — Fonction : ce créneau est-il déjà pris ? (SECURITY DEFINER → ne renvoie qu'un booléen,
--   ne fuite aucune réservation d'autrui) —
create or replace function public.servi_slot_taken(p_prestataire text, p_date timestamptz)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public."Booking"
    where "prestataireId" = p_prestataire
      and date = p_date
      and status in ('PENDING', 'CONFIRMED')
  );
$$;
grant execute on function public.servi_slot_taken(text, timestamptz) to anon, authenticated;

-- ------------------------------------------------------------
-- 4) Prestataires de démonstration (réversibles — voir bloc 5)
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

-- Rayons d'intervention + diplômes/certifications des prestataires de démo
update public."PrestataireProfile" set "radiusKm" = 15, certifications =
  case id
    when 'pp-menage-1'     then E'CléanPro niveau 2\nFormation produits écologiques'
    when 'pp-jardinage-1'  then E'BP Aménagements paysagers\nCertiphyto'
    when 'pp-plomberie-1'  then E'CAP Installateur sanitaire\nHabilitation gaz PGN/PGP'
    when 'pp-electricite-1' then E'CAP Électricien\nHabilitation B1V-BR\nQualifelec'
    when 'pp-coaching-1'   then E'BPJEPS Activités de la forme\nPSC1'
    when 'pp-cours-1'      then E'Agrégation de mathématiques\nMaster MEEF'
    when 'pp-beaute-1'     then E'CAP Coiffure\nBP Coiffure'
    when 'pp-bricolage-1'  then E'CAP Menuiserie\nSST'
    else certifications
  end
where id like 'pp-%';

-- ------------------------------------------------------------
-- 5) (Optionnel) Retirer les prestataires de démonstration :
-- delete from public."PrestataireProfile" where id like 'pp-%';
-- delete from public."User" where id like 'demo-%';
-- ============================================================
