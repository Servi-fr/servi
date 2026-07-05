// Edge Function Supabase — webhook Stripe : marque la réservation payée.
// Déploiement : supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (whsec_...)
// Configurez l'endpoint dans Stripe → Developers → Webhooks :
//   https://<ref>.supabase.co/functions/v1/stripe-webhook  (event: checkout.session.completed)
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret);
  } catch (e) {
    return new Response(`Webhook error: ${(e as Error).message}`, { status: 400 });
  }

  const now = new Date().toISOString();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    // Cas 0 — POURBOIRE : on cumule sur la réservation (le trigger notifie le prestataire).
    if (bookingId && session.metadata?.type === 'tip') {
      const tip = Number(session.metadata?.tip ?? 0);
      if (tip > 0) {
        const { data: bk } = await admin.from('Booking').select('tipAmount').eq('id', bookingId).maybeSingle();
        const total = Math.round((Number(bk?.tipAmount ?? 0) + tip) * 100) / 100;
        await admin.from('Booking').update({ tipAmount: total, updatedAt: now }).eq('id', bookingId);
      }
    } else if (bookingId) {
      // Cas 1 — paiement d'une réservation.
      await admin.from('Booking').update({ paymentStatus: 'SUCCEEDED', updatedAt: now }).eq('id', bookingId);
    }

    // Cas 2 — abonnement (Premium / Pro) : on active le plan sur le compte.
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    if (session.mode === 'subscription' && userId && plan) {
      const subId = (session.subscription as string) ?? crypto.randomUUID();
      await admin.from('User').update({ plan }).eq('id', userId);
      await admin.from('Subscription').upsert({
        id: subId,
        userId,
        plan,
        status: 'active',
        stripeSubId: (session.subscription as string) ?? null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Résiliation d'abonnement → retour au plan gratuit.
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const { data } = await admin.from('Subscription').select('userId').eq('stripeSubId', sub.id).maybeSingle();
    if (data?.userId) {
      await admin.from('User').update({ plan: 'FREE' }).eq('id', data.userId);
      await admin.from('Subscription').update({ status: 'canceled', updatedAt: now }).eq('stripeSubId', sub.id);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
