# SERVI — Récapitulatif

## 1. C'est quoi SERVI ?

**SERVI est une marketplace de services à la personne** (France) qui met en relation des **clients** et des **prestataires** vérifiés. L'utilisateur trouve, réserve, paie et suit une prestation au même endroit ; le prestataire gère toute son activité.

- **Catégories** : ménage, jardinage, plomberie, électricité, coaching, cours particuliers, beauté, bricolage (regroupées par familles).
- **Surfaces** : app mobile **universelle** (iPhone / iPad / Mac Apple Silicon), une **console admin web** (analytics), un **site web** Next.js (landing).
- **Backend** : Supabase (auth, Postgres + RLS, Edge Functions, Storage). Paiement Stripe.
- **Design** « 01 Lumière » : bleu côté client, noir & blanc côté prestataire.
- **Différenciateur** : le **crédit d'impôt services à la personne (−50 %)** intégré au parcours.

---

## 2. Ce qui a été fait ✅ (sur TestFlight, builds 15→26)

### Socle & parcours
- Catalogue (catégories + familles), recherche, **fiche prestataire**, **réservation** (créneau, **adresse validée** via la BAN, contrôle de la **zone d'intervention**), **paiement Stripe Checkout**, **chat** par réservation.
- **Espace prestataire** : dashboard (KPIs réels), demandes (accepter/refuser), planning, profil.
- **Auth Supabase** (email + Google), **notifications** in-app + **push**, **photos de profil**.
- **Carte interactive** (façon Uber) avec filtre par métier + centrage géoloc/profil.
- **Console admin** web (KPIs, journal de connexions, sécurisée).
- Pages légales RGPD.

### Session « V2 » (≈ 14 lots)
- 🖥️ **iPad/Mac** adaptive (grilles, contenu centré).
- 🇫🇷 **Crédit d'impôt SAP** (−50 %, estimation du reste à charge, écran d'info sourcé).
- 👑 **Abonnements** Premium (client) / Pro (prestataire) — offre + plan.
- 📍 **Carnet d'adresses** client.
- 🏢 **SIRET** + recherche auto d'entreprise (API gouv).
- 🖼️ **Logo** prestataire + **galerie de réalisations** + années d'expérience.
- 🔔 **Relances auto** (Pro) — réglage + fonction + cron.
- ⭐ **Avis bidirectionnels** (client ↔ prestataire).
- 🚫 Garde-fous : blocage **double-booking** + **créneaux passés**.
- 📅 **Google/Apple Calendar** (« Ajouter à mon agenda »).
- 👤 **Google/Apple Contacts** (« Ajouter aux contacts »).
- 🪄 **Intake « Décrivez votre besoin »** (B7) + matchmaking.
- 📣 **Pubs sponsorisées** « À la une » (B6) + bouton « Mettre ma fiche en avant ».

### Technique
- Pipeline **build EAS 100 % autonome** (token Expo).
- Repo privé **Servi-fr/servi** (SSH).
- Migrations SQL **consolidées & idempotentes** (`run-all-migrations.sql`).

---

## 3. Ce qui reste à faire 🔜

### Codable sans dépendance externe (je peux le faire)
- **P-3 Devis / Factures / Compta** (PDF, mentions légales, export CSV/FEC).
- **Déployer les relances** (`send-relances` + `relances-cron.sql`) + vérifier le push.
- **RGE auto par SIRET** (API Professionnels RGE, open data) → certifs à jour.
- **Split en 2 apps** (Client / Prestataire) — même codebase, deux variants.
- **Matchmaking B7** approfondi (notifier les prestataires proches d'une demande).
- **Multi-services** par prestataire (aujourd'hui un seul).
- **iPad/Mac Phase 1b** (sidebar, master-détail).
- **Android** (clé Google Maps) + **webapp Expo**.
- **Diplômes** : upload de justificatif (pas d'API).

### Nécessite une action externe de ta part
- **Stripe réel** : activer **Connect** + créer les **prix Billing** → paiements + abonnements réels.
- **Google Business** : config **Google Cloud** (OAuth + Business Profile API).
- **Avance immédiate crédit d'impôt** : déclaration **SAP** + habilitation **URSSAF**.
- **Facturation électronique** : choisir une **PDP agréée** (2026/2027).
- **« Le Garde Manger »** (ton autre app) : son **API/données** → notif géoloc + livraison.
- **Artisan Pro** (ton autre app) : son **API** → pré-remplir le profil prestataire.

### Sécurité
- Régénérer le **token Expo** + faire tourner les secrets exposés.

---

## 4. Pour tout activer
1. Lancer **`supabase/run-all-migrations.sql`** sur le projet Supabase **serviapp** (`sugovioteynfkxbkkzdy`).
2. Tester les **builds 16→26** sur TestFlight (iPhone / iPad / Mac).
