// Réglages d'exécution (surchargeables via variables EXPO_PUBLIC_* au build).
export const config = {
  // Affiche le catalogue de démo local quand la base ne renvoie rien.
  // Utile en bêta ; à passer à false pour la prod publique :
  //   EXPO_PUBLIC_USE_SEED_FALLBACK=false
  useSeedFallback: (process.env.EXPO_PUBLIC_USE_SEED_FALLBACK ?? 'true') !== 'false',

  // Active le paiement en ligne (Stripe Checkout). Nécessite l'Edge Function déployée.
  //   EXPO_PUBLIC_PAYMENTS_ENABLED=true
  paymentsEnabled: process.env.EXPO_PUBLIC_PAYMENTS_ENABLED === 'true',
};
