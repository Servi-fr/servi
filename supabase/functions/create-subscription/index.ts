// SERVI — Abonnement (Stripe Billing). À déployer : supabase functions deploy create-subscription
// Secrets requis : STRIPE_SECRET_KEY, STRIPE_PRICE_PREMIUM, STRIPE_PRICE_PRO.
// Un webhook Stripe (checkout.session.completed / customer.subscription.*) doit mettre à jour User.plan.
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' });
const PRICES: Record<string, string | undefined> = {
  PREMIUM: Deno.env.get('STRIPE_PRICE_PREMIUM'),
  PRO: Deno.env.get('STRIPE_PRICE_PRO'),
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  try {
    const { plan } = await req.json();
    const price = PRICES[plan];
    if (!price) return json({ error: 'price-not-configured' }, 400);

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'not-authenticated' }, 401);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      success_url: 'serviapp://payment/return?status=success',
      cancel_url: 'serviapp://payment/return?status=cancel',
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
