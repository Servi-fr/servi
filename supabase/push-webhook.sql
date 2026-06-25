-- ============================================================
-- SERVI — Webhook push en SQL (équivalent d'un Database Webhook)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
-- À chaque Notification créée → appelle l'Edge Function send-push (via pg_net).
-- ============================================================

-- pg_net : permet à Postgres d'appeler une URL (déjà dispo sur Supabase).
create extension if not exists pg_net;

create or replace function public.servi_push_on_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://sugovioteynfkxbkkzdy.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_Zsz2XP1t78deqQJ9sC1FTQ_PZCuybu_'
    ),
    body := jsonb_build_object('type', 'INSERT', 'table', 'Notification', 'record', to_jsonb(new))
  );
  return new;
end; $$;

drop trigger if exists trg_servi_push on public."Notification";
create trigger trg_servi_push
  after insert on public."Notification"
  for each row execute function public.servi_push_on_notification();

-- Vérif rapide : le trigger est bien là ?
-- select tgname from pg_trigger where tgrelid = 'public."Notification"'::regclass and not tgisinternal;
