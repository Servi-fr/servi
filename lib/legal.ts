// Textes légaux (brouillons). À faire valider par un juriste avant publication.
// Les [À COMPLÉTER] doivent être renseignés (SIREN, adresse, etc.).
export type LegalDoc = { slug: string; title: string; updated: string; body: string };

const EDITEUR = 'Whales Records';
const CONTACT = 'hello@whalesrecords.com';

export const legalDocs: LegalDoc[] = [
  {
    slug: 'confidentialite',
    title: 'Politique de confidentialité',
    updated: 'Juin 2026',
    body: `Cette politique explique quelles données SERVI collecte et comment elles sont utilisées, conformément au RGPD.

1. Responsable du traitement
${EDITEUR} — contact : ${CONTACT}. [À COMPLÉTER : raison sociale, SIREN, adresse].

2. Données collectées
• Compte : email, nom, mot de passe (chiffré), éventuellement identité Google.
• Profil : prénom, nom, téléphone, adresse.
• Prestataires : métier, tarif, ville et rayon d'intervention, diplômes/certifications, description.
• Activité : réservations, statuts, avis, messages échangés.
• Techniques : identifiants d'appareil, journaux de connexion.

3. Finalités et base légale
• Fournir le service de mise en relation et de réservation (exécution du contrat).
• Gérer les paiements (exécution du contrat).
• Sécurité et prévention de la fraude (intérêt légitime).
• Communications liées au service (exécution du contrat).

4. Destinataires / sous-traitants
• Supabase (hébergement base de données & authentification).
• Stripe (traitement des paiements) — le cas échéant.
• Google (connexion via Google) — le cas échéant.
Aucune donnée n'est vendue à des tiers.

5. Durée de conservation
Les données du compte sont conservées tant que le compte est actif, puis supprimées ou anonymisées dans un délai raisonnable après sa clôture, sauf obligation légale (ex. facturation).

6. Vos droits (RGPD)
Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Pour les exercer : ${CONTACT}. Vous pouvez aussi saisir la CNIL (cnil.fr).

7. Sécurité
Les accès aux données sont protégés par des politiques de sécurité au niveau des lignes (RLS) : chaque utilisateur n'accède qu'à ses propres données.

8. Contact
Pour toute question : ${CONTACT}.`,
  },
  {
    slug: 'cgu',
    title: "Conditions générales d'utilisation",
    updated: 'Juin 2026',
    body: `1. Objet
SERVI est une plateforme de mise en relation entre des clients et des prestataires de services à domicile. ${EDITEUR} fournit l'outil de réservation mais n'est pas partie au contrat de prestation conclu entre client et prestataire.

2. Compte
La création d'un compte nécessite une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants et de l'exactitude de vos informations.

3. Rôles
Tout utilisateur peut agir comme client (réserver) et/ou comme prestataire (proposer ses services), en renseignant le profil correspondant.

4. Réservations
Une réservation constitue une demande adressée au prestataire, qui peut l'accepter ou la refuser. Les conditions d'exécution (horaire, lieu, prestation) sont convenues entre les parties.

5. Prix et paiement
Les tarifs sont fixés par les prestataires. Des frais de service SERVI peuvent s'appliquer et sont affichés avant validation. Le paiement en ligne, lorsqu'il est proposé, est opéré via Stripe.

6. Obligations
Les prestataires s'engagent à fournir des prestations conformes et à détenir les qualifications/assurances requises. Les clients s'engagent à fournir des informations exactes et à régler les prestations convenues.

7. Responsabilité
${EDITEUR} n'est pas responsable de la bonne exécution des prestations entre utilisateurs. La plateforme est fournie « en l'état ».

8. Avis
Les avis doivent être honnêtes et respectueux. Les contenus illicites ou abusifs peuvent être supprimés.

9. Résiliation
Vous pouvez fermer votre compte à tout moment. ${EDITEUR} peut suspendre un compte en cas de manquement aux présentes conditions.

10. Droit applicable
Les présentes sont soumises au droit français. [À COMPLÉTER : juridiction compétente].`,
  },
  {
    slug: 'mentions',
    title: 'Mentions légales',
    updated: 'Juin 2026',
    body: `Éditeur
${EDITEUR}. [À COMPLÉTER : forme juridique, capital, SIREN/RCS, adresse du siège]. Contact : ${CONTACT}.

Directeur de la publication
[À COMPLÉTER : nom].

Hébergement
• Application & base de données : Supabase Inc.
• Site web : Vercel Inc.

Propriété intellectuelle
La marque, le logo et les contenus de SERVI sont protégés. Toute reproduction non autorisée est interdite.

Contact
Pour toute question : ${CONTACT}.`,
  },
];

export const getLegalDoc = (slug?: string) => legalDocs.find((d) => d.slug === slug);
