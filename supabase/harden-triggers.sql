-- ============================================================
-- SERVI — Durcissement des triggers (notif + push)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- Objectif : une erreur dans la notif OU le push ne doit JAMAIS
-- annuler (rollback) la réservation. On encapsule tout dans des
-- blocs exception qui avalent l'erreur silencieusement.
-- ============================================================

-- 1) Nouvelle réservation → notif au prestataire (best-effort)
create or replace function public.servi_notify_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare client_name text;
begin
  begin
    select coalesce(name, 'Un client') into client_name from public."User" where id = new."clientId";
    insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
    values (gen_random_uuid()::text, new."prestataireId", 'booking',
            'Nouvelle demande de réservation',
            client_name || ' souhaite réserver « ' || new.service || ' »',
            false, '/booking/' || new.id, now(), now());
  exception when others then
    null; -- on ne bloque jamais la création de la réservation
  end;
  return new;
end; $$;

-- 2) Changement de statut → notif au client (best-effort)
create or replace function public.servi_notify_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare pro_name text; label text;
begin
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
  exception when others then
    null;
  end;
  return new;
end; $$;

-- 3) Notification créée → push device (best-effort)
create or replace function public.servi_push_on_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform net.http_post(
      url := 'https://sugovioteynfkxbkkzdy.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_Zsz2XP1t78deqQJ9sC1FTQ_PZCuybu_'
      ),
      body := jsonb_build_object('type', 'INSERT', 'table', 'Notification', 'record', to_jsonb(new))
    );
  exception when others then
    null; -- un échec d'envoi push ne bloque pas la notif
  end;
  return new;
end; $$;
