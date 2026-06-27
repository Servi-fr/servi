// Variants SERVI : par défaut = app client (identique à app.json).
// APP_VARIANT=pro → app prestataire « SERVI Pro » (bundle / nom distincts).
// Expo lit app.json puis passe sa config ici ; on ne modifie QUE le variant pro.
module.exports = ({ config }) => {
  const isPro = process.env.APP_VARIANT === 'pro';
  if (!isPro) return config; // variant client : strictement inchangé

  return {
    ...config,
    name: 'SERVI Pro',
    ios: { ...config.ios, bundleIdentifier: 'com.whalesrecords.serviapp.pro' },
    android: { ...config.android, package: 'com.whalesrecords.serviapp.pro' },
    extra: { ...config.extra, appVariant: 'pro' }, // lu au runtime par lib/variant.ts
    // (icône dédiée Pro à ajouter plus tard ; pour l'instant on réutilise celle de base)
  };
};
