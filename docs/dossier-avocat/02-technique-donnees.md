# 02 — Architecture technique, données personnelles, sous-traitants

## 1. Architecture (vue non technique)

- **Deux applications mobiles** (iOS + Android) issues d'un même code (React Native / Expo), publiées séparément.
- **Back-end : Supabase** (base de données PostgreSQL managée, authentification, stockage de fichiers, fonctions serveur). Projet hébergé en région **eu-west-3 (Paris, AWS)** → données à caractère personnel hébergées **en France**.
- **Paiements : Stripe** (Checkout + Billing). Aucune donnée de carte ne transite par nos systèmes (périmètre PCI minimal, type SAQ A).
- **Notifications push : Expo Push** (relais vers Apple APNs / Google FCM).
- Sécurité applicative : accès aux données cloisonné par utilisateur au niveau de la base (row-level security) ; montants recalculés côté serveur ; secrets (clés Stripe) stockés côté serveur uniquement.

## 2. Données à caractère personnel traitées

**Clients** : nom, prénom, e-mail, téléphone, adresse(s) postale(s) — dont carnet d'adresses d'intervention —, photo de profil (optionnelle), historique de réservations, messages échangés, avis émis/reçus, jeton de notification push, position géographique **ponctuelle** (pour centrer la carte ; jamais de suivi en arrière-plan).

**Prestataires** : les mêmes, plus : **SIRET** (donnée publique), tarifs, zone/rayon d'intervention, années d'expérience, diplômes/certifications déclarés, labels officiels (RGE/Qualiopi/Bio, issus d'une API publique), logo, photos de réalisations, données de facturation (numéros, montants), plan d'abonnement.

**Ne sont PAS traités** : données de carte bancaire (Stripe), données de santé, données de mineurs (public adulte), géolocalisation continue.

## 3. Chaîne de sous-traitance (art. 28 RGPD — contrats à vérifier)

| Sous-traitant | Rôle | Localisation des données |
|---|---|---|
| **Supabase** (sur AWS) | Base de données, auth, stockage, fonctions | **Paris (eu-west-3)** |
| **Stripe** | Paiements, abonnements | UE/US — Stripe agréé UE (Irlande) ; à documenter |
| **Expo (EAS)** | Notifications push, chaîne de build | US — jetons push et identifiants d'appareil ; à documenter (DPF/CCT) |
| **Apple / Google** | Distribution des apps, notifications | US — cadre standard des stores |
| API adresse (BAN, data.gouv.fr) | Autocomplétion d'adresses | France (service public ; requêtes contenant l'adresse saisie) |
| API recherche-entreprises (api.gouv.fr) | Vérification SIRET, labels | France (données publiques d'entreprises) |

**Points RGPD à instruire par le conseil** (pièce 04, chantier 8) : registre des traitements, bases légales par finalité, durées de conservation et purge, information (les brouillons in-app existent), analyse d'impact éventuelle, encadrement des transferts hors UE (Expo, Stripe), procédure violation 72 h.

## 4. Comptes et actifs actuels (à restructurer le cas échéant)

| Actif | Titulaire actuel |
|---|---|
| Compte développeur Apple | **Julien Marchal (individuel)** — team 9VTP9D85PL |
| Apps App Store Connect | « SERVI » (id 6783919397) et « SERVI Pro » (id 6785066956) |
| Compte Google Play | compte de l'éditeur (apps en cours de création, packages `com.servi.app` / `com.servi.app.pro`) |
| Compte Expo (builds) | organisation « servi-fr » |
| Supabase | organisation de l'éditeur, projet « serviapp » (Paris) |
| Stripe | compte de l'éditeur (mode test) |
| Code source | dépôt GitHub privé, organisation « Servi-fr » |
| Marque / logo | « SERVI » + logo (deux barres) — **non déposés à l'INPI à ce jour** |
| Identifiants historiques | les identifiants iOS contiennent « whalesrecords » (autre activité de l'éditeur : label musical Whales Records) — sans incidence visible pour l'utilisateur |

## 5. Stade de déploiement

- **Bêta privée** : TestFlight (iOS) et APK de test (Android). Dépôt Play Store en cours (tests internes).
- **Paiements : mode test uniquement** (cartes fictives). Aucun encaissement réel.
- Aucune publicité, aucun traceur tiers, aucun cookie tiers dans les apps.
