import Constants from 'expo-constants';

// Variant runtime de l'app. Injecté par app.config.js (extra.appVariant).
// - 'pro'    → build SERVI Pro (APP_VARIANT=pro)
// - sinon    → app client (extra.appVariant absent)
export const APP_VARIANT: 'client' | 'pro' =
  Constants.expoConfig?.extra?.appVariant === 'pro' ? 'pro' : 'client';

export const IS_PRO = APP_VARIANT === 'pro';
export const IS_CLIENT = !IS_PRO;
