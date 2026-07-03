# Dossier juridique — SERVI

**Objet : structuration juridique et administrative de la plateforme SERVI**
Préparé le 3 juillet 2026 pour examen par le conseil de l'éditeur.

> ⚠️ Ce dossier est un document de travail **descriptif**, préparé avec l'aide d'un assistant IA à partir de l'état réel du produit. Il ne constitue pas un avis juridique. Les points de droit y sont formulés comme des **questions à instruire** par l'avocat.

---

## L'essentiel en 10 lignes

SERVI est une **place de marché de services à domicile** (ménage, jardinage, plomberie, électricité, bricolage, cours, beauté, coaching) mettant en relation des **clients particuliers** et des **prestataires indépendants** en France. Elle se compose de **deux applications mobiles distinctes** (SERVI pour les clients, SERVI Pro pour les prestataires) reliées par un back-end commun.

**Modèle économique** : gratuité totale côté client ; **commission prélevée sur le prestataire** (15 %, réduite à 10 % pour les abonnés) ; **abonnement « SERVI Pro » à 19,99 €/mois** pour les prestataires. Paiements via Stripe.

**Stade** : bêta privée (TestFlight / APK de test). **Aucune exploitation commerciale réelle à ce jour** : paiements en mode test Stripe, pas de flux d'argent réels encaissés. C'est précisément **avant l'ouverture commerciale** que l'éditeur souhaite arrêter la structure juridique.

**La décision principale attendue du conseil : quelle forme et quelle architecture juridique donner à l'exploitation** (société, statut de plateforme, circuit des fonds), et quels documents contractuels établir avant le lancement.

---

## Sommaire du dossier

| Pièce | Contenu |
|---|---|
| [01 — Produit et modèle économique](01-produit-et-modele.md) | Description fonctionnelle des 2 apps, parcours utilisateurs, modèle de revenus, **circuit des fonds** (point sensible) |
| [02 — Technique, données personnelles, sous-traitants](02-technique-donnees.md) | Architecture, données traitées, hébergement (Paris), chaîne de sous-traitance, sécurité |
| [03 — Conformité déjà en place](03-conformite-existante.md) | Ce que le produit intègre déjà (documents légaux in-app, transparence, facturation électronique, accessibilité…) |
| [04 — Questions à trancher par le conseil](04-questions-a-trancher.md) | **La liste structurée des décisions et livrables attendus** (11 chantiers) |
| [05 — Annexes techniques et identifiants](05-annexes.md) | Identifiants App Store / Play / Supabase / Stripe, comptes, actifs, contacts |

---

## Les 5 questions prioritaires (résumé de la pièce 04)

1. **Forme sociale et logement de l'activité** — aujourd'hui portée par M. Julien Marchal à titre individuel (compte développeur Apple individuel ; actifs mêlés avec son autre activité « Whales Records »). Faut-il créer une société dédiée, et laquelle ?
2. **Circuit des fonds** — la plateforme encaisse le prix payé par le client puis reverse au prestataire (net de commission). Cette intermédiation d'encaissement est-elle un **service de paiement réglementé** (agrément / exemption / architecture Stripe Connect avec cantonnement chez Stripe) ? **C'est le point à sécuriser avant tout lancement.**
3. **Statut de plateforme en ligne** — obligations d'opérateur de plateforme (loyauté, transparence du classement, DSA) et **obligations fiscales déclaratives** (DAC7 / art. 242 bis CGI : déclaration annuelle des revenus des prestataires).
4. **Relation avec les prestataires** — sécuriser l'indépendance (pas de requalification) et rédiger les CGU professionnelles ; formaliser le **mandat de facturation** (la plateforme génère les factures pour le compte des prestataires).
5. **Corpus contractuel** — CGU client, CGU prestataire, CGV de l'abonnement, politique de confidentialité : des brouillons existent dans l'app et doivent être **réécrits/validés** par le conseil.
