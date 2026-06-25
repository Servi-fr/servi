// Edge Function Supabase — envoie une notification push (Expo) à la création d'une Notification.
// Déclencheur : Database Webhook sur INSERT de la table "Notification" → cette fonction.
// Déploiement : supabase functions deploy send-push --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    // Un Database Webhook envoie { type, table, record, old_record }.
    const notif = payload.record ?? payload;
    if (!notif?.userId) return new Response('no-user', { status: 200 });

    const { data: user } = await admin.from('User').select('pushToken').eq('id', notif.userId).single();
    const token = user?.pushToken;
    if (!token) return new Response('no-token', { status: 200 });

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title: notif.title ?? 'SERVI',
        body: notif.message ?? '',
        data: { link: notif.link ?? null },
      }),
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(String((e as Error)?.message ?? e), { status: 500 });
  }
});
