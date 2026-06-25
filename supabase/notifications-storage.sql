-- ============================================================
-- SERVI — Notifications + photos de profil (Storage)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Colonne token push (pour les notifications device)
-- ------------------------------------------------------------
alter table public."User" add column if not exists "pushToken" text;

-- ------------------------------------------------------------
-- 2) Notifications in-app : RLS (chacun lit/maj les siennes)
-- ------------------------------------------------------------
grant select, update on public."Notification" to authenticated;
alter table public."Notification" enable row level security;

drop policy if exists "servi_notif_read" on public."Notification";
create policy "servi_notif_read" on public."Notification"
  for select to authenticated using ("userId" = auth.uid()::text);

drop policy if exists "servi_notif_update" on public."Notification";
create policy "servi_notif_update" on public."Notification"
  for update to authenticated using ("userId" = auth.uid()::text) with check ("userId" = auth.uid()::text);

-- ------------------------------------------------------------
-- 3) Trigger : nouvelle réservation → notif au prestataire
-- ------------------------------------------------------------
create or replace function public.servi_notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare client_name text;
begin
  select coalesce(name, 'Un client') into client_name from public."User" where id = new."clientId";
  insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
  values (gen_random_uuid()::text, new."prestataireId", 'booking',
          'Nouvelle demande de réservation',
          client_name || ' souhaite réserver « ' || new.service || ' »',
          false, '/booking/' || new.id, now(), now());
  return new;
end; $$;

drop trigger if exists trg_servi_notify_new_booking on public."Booking";
create trigger trg_servi_notify_new_booking
  after insert on public."Booking"
  for each row execute function public.servi_notify_new_booking();

-- ------------------------------------------------------------
-- 4) Trigger : changement de statut → notif au client
-- ------------------------------------------------------------
create or replace function public.servi_notify_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare pro_name text; label text;
begin
  if new.status is distinct from old.status then
    select coalesce(name, 'Le prestataire') into pro_name from public."User" where id = new."prestataireId";
    label := case new.status::text
      when 'CONFIRMED' then 'acceptée ✅'
      when 'CANCELLED' then 'refusée / annulée'
      when 'COMPLETED' then 'terminée'
      else new.status::text end;
    insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
    values (gen_random_uuid()::text, new."clientId", 'booking',
            'Réservation ' || label,
            pro_name || ' — « ' || new.service || ' »',
            false, '/booking/' || new.id, now(), now());
  end if;
  return new;
end; $$;

drop trigger if exists trg_servi_notify_booking_status on public."Booking";
create trigger trg_servi_notify_booking_status
  after update on public."Booking"
  for each row execute function public.servi_notify_booking_status();

-- ------------------------------------------------------------
-- 5) Storage : bucket public « avatars » (photos de profil)
--    Lecture publique ; chaque user n'écrit que dans son dossier {uid}/...
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "servi_avatars_read" on storage.objects;
create policy "servi_avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "servi_avatars_insert" on storage.objects;
create policy "servi_avatars_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "servi_avatars_update" on storage.objects;
create policy "servi_avatars_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
