# Paiement Stripe — mise en place

Le paiement utilise **Stripe Checkout** (page web sécurisée ouverte dans l'app) + 2 **Edge Functions** Supabase. Aucune dépendance native, aucun rebuild nécessaire.

## 1. Compte Stripe
1. Crée un compte sur [stripe.com](https://stripe.com) et active-le (mode test pour commencer).
2. Récupère ta **clé secrète** : Dashboard → Developers → API keys → `sk_test_...` (puis `sk_live_...` en prod).

## 2. Déployer les Edge Functions
Pré-requis : [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`).

```bash
cd serviapp-mobile
supabase login
supabase link --project-ref sugovioteynfkxbkkzdy

# Secret Stripe (jamais dans l'app !)
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx

# Déploiement
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 3. Configurer le webhook Stripe
1. Stripe → Developers → **Webhooks** → *Add endpoint* :
   `https://sugovioteynfkxbkkzdy.supabase.co/functions/v1/stripe-webhook`
2. Événement à écouter : **`checkout.session.completed`**.
3. Copie le **Signing secret** (`whsec_...`) puis :
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

## 4. Activer côté app
Au build (ou dans `.env`) :
```
EXPO_PUBLIC_PAYMENTS_ENABLED=true
```
À la confirmation d'une réservation, l'app ouvrira alors la page de paiement Stripe.
Le webhook passe automatiquement `Booking.paymentStatus` à `SUCCEEDED` après paiement.

## Comment ça marche
1. Le client confirme une réservation → `Booking` créée (`paymentStatus = PENDING`).
2. L'app appelle `create-checkout-session` (le **montant est recalculé côté serveur** depuis la base — anti-fraude).
3. Stripe Checkout s'ouvre ; le client paie.
4. Stripe notifie `stripe-webhook` → `paymentStatus = SUCCEEDED`.

## Notes
- Tant que `EXPO_PUBLIC_PAYMENTS_ENABLED` n'est pas `true`, le parcours fonctionne sans paiement (réservation = demande).
- Pour reverser les fonds aux prestataires (Stripe Connect), c'est une étape ultérieure.
- La clé secrète Stripe ne doit **jamais** être mise dans l'app — uniquement en *secret* Supabase.
