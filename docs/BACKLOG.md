# SERVI — Backlog idées (à prioriser)

Statut : 🟢 codable maintenant · 🟡 code + config/API externe · 🔴 dépend d'une démarche/app tierce.

| # | Idée | Niveau | Notes |
|---|---|---|---|
| B1 | **Carnet d'adresses client** (enregistrer plusieurs adresses d'intervention depuis le profil, choix rapide à la réservation) | 🟢 | Prolonge l'autocomplétion BAN. Table `SavedAddress`. **→ en cours.** |
| B2 | **Relances auto** (prestataire Premium) quand un client n'a pas recontacté depuis X jours (délai réglable par presta) | 🟡 | Cron/Edge Function + table `FollowUpRule` + envoi message/notif. Réservé Pro. |
| B3 | **SIRET + recherche auto entreprise** dans le profil prestataire | 🟢 | API publique gratuite `recherche-entreprises.api.gouv.fr` → auto-remplit raison sociale/adresse/APE. |
| B4 | **Logo prestataire** + import infos **Google Business Profile** (gratuit) | 🟡 | Logo = upload Storage (🟢). Google Business = API Google (OAuth + Business Profile API, validation Google). |
| B5 | **Connexion app « Artisan Pro »** (ton autre app) → pré-remplit le profil prestataire SERVI | 🔴 | Nécessite une **API/contrat de données** entre les 2 apps (auth partagée + schéma d'échange). À concevoir avec Artisan Pro. |
| B6 | **Publicités prestataires sur l'écran d'accueil** ciblées (localité, recherches, habitudes) | 🟡 | Annonces sponsorisées (cf. SPEC-PAIEMENTS §6) + moteur de ciblage (géo + historique). Table `SponsoredListing` + scoring. |
| B7 | **Intake client « façon Netflix »** : à la 1ʳᵉ connexion, préférences de prestations (ex. Jardinage X/semaine, quoi faire) → **matchmaking** avec les pros du coin | 🟡 | Écrans onboarding + table `ServiceRequest`/`Preference` + matching géo/catégorie + notif aux pros. |

## Détails utiles
- **B3 SIRET** : `GET https://recherche-entreprises.api.gouv.fr/search?q=<siret|nom>` → renvoie nom, SIREN/SIRET, adresse, code APE, dirigeants. Gratuit, sans clé.
- **B4 Google Business** : l'import auto exige la **Business Profile API** (OAuth Google + le pro doit posséder/valider sa fiche). Sinon, saisie manuelle + lien vers la fiche.
- **B5 Artisan Pro** : modèle recommandé = SERVI expose un **endpoint d'import** (Edge Function) que Artisan Pro appelle avec un token, en envoyant le JSON du profil (service, zone, SIRET, certifs, photos). À cadrer ensemble.
- **B6/B7** : s'appuient sur les paliers (Premium/Pro) et la monétisation déjà spécifiés.
