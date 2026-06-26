import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';

// Lance le paiement d'une réservation via Stripe Checkout (page web sécurisée).
// Nécessite l'Edge Function `create-checkout-session` déployée + EXPO_PUBLIC_PAYMENTS_ENABLED=true.
export async function payForBooking(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { bookingId },
    });
    if (error || !data?.url) return { ok: false, error: error?.message ?? 'no-url' };
    const redirectTo = makeRedirectUri({ scheme: 'serviapp', path: 'payment/return' });
    const res = await WebBrowser.openAuthSessionAsync(data.url as string, redirectTo);
    return { ok: res.type === 'success' };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}

// Démarre un abonnement (Premium client / Pro prestataire) via Stripe Billing.
// Nécessite l'Edge Function `create-subscription` + les price IDs Stripe configurés.
export async function startSubscription(plan: 'PREMIUM' | 'PRO'): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-subscription', { body: { plan } });
    if (error || !data?.url) return { ok: false, error: error?.message ?? 'no-url' };
    const redirectTo = makeRedirectUri({ scheme: 'serviapp', path: 'payment/return' });
    const res = await WebBrowser.openAuthSessionAsync(data.url as string, redirectTo);
    return { ok: res.type === 'success' };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}
