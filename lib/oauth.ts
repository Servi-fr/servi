import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Connexion Google via Supabase OAuth (ouvre une session navigateur native).
// Pré-requis côté Supabase : activer le provider Google + autoriser le redirect `serviapp://`.
export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  try {
    const redirectTo = makeRedirectUri({ scheme: 'serviapp', path: 'auth/callback' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return { ok: false, error: error?.message ?? 'no-url' };

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success' || !res.url) return { ok: false, error: 'cancelled' };

    const frag = res.url.includes('#') ? res.url.split('#')[1] : res.url.split('?')[1] ?? '';
    const params = new URLSearchParams(frag);

    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
      return sErr ? { ok: false, error: sErr.message } : { ok: true };
    }

    const code = params.get('code');
    if (code) {
      const { error: cErr } = await supabase.auth.exchangeCodeForSession(code);
      return cErr ? { ok: false, error: cErr.message } : { ok: true };
    }
    return { ok: false, error: 'no-token' };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}
