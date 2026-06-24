# SERVI — App mobile native (iOS + Android)

App **React Native + Expo** (un seul codebase → iOS + Android), branchée sur le même
back **Supabase** que le web, dans la charte **« 01 Lumière »**.

## Stack
- **Expo SDK 56** + **expo-router** (navigation par fichiers, comme Next)
- **Supabase Auth** (email/mot de passe ; session persistée via AsyncStorage)
- **lucide-react-native** (icônes), **react-native-svg** (logo)
- Polices **Sora** + **Plus Jakarta Sans** (`@expo-google-fonts`)

## Écrans

**Client (bleu)**
- `app/index.tsx` — garde d'auth (redirige vers connexion ou onglets)
- `app/sign-in.tsx`, `app/sign-up.tsx` — auth Supabase
- `app/(tabs)/` — Accueil, Services, Messages, Profil (tab bar native)
- `app/category/[slug].tsx` — prestataires d'une catégorie
- `app/prestataire/[id].tsx` — fiche (profil, stats, prestations, avis, CTA Réserver)
- `app/reservation/[id].tsx` — formulaire (prestation, date, créneau, adresse, récap + frais SERVI)
- `app/reservation/success.tsx` — confirmation

**Prestataire (Noir & Blanc)**
- `app/(pro)/dashboard.tsx` — revenus, KPI, demandes en attente, missions du jour
- `app/(pro)/demandes.tsx` — accepter / refuser les réservations
- `app/(pro)/planning.tsx` — agenda des missions confirmées
- `app/(pro)/profile.tsx` — profil pro + bascule vers l'espace client

**Données** : `lib/data.ts` (catégories, prestataires, avis, demandes) — couche locale à remplacer par des requêtes Supabase.

## Lancer en local (preview immédiate)
```bash
npm install
npx expo start          # puis scanner le QR avec l'app « Expo Go » (iOS/Android)
# ou : npx expo start --ios  (simulateur iOS, nécessite Xcode)
#      npx expo start --android (émulateur, nécessite Android Studio)
```

## Variables d'environnement
Copier `.env.example` → `.env` et renseigner :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (clé publishable/anon — publique)
*(des valeurs par défaut sont aussi codées en repli dans `lib/supabase.ts`.)*

## Backend Supabase (données réelles)
Le back est **le même que le web** (projet `sugovioteynfkxbkkzdy`, tables Prisma `User`,
`PrestataireProfile`, `Booking`…). Rappel clé : `public."User".id == auth.users.id`
(trigger) → `clientId` d'une réservation = `session.user.id`.

- `lib/api.ts` — lit `PrestataireProfile` (+ `User`) et **écrit les réservations** (`Booking`).
  Repli automatique sur le catalogue local (`lib/data.ts`) quand la base est vide.
- Les écrans `category` / `prestataire` / `reservation` consomment `lib/api.ts`.

**Étape unique pour activer les données réelles** (1 fois) :
1. Supabase → SQL Editor → coller le contenu de [`supabase/mobile-setup.sql`](supabase/mobile-setup.sql) → **Run**.
2. Ce script : backfill des comptes `auth → User`, politiques **RLS** (catalogue public en lecture,
   réservation par l'utilisateur connecté) et **8 prestataires de démo** (réversibles).
→ L'app affiche alors les prestataires **en base** et les réservations **persistent** réellement.

## Builds pour les stores (EAS Build — cloud Expo)
```bash
npm i -g eas-cli
eas login                       # ton compte Expo
eas build:configure
eas build --platform ios        # → .ipa (App Store)
eas build --platform android    # → .aab (Google Play)
eas submit --platform ios       # envoi à App Store Connect
eas submit --platform android   # envoi à Google Play
```
> ⚠️ Publication = **tes comptes** : Apple Developer (99 $/an) + Google Play Console (25 $).
> Identifiants : iOS `com.whalesrecords.serviapp`, Android `com.whalesrecords.serviapp` (dans `app.json`).

## À faire ensuite (itérations)
- Brancher les écrans sur **Supabase** (requêtes réelles : prestataires, réservations) à la place de `lib/data.ts`
- Connexion **Google** (expo-auth-session + Supabase OAuth, scheme `serviapp://`)
- **Suivi temps réel** de la réservation (Supabase Realtime) + messagerie
- **Push** natif (expo-notifications → APNs/FCM)
- Paiement **Stripe** (@stripe/stripe-react-native)
