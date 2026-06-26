-- ============================================================
-- SERVI — Planification des relances auto (B2)
-- Prérequis : déployer la fonction → supabase functions deploy send-relances --no-verify-jwt
-- Puis exécuter ce SQL (appel quotidien à 9h).
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('servi-relances-daily', '0 9 * * *', $$
  select net.http_post(
    url := 'https://sugovioteynfkxbkkzdy.supabase.co/functions/v1/send-relances',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_Zsz2XP1t78deqQJ9sC1FTQ_PZCuybu_'
    )
  );
$$);

-- Pour arrêter : select cron.unschedule('servi-relances-daily');
