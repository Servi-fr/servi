# 04 — Questions à trancher par le conseil (11 chantiers)

Formulées comme des questions ouvertes ; l'éditeur attend un arbitrage et, le cas échéant, la rédaction des actes. **Priorités marquées 🔴 (avant tout lancement commercial), 🟠 (avant/au lancement), 🟡 (peut suivre le lancement).**

---

## 🔴 1. Forme sociale et logement de l'activité

Situation : l'activité est aujourd'hui portée par **M. Julien Marchal à titre personnel** (compte Apple individuel, comptes Stripe/Supabase/Google à son nom), avec des identifiants techniques historiquement liés à son autre activité (label musical **Whales Records** — les identifiants d'apps iOS contiennent « whalesrecords »).

À trancher :
- Création d'une **société dédiée** (SASU/SAS ? autre ?) pour exploiter SERVI ; calendrier (avant l'ouverture des paiements réels ?).
- **Transfert des actifs** vers la société : comptes développeurs (bascule du compte Apple individuel vers un compte **organisation** — nécessite un D-U-N-S de la société), compte Stripe, marque/logo, nom de domaine, code (propriété), base de données.
- Régime fiscal/social du dirigeant ; objet social couvrant : mise en relation, intermédiation, services numériques, éventuellement activités SAP.

## 🔴 2. Circuit des fonds — services de paiement

Décrit en pièce 01 §5. La plateforme encaisse le prix payé par le client puis reverse la rémunération au prestataire (net de commission).

À trancher :
- Qualification de l'opération (encaissement pour compte de tiers) au regard du **Code monétaire et financier** ; besoin d'un **agrément** d'établissement de paiement, d'un **statut d'agent** de PSP, d'une **exemption**, ou neutralisation du sujet par une architecture **Stripe Connect** (fonds détenus par Stripe, établissement agréé ; la plateforme ne touche que sa commission).
- Rédaction des clauses correspondantes dans les CGU (mandat d'encaissement le cas échéant, délais de reversement, litiges/remboursements, no-show, annulations).
- Sort des paiements en cas d'annulation/contestation (politique de remboursement à définir contractuellement).

## 🔴 3. Statut d'opérateur de plateforme en ligne

- Obligations de **loyauté et transparence** (art. L111-7 et s. C. conso ; décret « classement ») : critères de classement à publier, distinction contenus sponsorisés (déjà étiquetés dans l'app).
- **Règlement DSA** : point de contact, mécanisme de signalement des contenus (avis, profils), motivation des retraits, interdiction des interfaces trompeuses. Périmètre exact des obligations selon la taille (micro-entreprise → dispenses partielles).
- **Obligations fiscales des plateformes** : art. 242 bis CGI et **DAC7** — déclaration annuelle à l'administration des revenus réalisés par les prestataires via la plateforme + récapitulatif annuel à chaque prestataire. À intégrer au calendrier de conformité (l'app dispose déjà des données nécessaires).
- Document d'information sur les **obligations sociales/fiscales des prestataires** (obligation d'information des plateformes envers leurs utilisateurs professionnels).
- Règlement **P2B** (2019/1150) le cas échéant (relations plateforme ↔ entreprises utilisatrices) : préavis de modification des CGU pro, motivation des déréférencements.

## 🔴 4. Relation plateforme ↔ prestataires (indépendance)

- Audit du **faisceau d'indices de requalification** (travail dissimulé / salariat) : les éléments favorables existent (libre fixation des tarifs, liberté d'accepter/refuser, pas d'exclusivité, pas de sanction d'inactivité — pièce 01 §2) ; vérifier que les fonctionnalités futures (relances, classement, mise en avant) ne créent pas de subordination de fait.
- Rédaction des **CGU professionnelles** : statut d'indépendant, obligations déclaratives, assurances exigées (RC pro ; décennale pour certains métiers ?), régime de responsabilité de la plateforme (simple intermédiaire), résiliation.
- **Mandat de facturation écrit** : la plateforme émet les factures au nom et pour le compte du prestataire (fonctionnalité déjà active) — à formaliser dans les CGU pro.

## 🟠 5. Corpus contractuel consommateurs

- Réécriture/validation des trois documents in-app (CGU, confidentialité, mentions légales) + création des **CGV de l'abonnement SERVI Pro**.
- **Droit de rétractation** (14 jours) sur les prestations réservées : articulation avec les prestations exécutées avant l'expiration du délai (renonciation expresse à recueillir dans le parcours de réservation ?).
- **Médiateur de la consommation** : adhésion obligatoire dès la première vente B2C — choix du médiateur et mention dans les CGU.
- Modalités de réclamation, annulation, remboursement (à articuler avec le chantier 2).
- Abonnement : mécanique de **résiliation « en 3 clics »** si applicable ; qualification B2B (prestataire pro) à confirmer pour le régime applicable.

## 🟠 6. Services à la personne (SAP) et crédit d'impôt

- L'app affiche une **estimation** du crédit d'impôt (50 %) avec disclaimer — suffisant à ce stade ?
- Positionnement cible : simple information / **mandataire SAP** (déclaration/agrément) / intégration de l'**avance immédiate URSSAF** (API Tiers de prestation — la plateforme deviendrait tiers de prestation habilité). Impacts : agrément, responsabilité, wording.
- Conditions à rappeler aux prestataires (déclaration SAP NOVA pour que leurs clients bénéficient du crédit d'impôt).

## 🟠 7. Facturation électronique (réforme 2026/2027)

- Le format est prêt (Factur-X EN 16931, PDF/A-3 — pièce 03 §3).
- À planifier : choix et contractualisation d'une **Plateforme Agréée** (PA) pour l'émission pour compte des prestataires (obligation micro/TPE : **1er sept. 2027**) ; qualification du rôle de SERVI dans ce circuit (OD/solution compatible s'appuyant sur une PA — pas d'immatriculation PA en propre envisagée).

## 🟠 8. RGPD — mise en conformité formelle

Le socle technique est sain (hébergement **Paris**, minimisation, pas de traceurs publicitaires — pièce 02). Restent les livrables formels :
- **Registre des traitements** ; bases légales par finalité ; **durées de conservation** et purge automatisée.
- Contrats art. 28 avec les sous-traitants (Supabase, Stripe, Expo) ; **encadrement des transferts hors UE** (Expo/US notamment : DPF ou CCT+TIA).
- Politique de confidentialité définitive (remplace le brouillon) ; parcours d'exercice des droits (l'app permet déjà l'édition du profil ; **suppression de compte in-app** exigée par Apple/Google — à vérifier/compléter).
- Opportunité d'une **AIPD** (croisement géolocalisation ponctuelle + adresses + messagerie) ; désignation d'un DPO (probablement non obligatoire au démarrage — à confirmer).
- Procédure **violation de données** (notification CNIL 72 h).

## 🟡 9. Assurances

- **RC professionnelle** de l'exploitant (édition de plateforme numérique).
- Politique vis-à-vis des prestataires : RC pro exigée à l'inscription ? vérification ? assurance « casse/dommages » de plateforme (comme certains concurrents) ?

## 🟡 10. Propriété intellectuelle

- **Dépôt de la marque « SERVI »** (INPI) — recherche d'antériorité préalable (le signe est court et le secteur des services encombré : risque d'antériorités — classes pertinentes a priori 9, 35, 38, 42) ; le logo (deux barres) en marque semi-figurative ?
- Nom de domaine à sécuriser en cohérence (servi.app est utilisé comme identifiant Android — le domaine correspondant est-il détenu ?).
- Titularité du code (développé pour l'éditeur avec assistance IA — pas de prestataire tiers revendiquant des droits) ; dépôt e-Soleau éventuel.

## 🟡 11. Divers fiscal

- **TVA sur la commission** et sur l'abonnement (services électroniques B2B/B2C, autoliquidation le cas échéant).
- Comptabilisation des flux pour compte de tiers (si la plateforme encaisse) ; conséquences du choix du chantier 2.
- Seuils micro/franchise de l'exploitant selon la forme retenue (chantier 1).

---

## Livrables attendus du conseil (récapitulatif)

1. Recommandation **forme sociale** + accompagnement constitution et transferts d'actifs.
2. Arbitrage **circuit des fonds** (avec ou sans agrément ; validation de l'architecture Stripe Connect).
3. **CGU client**, **CGU prestataire** (avec mandat de facturation), **CGV abonnement**, **politique de confidentialité**, **mentions légales** — versions définitives.
4. Note sur les obligations **plateforme** (L111-7, DSA, DAC7/242 bis, P2B) avec calendrier.
5. Position **SAP/crédit d'impôt** et wording validé.
6. Check-list assurances + PI (dépôt de marque).
