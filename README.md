# SERVI — App mobile native (iOS + Android)

App **React Native + Expo** (un seul codebase → iOS + Android), branchée sur le même
back **Supabase** que le web, dans la charte **« 01 Lumière »**.

## Stack
- **Expo SDK 56** + **expo-router** (navigation par fichiers, comme Next)
- **Supabase Auth** (email/mot de passe ; session persistée via AsyncStorage)
- **lucide-react-native** (icônes), **react-native-svg** (logo)
- Polices **Sora** + **Plus Jakarta Sans** (`@expo-google-fonts`)

## Écrans
- `app/index.tsx` — garde d'auth (redirige vers connexion ou onglets)
- `app/sign-in.tsx`, `app/sign-up.tsx` — auth
- `app/(tabs)/` — Accueil, Services, Messages, Profil (tab bar native)

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
- Connexion **Google** (expo-auth-session + Supabase OAuth, avec le scheme `serviapp://`)
- Fiche prestataire + réservation + suivi temps réel (cf. maquette `Mobile SERVI`)
- Espace **prestataire** (N&B) + **push** natif (expo-notifications → APNs/FCM)
- Paiement **Stripe** (@stripe/stripe-react-native)
