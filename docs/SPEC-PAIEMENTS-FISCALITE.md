# SERVI — Spéc. Paiements, Abonnements & Fiscalité

Cadrage de : **paiement marketplace** prestataire ↔ client, **paliers membres** (abonnement mensuel), **facturation / devis / compta** prestataires, et **crédit d'impôt** client (services à la personne). Données fiscales **vérifiées sur sources officielles** (juin 2026) — voir §Sources.

> ⚠️ **Important** : plusieurs de ces sujets ne sont **pas que techniques** — ils imposent des **prérequis réglementaires** (déclaration SAP, habilitation API URSSAF, KYC Stripe, plateforme de facturation agréée). À traiter comme des **lots à part**, dans l'ordre proposé en §7.

---

## 1. Paiement marketplace (prestataire ↔ client)

Aujourd'hui : Stripe **Checkout** simple (le client paie, mais pas de reversement automatique au prestataire). Cible : vraie **marketplace** où SERVI encaisse, **reverse au prestataire** et **prélève sa commission**.

**Brique : Stripe Connect**
- Comptes **Connect Express** pour chaque prestataire (onboarding KYC/IBAN géré par Stripe).
- Type de charge recommandé : **destination charge** *ou* **separate charges & transfers** → SERVI encaisse le paiement, prélève une **application fee** (= commission SERVI) et **transfère le reste** au prestataire.
- **Commission** = `application_fee_amount` (seul frais visible côté prestataire ; SERVI assume les frais Stripe).
- **France/EEA** supporté (transferts transfrontaliers UE OK).
- **Séquestre / acompte** : possibilité de **capturer** le paiement à la mise en contact et de **libérer** les fonds à la fin de la prestation (capture différée ou transfert à la complétion) → protège client et prestataire.
- **Litiges / remboursements** : gérés via Connect (refund + reverse_transfer).

**Modèle de paiement « mise en contact »** : à la confirmation, on **autorise** le paiement (empreinte), on capture à la réalisation, on transfère net de commission. Le chat reste gratuit ; le paiement se déclenche sur acceptation du devis/créneau.

---

## 2. Paliers membres (abonnement mensuel)

**Brique : Stripe Billing** (subscriptions) — déjà dans l'écosystème Stripe.

| | Gratuit | **Premium / Pro** (forfait mensuel) |
|---|---|---|
| **Client** | recherche, réservation, paiement | sans pub, réservation anticipée, **assistant crédit d'impôt** (§4), support prioritaire |
| **Prestataire** | fiche standard, stats de base | **devis / factures / compta** (§3), **mise en avant**, photos illimitées, **stats avancées**, commission réduite |

- `User.plan` / `Prestataire.plan` (FREE | PREMIUM | PRO) + table `Subscription` (stripeSubId, status, currentPeriodEnd).
- **Gating** : les features §3/§4 ne s'affichent que pour les abonnés (lecture du `plan` côté app + vérif serveur via webhook Stripe).

---

## 3. Facturation / devis / comptabilité (prestataire Pro)

**Objectif** : générer **devis → factures** conformes, suivre les encaissements, exporter la compta.

**Fonctionnel**
- **Devis** : création, envoi, **signature** (cf. SPEC-V2 §2), conversion en facture à l'acceptation.
- **Factures** : numérotation **séquentielle continue**, mentions légales obligatoires (identité + **SIRET**, date, désignation, **TVA** ou mention *« TVA non applicable, art. 293 B du CGI »* pour les micro-entrepreneurs en franchise, total HT/TTC, conditions de paiement, pénalités).
- **Compta** : tableau des encaissements (depuis Stripe Connect), CA mensuel/annuel, **export CSV / FEC** pour le comptable, suivi des impayés.
- Génération **PDF** (`expo-print`) + archivage Supabase Storage.

**⚠️ Réforme facturation électronique (à anticiper)**
- **1ᵉʳ sept. 2026** : **toutes** les entreprises doivent pouvoir **recevoir** des factures électroniques ; les grandes/ETI doivent aussi **émettre**.
- **1ᵉʳ sept. 2027** : **micro-entreprises et PME** doivent **émettre** leurs factures électroniques.
- Les factures B2B transitent **obligatoirement** via une **Plateforme de Dématérialisation Partenaire (PDP) agréée** (format **Factur-X**/structuré + e-reporting à la DGFiP). 101 PDP déjà immatriculées.
- **Conséquence SERVI** : prévoir l'export **Factur-X** et, à terme, le **raccordement à une PDP** (ou devenir/relayer via une PDP) plutôt que de générer un simple PDF. La plupart des prestations SERVI sont **B2C** (e-reporting des transactions) mais l'**e-reporting** reste requis.

---

## 4. Crédit d'impôt « Services à la personne » (client) — *recherché en profondeur*

C'est l'argument massue, **mais strictement encadré**. Ne s'applique **qu'à certaines prestations** rendues **au domicile** du client, par un prestataire **déclaré SAP**.

### 4.1 Le crédit d'impôt (chiffres officiels)
- **Taux : 50 %** des dépenses supportées dans l'année.
- **Plafond global : 12 000 €/an** de dépenses (→ crédit max **6 000 €**).
  - **+1 500 €** par enfant à charge (750 € en garde alternée) ou par membre/ascendant > 65 ans, **plafond ≤ 15 000 €**.
  - **1ʳᵉ année** d'emploi direct : 15 000 € (→ 18 000 € avec majorations).
  - **Invalidité** : 20 000 €.
- **Sous-plafonds spécifiques** (inclus dans le global) :
  - **Petit bricolage** : **500 €/an** (intervention ≤ 2 h).
  - **Petit jardinage** : **5 000 €/an**.
  - **Assistance informatique** : **3 000 €/an**.

### 4.2 Condition clé : prestataire **déclaré**
Le client n'a droit au crédit que si la prestation est rendue par **un salarié qu'il emploie directement** *ou* par **une association / entreprise / organisme DÉCLARÉ** « services à la personne » (déclaration SAP). → **Tous les prestataires SERVI ne sont pas automatiquement éligibles** : il faut un statut SAP déclaré.

### 4.3 Quelles catégories SERVI sont éligibles ?
| Catégorie SERVI | Éligible crédit d'impôt ? |
|---|---|
| Ménage / entretien maison | ✅ |
| Petit jardinage | ✅ (plafond 5 000 €) |
| Petit bricolage | ✅ partiel (plafond 500 €, ≤ 2 h) |
| Cours particuliers / soutien scolaire | ✅ |
| Garde d'enfants, assistance personnes âgées | ✅ |
| Assistance informatique | ✅ (plafond 3 000 €) |
| **Plomberie, Électricité (travaux)** | ❌ non éligible |
| **Beauté (général)** | ❌ (sauf soins à domicile de personnes dépendantes) |

→ SERVI doit **taguer chaque service** « éligible SAP » et n'afficher le crédit d'impôt **que là**.

### 4.4 Deux niveaux d'implémentation

**Niveau A — Assistant fiscal (faisable vite, sans habilitation)**
- Marquer les services éligibles, **estimer le crédit (50 %)** à la réservation (« coût réel après crédit »).
- Émettre l'**attestation fiscale annuelle** (le prestataire déclaré la fournit) récapitulant les sommes versées → le client la reporte en **case 7DB** de sa déclaration.
- Le client récupère 50 % **l'année suivante** (crédit d'impôt classique).

**Niveau B — Avance immédiate (le « waouh », mais lourd réglementairement)**
- Service **gratuit URSSAF** : le client ne paie **que le reste à charge (50 %)** tout de suite, l'autre moitié étant avancée par l'État.
- **Mécanique** : le prestataire (déclaré SAP **et habilité**) transmet la facture à l'URSSAF via l'**API Tiers de Prestation** ; le client **valide sous 48 h** sur particulier.urssaf.fr ; à **J+2**, l'URSSAF prélève le reste à charge et reverse le crédit.
- **Prérequis** : être **organisme de services à la personne déclaré** + **habilité à l'API Tiers de Prestation** (ou API Tierce Déclaration Cesu) de l'URSSAF. C'est une **démarche d'entreprise** (immatriculation, conformité), pas juste du code.

### 4.5 Articulation paiement ↔ crédit d'impôt
- **Service non éligible / niveau A** : paiement **100 % via Stripe Connect** (+ attestation annuelle si éligible).
- **Service éligible + avance immédiate (niveau B)** : le **flux de paiement passe par l'URSSAF** (reste à charge prélevé par l'URSSAF), pas par Stripe → SERVI route le paiement selon l'éligibilité et l'habilitation. Les deux rails coexistent.

---

## 5. Modèle de données (ajouts)
```
StripeAccount    { id, userId, stripeAccountId, chargesEnabled, payoutsEnabled }
Payment          { id, bookingId, amount, commission, status, stripePaymentIntentId,
                   transferId, captured, refundedAmount }
Subscription     { id, userId, plan(FREE|PREMIUM|PRO), status, stripeSubId, currentPeriodEnd }
Quote (Devis)    { id, bookingId?, prestataireId, clientId, lines jsonb, totalHT, tva,
                   totalTTC, status(DRAFT|SENT|SIGNED|ACCEPTED|REFUSED), signatureId? }
Invoice (Facture){ id, quoteId?, number(séquentiel), prestataireId, clientId, lines, totals,
                   tvaRegime, pdfUrl, facturXUrl?, status, dueDate, paidAt }
SapEligibility   (sur Service/Category : flag eligible + type + sousPlafond)
TaxAdvance (AICI){ id, bookingId, urssafRequestId, montantTotal, resteACharge, status }
```

---

## 6. Roadmap proposée + prérequis

| Lot | Contenu | Prérequis externes |
|---|---|---|
| **P-1** | **Stripe Connect** (paiement réel + reversement + commission) | Compte Connect activé, KYC prestataires |
| **P-2** | **Abonnements** Free/Pro/Premium (Stripe Billing) + gating | Produits/prix Stripe |
| **P-3** | **Devis + Factures** PDF conformes + compta/export (Pro) | Mentions légales, numérotation |
| **P-4** | **Assistant crédit d'impôt niveau A** (tag éligibilité, estimation, attestation annuelle) | Statut **SAP déclaré** des prestataires |
| **P-5** | **Avance immédiate niveau B** (API Tiers de Prestation URSSAF) | **Habilitation API URSSAF** + déclaration SAP |
| **P-6** | **Facturation électronique** (Factur-X + raccordement PDP) | Choix d'une **PDP agréée** (échéances 2026/2027) |

> Reco : **P-1 → P-2 → P-3** sont du ressort 100 % SERVI (faisables tout de suite).
> **P-4 → P-6** dépendent de **démarches administratives** (déclaration SAP, habilitation URSSAF, PDP) à lancer **en parallèle** côté entreprise — je peux préparer le code, mais les agréments sont des étapes business.

---

## Sources (consultées juin 2026)
- Crédit d'impôt (taux, plafonds, sous-plafonds, condition « déclaré », activités) — [service-public.gouv.fr F12](https://www.service-public.gouv.fr/particuliers/vosdroits/F12), [economie.gouv.fr](https://www.economie.gouv.fr/particuliers/gerer-mon-argent/beneficier-daides-et-de-reductions-dimpots/tout-savoir-sur-le-credit-dimpot-lie-lemploi-dun-salarie-domicile), [impots.gouv.fr — emploi à domicile](https://www.impots.gouv.fr/particulier/emploi-domicile)
- Avance immédiate + API Tiers de Prestation — [urssaf.fr — service avance immédiate](https://www.urssaf.fr/accueil/services/services-particuliers/service-avance-immediate.html), [urssaf.fr — API Tiers de Prestation (FAQ)](https://www.urssaf.fr/portail/home/employeur-du-secteur-des-service/prestataire/foire-aux-questions/lapi-tiers-de-prestation.html), [portailapi.urssaf.fr](https://portailapi.urssaf.fr/fr)
- Stripe Connect (charges, application fees, France/EEA) — [docs.stripe.com/connect/charges](https://docs.stripe.com/connect/charges), [marketplace/app-fees](https://docs.stripe.com/connect/marketplace/tasks/app-fees), [separate-charges-and-transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- Facturation électronique (calendrier 2026/2027, PDP) — [impots.gouv.fr — facturation électronique](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees), [economie.gouv.fr — tout savoir](https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises)
