# 05 — Annexes : identifiants, actifs, contacts

## Éditeur (actuel)

- **Julien Marchal** — hello@whalesrecords.com
- Autre activité du même titulaire : label musical « Whales Records » (activités distinctes, certains comptes techniques partagés — voir chantier 1).

## Applications

| | SERVI (client) | SERVI Pro (prestataire) |
|---|---|---|
| App Store Connect (iOS) | id **6783919397** | id **6785066956** |
| Identifiant iOS (bundle) | com.whalesrecords.serviapp | com.whalesrecords.serviapp.pro |
| Identifiant Android (package) | **com.servi.app** | **com.servi.app.pro** |
| Distribution actuelle | TestFlight (bêta) | TestFlight (bêta) |
| Play Store | apps en cours de création (test interne) | idem |
| Compte développeur Apple | Julien Marchal (individuel), team 9VTP9D85PL | idem |

## Infrastructure

| Service | Détail |
|---|---|
| Base de données / back-end | Supabase, projet « serviapp » (réf. sugovioteynfkxbkkzdy), région **eu-west-3 — Paris** |
| Paiements | Stripe (mode **test** ; produits « SERVI Premium » — désactivé — et « SERVI Pro » 19,99 €/mois) |
| Builds & notifications | Expo / EAS, organisation « servi-fr » |
| Code source | GitHub, organisation « Servi-fr », dépôt privé « servi » |
| Site web / landing | projet Vercel (landing « serviapp ») |

## Documents in-app (brouillons)

Politique de confidentialité · Conditions générales d'utilisation · Mentions légales
(fichier source : `lib/legal.ts` du dépôt ; accessibles dans les apps via Profil → « Légal & confidentialité »)

## Chiffres du modèle (implémentés)

- Commission prestataire : **15 %** (standard) / **10 %** (abonné SERVI Pro)
- Abonnement SERVI Pro : **19,99 €/mois**, sans engagement
- Client : **0 frais**
- Franchise TVA affichée sur les factures prestataires : « TVA non applicable, art. 293 B du CGI » (prestataires type micro-entrepreneur)

## Références utiles au conseil (déjà étudiées côté produit)

- Réforme facturation électronique : réception 09/2026 (toutes entreprises), émission micro/TPE 09/2027, via Plateformes Agréées (liste : impots.gouv.fr).
- Repères de marché (commissions) : Wecasa ≈ 25 % (côté prestataire), TaskRabbit France ≈ 30 % (côté client), Yoojo ≈ 15 %, StaffMe 20 % (côté entreprise) — relevés juillet 2026, sources publiques (centres d'aide/CGU des plateformes).
- Crédit d'impôt SAP : 50 %, plafond général 12 000 €/an ; sous-plafonds petit bricolage 500 €, jardinage 5 000 €, assistance informatique 3 000 €.

---

*Dossier préparé le 3 juillet 2026 à partir de l'état réel du code et des comptes. Document de travail — ne constitue pas un avis juridique.*
