// Réglages d'exécution (surchargeables via variables EXPO_PUBLIC_* au build).
export const config = {
  // Catalogue de démo local quand la base ne renvoie rien : DÉSACTIVÉ par défaut
  // (aucun faux prestataire dans les builds). Opt-in explicite pour le dev :
  //   EXPO_PUBLIC_USE_SEED_FALLBACK=true
  useSeedFallback: process.env.EXPO_PUBLIC_USE_SEED_FALLBACK === 'true',

  // Active le paiement en ligne (Stripe Checkout). Nécessite l'Edge Function déployée.
  //   EXPO_PUBLIC_PAYMENTS_ENABLED=true
  paymentsEnabled: process.env.EXPO_PUBLIC_PAYMENTS_ENABLED === 'true',
};
