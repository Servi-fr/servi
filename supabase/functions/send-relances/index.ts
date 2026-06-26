// SERVI — Relances auto (prestataires Pro). Scaffold.
// Déployer : supabase functions deploy send-relances --no-verify-jwt
// Planifier : voir supabase/relances-cron.sql (appel quotidien).
//
// ⚠️ Scaffold : la détection "client sans nouvelle" utilise ici Booking.updatedAt
// comme proxy. En prod, s'appuyer sur l'horodatage du dernier Message du ChatRoom
// et stocker un "lastRelancedAt" pour éviter les relances répétées.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async () => {
  try {
    const now = Date.now();
    let sent = 0;

    // 1) Prestataires Pro ayant activé la relance (relanceDays > 0).
    const { data: pros } = await supabase
      .from('PrestataireProfile')
      .select('userId, relanceDays, User!inner(plan, name)')
      .gt('relanceDays', 0);

    for (const pro of (pros ?? []) as any[]) {
      if (pro.User?.plan !== 'PRO') continue; // réservé Premium/Pro
      const cutoff = new Date(now - pro.relanceDays * 86400000).toISOString();

      // 2) Réservations actives sans activité depuis le délai.
      const { data: bookings } = await supabase
        .from('Booking')
        .select('id, clientId')
        .eq('prestataireId', pro.userId)
        .in('status', ['PENDING', 'CONFIRMED'])
        .lt('updatedAt', cutoff);

      for (const b of (bookings ?? []) as any[]) {
        // 3) Notifie le client (le trigger push prend le relais).
        await supabase.from('Notification').insert({
          id: crypto.randomUUID(),
          userId: b.clientId,
          type: 'relance',
          title: 'Un prestataire vous relance',
          message: `${pro.User?.name ?? 'Votre prestataire'} attend de vos nouvelles pour votre demande.`,
          read: false,
          link: `/booking/${b.id}`,
          createdAt: new Date(now).toISOString(),
          updatedAt: new Date(now).toISOString(),
        });
        sent++;
      }
    }
    return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
