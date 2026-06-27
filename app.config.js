// Variants SERVI : par défaut = app client (identique à app.json).
// APP_VARIANT=pro → app prestataire « SERVI Pro » (bundle / nom distincts).
// Expo lit app.json puis passe sa config ici ; on ne modifie QUE le variant pro.
module.exports = ({ config }) => {
  const isPro = process.env.APP_VARIANT === 'pro';
  if (!isPro) return config; // variant client : strictement inchangé

  return {
    ...config,
    name: 'SERVI Pro',
    icon: './assets/icon-pro.png', // icône dédiée Pro : marque blanche sur fond noir
    ios: { ...config.ios, bundleIdentifier: 'com.whalesrecords.serviapp.pro' },
    android: {
      ...config.android,
      package: 'com.whalesrecords.serviapp.pro',
      adaptiveIcon: {
        ...(config.android && config.android.adaptiveIcon),
        backgroundColor: '#000000',
        foregroundImage: './assets/android-icon-foreground-pro.png',
      },
    },
    extra: { ...config.extra, appVariant: 'pro' }, // lu au runtime par lib/variant.ts
  };
};
