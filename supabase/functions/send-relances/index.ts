// SERVI — Relances auto des clients (prestataires Premium/Pro).
// Déployer : supabase functions deploy send-relances --no-verify-jwt
// Planifier : voir supabase/relances-cron.sql (appel quotidien à 9h).
// Prérequis SQL : colonne Booking."lastRelancedAt" (cf. run-all-migrations.sql).
//
// Anti-spam : une réservation n'est relancée qu'au plus UNE fois par période
// (relanceDays). On lit/écrit Booking."lastRelancedAt" pour ne jamais répéter.
// Proxy "client sans nouvelle" = Booking.updatedAt (réinitialisé à chaque
// changement de statut). À affiner plus tard avec le dernier Message du ChatRoom.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async () => {
  try {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    let sent = 0;

    // 1) Prestataires ayant activé la relance (relanceDays > 0) — réservé au plan PRO.
    const { data: pros } = await supabase
      .from('PrestataireProfile')
      .select('userId, relanceDays, User!inner(plan, name)')
      .gt('relanceDays', 0);

    for (const pro of (pros ?? []) as any[]) {
      if (pro.User?.plan !== 'PRO') continue; // fonctionnalité Premium/Pro uniquement
      const cutoff = new Date(now - pro.relanceDays * 86400000).toISOString();

      // 2) Réservations actives, sans activité depuis le délai.
      const { data: bookings } = await supabase
        .from('Booking')
        .select('id, clientId, lastRelancedAt')
        .eq('prestataireId', pro.userId)
        .in('status', ['PENDING', 'CONFIRMED'])
        .lt('updatedAt', cutoff);

      for (const b of (bookings ?? []) as any[]) {
        // Déjà relancée dans la période courante ? On saute (au plus 1 relance / période).
        if (b.lastRelancedAt && new Date(b.lastRelancedAt).getTime() > now - pro.relanceDays * 86400000) {
          continue;
        }

        // 3) Notifie le client (le trigger push prend le relais).
        const { error: notifErr } = await supabase.from('Notification').insert({
          id: crypto.randomUUID(),
          userId: b.clientId,
          type: 'relance',
          title: 'Un prestataire vous relance',
          message: `${pro.User?.name ?? 'Votre prestataire'} attend de vos nouvelles pour votre demande.`,
          read: false,
          link: `/booking/${b.id}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        if (notifErr) continue;

        // 4) Mémorise la relance pour ne pas la répéter.
        await supabase.from('Booking').update({ lastRelancedAt: nowIso }).eq('id', b.id);
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
