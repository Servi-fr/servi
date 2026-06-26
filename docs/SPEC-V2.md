# SERVI — Spécifications V2

Roadmap des nouvelles fonctionnalités : couche **iPad / macOS**, **signatures**, **agenda (Google/Apple)**, **Google Contacts**, **statistiques approfondies** (admin + prestataire), **publicité & comptes gratuits**.

> Stack : Expo SDK 56 (app universelle iPhone/iPad/Mac Apple Silicon), Supabase (Postgres + RLS + Edge Functions + Storage), Stripe. Tout est faisable **sans éjecter** (config plugins + dev builds EAS).

---

## 1. Couche adaptive iPad & macOS

L'app tourne déjà sur iPad et Mac (app universelle) mais les écrans sont pensés **iPhone** (1 colonne). Objectif : tirer parti du **grand écran**.

| Élément | iPhone (actuel) | iPad / Mac (cible) |
|---|---|---|
| Navigation | 3 onglets en bas | **Sidebar latérale** persistante (Accueil / Carte / Réservations / Messages / Profil) |
| Catalogue | liste 1 colonne | **grille 2–3 colonnes** |
| Réservations / messages | écran plein | **master-détail** (liste à gauche, détail à droite) |
| Carte | plein écran | carte + **panneau latéral** des prestataires |
| Largeur contenu | 100 % | **max-width** centré (≤ 900 px) + marges |

**Technique**
- Breakpoints via `useWindowDimensions()` (ex. `compact < 700 ≤ regular < 1024 ≤ large`).
- Composant `<AdaptiveLayout>` qui bascule bottom-tabs ⇄ sidebar selon la largeur.
- États **hover** (Mac/trackpad) + **focus clavier** ; raccourcis (`⌘F` recherche, `⌘,` réglages) via `react-native` `Keyboard`/listeners.
- **Apple Pencil / trackpad** : utiles pour la signature (§2).
- Gérer le **redimensionnement de fenêtre** (Mac) : layout réactif déjà couvert par les breakpoints.

**Effort** : moyen (refactor présentation, 0 changement backend). **Bénéfice** : profite à iPad **et** Mac d'un coup.
**Limite macOS** : pas de menu-barre natif / multi-fenêtres (non géré par Expo managed). On reste sur « app iPad sur Mac », largement suffisant.

---

## 2. Signatures électroniques

**Cas d'usage** : signer un **devis**, un **bon d'intervention** (fin de prestation), une **attestation**. Le client et/ou le prestataire signent dans l'app.

**Technique**
- Capture : `react-native-signature-canvas` (WebView, simple) **ou** `@shopify/react-native-skia` (canvas natif, plus fluide, idéal Pencil/trackpad).
- Génération du document signé en **PDF** : `expo-print` (HTML → PDF) avec l'image de signature incrustée + horodatage + hash.
- Stockage : bucket Supabase `documents` (privé, RLS par `bookingId`/`userId`) + table `Document`.
- Partage / téléchargement : `expo-sharing`.

**Modèle de données (nouvelles tables)**
```
Document       { id, bookingId, type(DEVIS|BON_INTERVENTION|ATTESTATION),
                 pdfUrl, status(DRAFT|SIGNED), createdAt }
Signature      { id, documentId, signerId(userId), imageUrl, signedAt,
                 ip, hash }     // valeur probante "signature simple" eIDAS
```

**Juridique** : niveau **signature électronique simple** (eIDAS) — suffisant pour devis/bons d'intervention. Pour de la signature **qualifiée** (valeur probante forte), intégrer plus tard **Yousign** ou **DocuSign** (API). Ne pas surinvestir au départ.

**iPad/Mac** : signature au **doigt / Apple Pencil / trackpad** — bien meilleure expérience que sur iPhone.

**Effort** : moyen.

---

## 3. Agenda — Google Calendar / Apple Calendar

**Cas d'usage** : quand une réservation est **confirmée**, l'ajouter à l'agenda du prestataire **et** du client ; rappel automatique.

**Technique (recommandé : agenda de l'appareil)**
- `expo-calendar` : écrit directement dans **Apple Calendar** (iOS/iPad/Mac). Si le compte **Google** est ajouté dans les réglages iOS/macOS, l'événement se **synchronise automatiquement avec Google Agenda** → couvre « Google » et « Mac » sans OAuth.
- Bouton **« Ajouter à mon agenda »** sur la réservation confirmée + option **auto** (préférence utilisateur).
- Repli universel : **export `.ics`** (génération côté app, partage via `expo-sharing`) — fonctionne partout, zéro permission.

**Option avancée (plus tard)** : **Google Calendar API** (OAuth scope `calendar.events`) pour écrire dans Google Agenda indépendamment de l'appareil + créer des **liens visio**. Plus lourd (OAuth + Edge Function), à réserver à une V2.1.

**Permissions** : `NSCalendarsUsageDescription` (Info.plist) — à ajouter dans `app.json`.

**Effort** : faible (expo-calendar + .ics). API Google : moyen.

---

## 4. Google Contacts

**Cas d'usage** : (a) ajouter un prestataire/client à son **carnet d'adresses** ; (b) **inviter** des connaissances depuis ses contacts ; (c) pré-remplir une réservation pour un proche.

**Technique**
- `expo-contacts` : lit/écrit les **contacts de l'appareil** (Apple Contacts ; si compte Google ajouté → contacts Google synchronisés). Couvre « Google » et « Mac ».
- Bouton **« Ajouter aux contacts »** (vCard) sur la fiche prestataire/client.
- **« Inviter des amis »** : lecture des contacts (avec consentement explicite) → SMS/lien de parrainage.

**Option avancée** : **Google People API** (OAuth) pour un accès direct au compte Google, indépendant de l'appareil — V2.1 seulement.

**Vie privée / RGPD** : accès **uniquement sur action explicite** de l'utilisateur, jamais en masse, jamais d'upload silencieux. `NSContactsUsageDescription` à ajouter.

**Effort** : faible.

---

## 5. Statistiques approfondies

### 5.1 Admin (console web `serviapp-admin`)
Au-delà des KPIs actuels :
- **GMV** (volume d'affaires), **revenu plateforme** (commissions), **take rate**.
- **Funnel** : recherche → vue fiche → réservation → confirmée → terminée (taux de conversion à chaque étape).
- **Cohortes & rétention** (clients revenant M+1, M+3), **churn**.
- **Actifs** : DAU / WAU / MAU, courbe d'inscriptions (déjà là) enrichie.
- **Par catégorie / par ville** (heatmap géographique des demandes).
- **Top prestataires**, **temps de réponse moyen**, **taux de litige / annulation**.

### 5.2 Prestataire (écran « Statistiques » in-app)
- **Revenus** par semaine/mois (courbe), à venir vs encaissé.
- **Taux d'acceptation**, **temps de réponse moyen**, **note** (tendance).
- **Clients récurrents**, **créneaux les plus demandés** (heatmap jour×heure).
- **Conversion** vues fiche → réservations.
- **Comparaison à la moyenne de la catégorie** (« vous répondez 2× plus vite que la moyenne »).

**Technique**
- Agrégations en **RPC SQL `SECURITY DEFINER`** (admin = global, prestataire = limité à `auth.uid()`), sur le modèle des RPC admin existantes.
- Nécessite une table d'**événements** pour le funnel : `AnalyticsEvent { id, userId?, type(SEARCH|VIEW_PROFILE|BOOKING_START|…), meta jsonb, createdAt }` (sinon on ne mesure que ce qui est déjà en base).
- Graphiques : **`victory-native`** ou **`react-native-svg`** (app) ; **Recharts** (console admin Vite).

**Effort** : moyen (RPC + écrans) ; +faible si on se limite aux données déjà en base (sans funnel d'événements).

---

## 6. Publicité & comptes gratuits (monétisation)

**Modèle de paliers**
| | Gratuit | Premium / Pro |
|---|---|---|
| **Client** | publicité, favoris limités | sans pub, support prioritaire, réservation anticipée |
| **Prestataire** | pub, fiche standard, stats de base | sans pub, **mise en avant**, photos illimitées, **stats avancées** (§5.2), commission réduite |

**Deux pistes de pub (combinables)**
1. **AdMob** (`react-native-google-mobile-ads`, config plugin) : bannières + interstitiels pour comptes gratuits. ⚠️ exige un **compte AdMob**, et en UE un **CMP de consentement RGPD** (UMP SDK) obligatoire. Rémunère peu au début (faible trafic).
2. **Annonces sponsorisées internes** (recommandé pour une marketplace) : un prestataire paie pour **remonter dans les résultats / la carte** (badge « Sponsorisé »). Plus pertinent, plus rentable, et **cohérent avec la marque** que des pubs tierces.

**Modèle de données**
```
User.plan         FREE | PREMIUM (client)         // ou
Prestataire.plan  FREE | PRO
Subscription      { id, userId, plan, status, stripeSubId, currentPeriodEnd }
SponsoredListing  { id, prestataireId, budget, startsAt, endsAt, status }
```
- Abonnements via **Stripe** (déjà intégré pour le paiement) → Stripe **Billing**/subscriptions + webhook.
- Gating : flag `plan` lu côté app pour masquer/afficher pub + perks.

**Recommandation** : commencer par **annonces sponsorisées internes + abonnement Pro prestataire** (sans pub tierce), et n'ajouter **AdMob** que si tu veux monétiser le volume client gratuit plus tard. C'est plus propre côté image et RGPD.

**Effort** : moyen→élevé (paliers + Stripe subscriptions + gating + CMP si AdMob).

---

## 7. Roadmap proposée (phasée)

**Phase 1 — Grand écran & valeur immédiate**
1. Couche adaptive **iPad/Mac** (§1) — débloque toute l'expérience grand écran.
2. **Agenda** `expo-calendar` + `.ics` (§3) — faible effort, fort usage.
3. **Stats prestataire** sur données existantes (§5.2 partiel).

**Phase 2 — Engagement & confiance**
4. **Signatures** (devis / bon d'intervention) (§2).
5. **Google Contacts** (`expo-contacts`) (§4).
6. **Stats admin** approfondies + table `AnalyticsEvent` (funnel) (§5.1).

**Phase 3 — Monétisation**
7. Paliers **Free / Pro** + **Stripe subscriptions** + **annonces sponsorisées** (§6).
8. (Optionnel) **AdMob** + CMP RGPD.

**Pré-requis externes à prévoir**
- Permissions Info.plist : Calendrier, Contacts (+ AdMob App ID si pub).
- (Option) Google Cloud : OAuth scopes Calendar/People si l'on veut l'accès direct API.
- (Option) Compte AdMob + intégration UMP (consentement UE).
- Stripe Billing activé pour les abonnements.

---

*Document de cadrage — chaque ligne peut devenir un lot livré en branche + preview, sans casser la prod.*
