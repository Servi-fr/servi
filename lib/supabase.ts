import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Valeurs PUBLIQUES (URL + clé publishable) — sûres à embarquer dans une app.
// Surchargeables via les variables EXPO_PUBLIC_* (voir .env).
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://sugovioteynfkxbkkzdy.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_Zsz2XP1t78deqQJ9sC1FTQ_PZCuybu_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
