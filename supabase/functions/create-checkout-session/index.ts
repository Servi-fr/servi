// Edge Function Supabase — crée une session Stripe Checkout pour une réservation.
// Déploiement : supabase functions deploy create-checkout-session
// Secret requis : supabase secrets set STRIPE_SECRET_KEY=sk_live_...
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.)
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return json({ error: 'bookingId requis' }, 400);

    // Le montant fait autorité côté serveur (jamais le client) → anti-fraude.
    const { data: booking, error } = await admin
      .from('Booking')
      .select('id,service,price,commission')
      .eq('id', bookingId)
      .single();
    if (error || !booking) return json({ error: 'Réservation introuvable' }, 404);

    const amount = Math.round((Number(booking.price) + Number(booking.commission)) * 100);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: amount,
            product_data: { name: `SERVI — ${booking.service}` },
          },
        },
      ],
      metadata: { bookingId },
      success_url: 'serviapp://payment/return?status=success',
      cancel_url: 'serviapp://payment/return?status=cancel',
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
