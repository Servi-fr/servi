# 03 — Conformité déjà intégrée au produit

Éléments **déjà implémentés** dans les applications (à auditer/valider par le conseil, mais le socle existe).

## 1. Documents légaux in-app (brouillons à valider)

Écran « Légal & confidentialité » accessible dans les deux apps, contenant trois documents rédigés en première version :
- **Politique de confidentialité** ;
- **Conditions générales d'utilisation** ;
- **Mentions légales**.

> Ces textes sont des **brouillons de travail** : ils doivent être réécrits/validés par le conseil (c'est l'un des livrables attendus — pièce 04, chantier 5).

## 2. Loyauté et transparence

- Fiches mises en avant **étiquetées « Sponsorisé »** (transparence du classement, exigence plateformes).
- **Aucun dark pattern** : pas de fausse urgence, pas de cases pré-cochées, pas de frais cachés (le client paie le prix affiché, point) ; l'offre d'abonnement indique « sans engagement, résiliable à tout moment ».
- Avis : liés à une **réservation réelle** (seuls un client et un prestataire ayant contracté ensemble peuvent se noter) — élément favorable au regard de la réglementation sur les avis en ligne.
- Prix : affichés TTC (prestataires en franchise de TVA à ce stade type micro-entrepreneur ; à confirmer par le conseil).

## 3. Facturation — état d'avancement vis-à-vis de la réforme 2026/2027

- Génération de **devis et factures** pour les prestataires, avec numérotation séquentielle (FACT-AAAA-NNNN / DEV-AAAA-NNNN).
- **Factures au format Factur-X** (norme EN 16931) : générées **côté serveur** en **PDF/A-3** (polices embarquées, profil colorimétrique, XML structuré profil EN 16931 intégré), mention « TVA non applicable, art. 293 B du CGI », pénalités de retard et indemnité forfaitaire de 40 € mentionnées.
- Mécanisme de repli : si le serveur est indisponible, une version locale est générée avec **filigrane « PROVISOIRE · NON DÉFINITIF »** (aucun risque de confusion).
- **Reste à faire (planifié)** : raccordement à une **Plateforme Agréée** (PA/PDP) pour la transmission légale — obligation d'émission pour les micro/TPE au **1er septembre 2027**. Le format est déjà prêt.

## 4. Protection de l'utilisateur dans le produit

- **Confirmation avant toute action irréversible** (annuler/refuser/terminer une réservation).
- Anti-double-réservation (un créneau ne peut être réservé deux fois) et blocage des créneaux passés.
- Erreurs réseau **toujours signalées** (pas de « faux succès ») ; aucun message perdu silencieusement.
- **Accessibilité** : 3 passes d'audit réalisées — labels lecteurs d'écran (VoiceOver/TalkBack) sur tous les boutons, contrastes WCAG AA sur le texte informatif, cibles tactiles ≥ 44 pt.
- Notifications : uniquement liées à l'activité de l'utilisateur (réservations, messages) ; pas de notifications marketing ; relances prestataires plafonnées.

## 5. Crédit d'impôt SAP — traitement actuel (prudent)

- L'app affiche une **estimation** du crédit d'impôt de 50 % sur les catégories éligibles, avec plafonds spécifiques (petit bricolage 500 €, jardinage 5 000 €, assistance informatique 3 000 €) et un **disclaimer explicite** (« Estimation. Crédit d'impôt "services à la personne" sous conditions »).
- Un écran d'information dédié explique les conditions (prestataire déclaré, prestation au domicile).
- **Aucun engagement n'est pris au nom de l'administration** ; la plateforme ne calcule pas l'avance immédiate — question de positionnement ouverte (pièce 04, chantier 6).
