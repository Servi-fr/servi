# 01 — Produit et modèle économique

## 1. Ce qu'est SERVI

Place de marché française de **services à domicile** mettant en relation :
- des **clients particuliers** (B2C) qui cherchent un prestataire près de chez eux ;
- des **prestataires indépendants** (artisans, micro-entrepreneurs, professionnels des services à la personne) qui proposent leurs services.

Catégories couvertes (8) : ménage, jardinage, plomberie, électricité, bricolage, cours particuliers, beauté à domicile, coaching sportif. Plusieurs relèvent des **services à la personne (SAP)** ouvrant droit au crédit d'impôt de 50 % (ménage, jardinage, cours, bricolage — dans les plafonds légaux).

## 2. Deux applications distinctes

| | **SERVI** (clients) | **SERVI Pro** (prestataires) |
|---|---|---|
| Public | Grand public | Professionnels indépendants |
| Fonctions | Recherche, carte, réservation de créneaux, adresses enregistrées, messagerie, avis, estimation du crédit d'impôt | Tableau de bord (revenus nets), demandes (accepter/refuser), planning, fiche pro (SIRET, logo, photos, certifications), devis & factures, mise en avant, relances |
| Identité | Bleu | Noir & blanc, icône dédiée |

Les deux apps sont **hermétiques** (aucune bascule de rôle dans l'interface) et reliées uniquement par les données : une réservation faite dans SERVI arrive dans SERVI Pro du prestataire concerné.

**Éléments d'indépendance des prestataires** (pertinents pour l'analyse de non-requalification) :
- le prestataire **fixe librement son tarif horaire**, sa zone et son rayon d'intervention ;
- il **accepte ou refuse librement** chaque demande, sans pénalité ni obligation d'activité ;
- pas d'exclusivité, pas d'horaires imposés, pas de matériel fourni par la plateforme ;
- son identité professionnelle est vérifiable : **SIRET renseigné et vérifié** via l'API publique recherche-entreprises (api.gouv.fr), qui remonte aussi les labels officiels (**RGE, Qualiopi, Bio**) ;
- avis **bidirectionnels** (les clients notent les prestataires ET inversement).

## 3. Parcours type

1. Le client décrit son besoin ou choisit une catégorie → voit les prestataires (liste + carte), leurs tarifs, avis, certifications.
2. Il réserve un **créneau** chez un prestataire, à une **adresse validée** (base adresse nationale) ; anti-double-réservation ; vérification de la zone d'intervention.
3. Le prestataire **accepte ou refuse** dans SERVI Pro. Messagerie intégrée. Notifications push.
4. Après la prestation : le prestataire la marque « terminée », peut générer **devis/facture** ; chacun laisse un avis.

## 4. Modèle de revenus (décidé, implémenté)

| Source | Montant | Qui paie |
|---|---|---|
| **Commission** sur chaque prestation | **15 %** du prix | Le **prestataire** (déduite de sa rémunération) |
| Commission **réduite** abonnés | **10 %** | idem |
| **Abonnement « SERVI Pro »** | **19,99 €/mois**, sans engagement | Le prestataire (optionnel) |
| Mise en avant « À la une » (sponsoring) | prévu, non facturé à ce stade | Le prestataire |

- **Le client ne paie aucun frais** : il paie le prix affiché par le prestataire, rien de plus.
- Positionnement volontairement sous le marché (repères relevés : Wecasa ≈ 25 % côté prestataire, TaskRabbit ≈ 30 % côté client, Yoojo ≈ 15 %).
- L'abonnement donne : commission réduite, devis/factures (Factur-X), mise en avant, photos illimitées, statistiques, relances automatiques de clients.
- **TVA sur la commission et l'abonnement : à instruire** (facturation de la plateforme aux prestataires).

## 5. Circuit des fonds — POINT JURIDIQUE SENSIBLE

État actuel de l'implémentation (paiements en **mode test Stripe**, aucun flux réel) :

1. Le client paie la réservation par carte via **Stripe Checkout** (page de paiement hébergée par Stripe ; la plateforme ne voit ni ne stocke aucune donnée de carte).
2. Les fonds arrivent sur le **compte Stripe de l'exploitant** (montant calculé côté serveur, anti-fraude).
3. La plateforme doit ensuite **reverser au prestataire** sa rémunération (prix − commission). **Ce reversement n'est pas encore automatisé** : l'architecture cible envisagée est **Stripe Connect** (comptes connectés par prestataire, les fonds étant cantonnés chez Stripe, établissement de monnaie électronique agréé, et la plateforme percevant sa commission en « application fee »).
4. L'abonnement SERVI Pro est un paiement récurrent classique (Stripe Billing) au bénéfice de l'exploitant — pas de question de tiers.

**Question centrale pour le conseil** : la qualification de cette intermédiation d'encaissement (encaissement pour compte de tiers) au regard du droit des services de paiement — agrément d'établissement de paiement, statut d'agent, exemption, ou architecture Stripe Connect évitant la détention de fonds de tiers — et les mentions contractuelles associées. **L'éditeur n'ouvrira pas les paiements réels avant cet arbitrage.**

## 6. Fonctionnalités à incidence juridique particulière

- **Facturation pour compte de tiers** : la plateforme **génère les factures et devis des prestataires** (PDF/A-3 + Factur-X, voir pièce 03). Un **mandat de facturation écrit** prestataire→plateforme est vraisemblablement à formaliser dans les CGU pro.
- **Crédit d'impôt SAP** : l'app affiche une **estimation** (« −50 %, sous conditions ») avec disclaimer. Question : positionnement de la plateforme (simple information, ou intégration de l'**avance immédiate URSSAF** via l'API Tiers de prestation, ou statut de mandataire SAP).
- **Relances automatiques** : un prestataire abonné peut activer la relance de clients sans réponse (fréquence plafonnée à 1 relance par période choisie, anti-spam implémenté).
- **Mise en avant payante** : les fiches sponsorisées sont **étiquetées « Sponsorisé »** dans l'interface (transparence du classement).
