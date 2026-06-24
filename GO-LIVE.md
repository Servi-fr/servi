# SERVI — Mise en ligne (App Store + Google Play)

Stratégie recommandée : **bêta d'abord** (TestFlight iOS / piste interne Android), puis public.

---

## ✅ Avant de builder — checklist
- [ ] **🔐 Rotater les secrets** exposés (Google OAuth *secret*, mot de passe DB, clé Supabase *service_role*, ancienne clé Clerk). Ils ne sont pas dans l'app, mais ont transité en clair.
- [ ] **🔵 Google** : OAuth consent screen → **Publish app** (sinon seuls les *test users* se connectent).
- [ ] **📄 Légal** : héberger `legal/LEGAL.md` à une URL (ex. site Vercel `/legal`) → c'est l'**URL de politique de confidentialité** demandée par les stores. Compléter les `[À COMPLÉTER]`.
- [ ] **🧹 Données démo** (pour le **public** seulement, pas la bêta) :
  - exécuter `supabase/cleanup-demo-data.sql` dans le SQL Editor,
  - builder avec `EXPO_PUBLIC_USE_SEED_FALLBACK=false`.
- [ ] **💳 Paiement** (optionnel) : suivre `docs/STRIPE-SETUP.md` + `EXPO_PUBLIC_PAYMENTS_ENABLED=true`.
- [ ] **Visuels store** : icône (présente), captures d'écran, description, mots-clés.

## 📋 Comptes nécessaires (à toi)
- **Expo** (gratuit) · **Apple Developer** 99 $/an · **Google Play** 25 $ une fois.

---

## 🧪 Étape 1 — Bêta (rapide, sans review longue)
```bash
npm i -g eas-cli
eas login                         # ton compte Expo
eas build:configure              # (1ʳᵉ fois)

# iOS → TestFlight (test interne immédiat, pas de review)
eas build --platform ios --profile production
eas submit --platform ios        # → apparaît dans TestFlight

# Android → piste interne
eas build --platform android --profile production
eas submit --platform android --track internal
```
Invite tes testeurs (emails) dans App Store Connect (TestFlight) et Google Play Console (test interne). Ils installent et testent sur leur vrai téléphone.

> Tester juste sur **ton** iPhone sans compte Apple payant : `eas build --platform ios --profile preview` (build ad-hoc, nécessite d'enregistrer l'UDID de l'appareil via `eas device:create`).

## 🚀 Étape 2 — Public
Une fois la bêta validée + la checklist ci-dessus cochée :
```bash
eas submit --platform ios        # puis "Submit for Review" dans App Store Connect
eas submit --platform android --track production
```
Délais de review : Apple ~1-3 jours, Google ~quelques heures à 2 jours.

---

## Identifiants de l'app
- iOS / Android bundle : `com.whalesrecords.serviapp`
- Scheme : `serviapp://`
- Version : `1.0.0` (auto-incrément du build via le profil `production`)

## Profils EAS (`eas.json`)
- `production` — builds stores (TestFlight + Play).
- `preview` — build interne device (ad-hoc iOS / APK Android).
- `simulator` — build pour le simulateur iOS.
- `development` — dev client.

## Rappel paiement & stores
Pour des **services rendus dans le monde réel**, Apple autorise le paiement **hors achat in-app** (Stripe) — pas d'IAP obligatoire. Garde une description claire du service rendu.
