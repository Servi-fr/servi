# BOM — Coûts d'exploitation mensuels de SERVI

Établi le 3 juillet 2026. Tarifs publics 2026, convertis à ~0,92 €/$. Trois scénarios :
- **Bêta** = aujourd'hui (TestFlight/APK, paiements en mode test) ;
- **Lancement** = ouverture commerciale, faible trafic ;
- **Croissance** = ~1 000 utilisateurs actifs/mois.

## Coûts fixes mensuels

| # | Poste | Fournisseur | Bêta | Lancement | Croissance | Notes |
|---|---|---|---:|---:|---:|---|
| 1 | Back-end : base de données, auth, stockage, fonctions | **Supabase** (Paris) | 0 € | **23 €** (Pro 25 $) | ~42 € (Pro + compute Small) | Free : 500 Mo, **pause après 1 sem. d'inactivité** → Pro indispensable en prod (sauvegardes 7 j, pas de pause) |
| 2 | Site web / landing | **Vercel** | 0 € | **19 €** (Pro 20 $/siège) | 19 € | Le plan Hobby (gratuit) interdit l'usage **commercial** → Pro requis au lancement |
| 3 | Domaine(s) (+ site vitrine ?) | **Squarespace** | ~2 € | ~2 € | ~2 € | Domaine ≈ 20 €/an. ⚠️ **À confirmer ce qui est chez Squarespace** : si un site vitrine y est hébergé, ajouter ~23-33 €/mois (plan Business) |
| 4 | Builds mobiles + notifications push | **Expo EAS** | 0-18 € | **18 €** (Starter 19 $) | ~91 € (Production 99 $) | Free = 30 builds/mois avec file d'attente. ⚠️ Un paiement a été fait en juin pour débloquer les builds — **plan souscrit à vérifier** sur expo.dev/settings/billing. Push gratuit |
| 5 | Compte développeur Apple | **Apple** | **8,25 €** | 8,25 € | 8,25 € | 99 $/an, obligatoire |
| 6 | Compte Google Play | **Google** | 0 € | 0 € | 0 € | 25 $ **une seule fois** (pas mensuel) |
| 7 | Code source (repos privés) | **GitHub** | 0 € | 0 € | 0 € | Gratuit ; Team 4 $/utilisateur si l'équipe grandit |
| 8 | API adresses (BAN) + SIRET (recherche-entreprises) | État (data.gouv) | 0 € | 0 € | 0 € | Services publics gratuits |
| 9 | Cartes (Apple Maps iOS / Google Maps Android) | Apple/Google | 0 € | 0 € | 0 € | SDK natifs mobiles gratuits (pas d'API géocodage payante : BAN utilisée) |
| 10 | Emails transactionnels | (Supabase intégré → Resend plus tard) | 0 € | 0 € | ~18 € | L'auth Supabase envoie les emails de base ; prévoir un service dédié en croissance |
| 11 | Monitoring d'erreurs (optionnel) | Sentry | 0 € | 0 € | ~24 € | Recommandé en croissance, pas indispensable avant |
| | **TOTAL FIXE / MOIS** | | **≈ 10-28 €** | **≈ 70 €** | **≈ 205 €** | hors coûts variables ci-dessous |

## Coûts variables (proportionnels à l'activité)

| Poste | Fournisseur | Coût | Exemple |
|---|---|---|---|
| Encaissement des réservations | **Stripe** | ≈ **1,5 % + 0,25 €** par paiement carte UE (plus cher hors UE) | 10 000 €/mois de volume en 200 paiements → ≈ **200 €** |
| Abonnements SERVI Pro | **Stripe Billing** | frais carte + ≈ 0,5-0,7 % du volume récurrent | 50 abonnés × 19,99 € → ≈ **22 €** de frais |
| Reversements prestataires (futur) | **Stripe Connect** (Express) | ≈ 2 €/compte prestataire actif/mois + frais de virement | 50 prestataires actifs → ≈ **100 €** — à intégrer au business plan avant d'activer Connect |

> Les frais Stripe se financent par la commission (15 %/10 %) : sur une prestation de 50 €, SERVI encaisse 7,50 € de commission et paie ≈ 1 € à Stripe.

## Pour mémoire (à venir, pas encore dus)

- **Plateforme Agréée** (facturation électronique, échéance sept. 2027) : tarifs du marché généralement 0-30 €/mois selon volume — à budgéter en 2027.
- **Apple/Google — commission sur l'abonnement in-app** : l'abonnement Pro passe aujourd'hui par Stripe (web checkout). Si Apple impose l'achat in-app (IAP) pour l'abonnement, prévoir **15-30 %** de commission stores sur ce revenu — point à surveiller lors de la validation App Store.

## Synthèse

| Scénario | Fixe/mois | Variable | Ordre de grandeur total |
|---|---:|---|---|
| **Bêta (aujourd'hui)** | ~10-28 € | 0 € (mode test) | **~10-30 €/mois** |
| **Lancement** | ~70 € | ~2 % du volume encaissé | **~70 € + 2 % du CA transitant** |
| **Croissance (~1k users)** | ~205 € | idem + Connect (~2 €/presta actif) | **~205-350 €/mois** selon volume |

### 3 actions pour fiabiliser cette feuille
1. Vérifier le **plan EAS réellement souscrit** (expo.dev → Billing) — c'est la plus grosse inconnue du fixe.
2. Vérifier ce qui est **chez Squarespace** (domaine seul ou site) et lister les domaines détenus (servi.app ? servi.fr ?).
3. Confirmer le **plan Supabase** de l'organisation (dashboard → Billing) : si encore en Free, passer Pro **avant** l'ouverture commerciale (risque de pause du projet).
