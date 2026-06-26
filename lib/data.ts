// Données partagées de l'app (client + prestataire), charte « 01 Lumière ».
// Couche locale pour l'instant — destinée à être remplacée par des requêtes Supabase.
import {
  Sparkles,
  Sprout,
  Wrench,
  Zap,
  Dumbbell,
  GraduationCap,
  Scissors,
  Hammer,
  Home,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react-native';

export type Category = {
  slug: string;
  name: string;
  desc: string;
  Icon: LucideIcon;
  price: number;
  count: number;
  // Crédit d'impôt "services à la personne" : 50 % des dépenses (cf. docs/SPEC-PAIEMENTS-FISCALITE.md).
  sapEligible?: boolean; // la prestation ouvre droit au crédit d'impôt
  sapCap?: number; // sous-plafond annuel spécifique en € (inclus dans le plafond global)
  sapNote?: string; // précision éventuelle (ex. condition)
};

// Crédit d'impôt SAP : 50 % des sommes versées, prestataire DÉCLARÉ + prestation au domicile.
export const SAP_CREDIT_RATE = 0.5;
export function isSapEligible(slug: string | undefined): boolean {
  return !!categories.find((c) => c.slug === slug)?.sapEligible;
}

export const categories: Category[] = [
  { slug: 'menage', name: 'Ménage', desc: 'Entretien, grand nettoyage, repassage', Icon: Sparkles, price: 25, count: 480, sapEligible: true },
  { slug: 'jardinage', name: 'Jardinage', desc: 'Tonte, taille, plantation', Icon: Sprout, price: 30, count: 320, sapEligible: true, sapCap: 5000 },
  { slug: 'plomberie', name: 'Plomberie', desc: 'Dépannage, installation', Icon: Wrench, price: 45, count: 210 },
  { slug: 'electricite', name: 'Électricité', desc: 'Mise aux normes, dépannage', Icon: Zap, price: 50, count: 185 },
  { slug: 'coaching', name: 'Coaching', desc: 'Sport, bien-être à domicile', Icon: Dumbbell, price: 40, count: 140 },
  { slug: 'cours', name: 'Cours particuliers', desc: 'Soutien scolaire, langues', Icon: GraduationCap, price: 28, count: 390, sapEligible: true },
  { slug: 'beaute', name: 'Beauté', desc: 'Coiffure, soins à domicile', Icon: Scissors, price: 35, count: 260 },
  { slug: 'bricolage', name: 'Bricolage', desc: 'Montage, réparations', Icon: Hammer, price: 38, count: 300, sapEligible: true, sapCap: 500, sapNote: '≤ 2 h / intervention' },
];

// Familles : regroupent les catégories pour la navigation (Accueil & Services).
export type Family = {
  slug: string;
  name: string;
  tagline: string;
  Icon: LucideIcon;
  categories: string[]; // slugs de catégories
};

export const families: Family[] = [
  { slug: 'maison', name: 'Maison & jardin', tagline: 'Entretien, ménage, extérieurs', Icon: Home, categories: ['menage', 'jardinage'] },
  { slug: 'travaux', name: 'Travaux & réparations', tagline: 'Plomberie, électricité, bricolage', Icon: Wrench, categories: ['plomberie', 'electricite', 'bricolage'] },
  { slug: 'bien-etre', name: 'Beauté & bien-être', tagline: 'Coiffure, soins, coaching', Icon: HeartHandshake, categories: ['beaute', 'coaching'] },
  { slug: 'apprentissage', name: 'Cours & soutien', tagline: 'Scolaire, langues, méthodo', Icon: GraduationCap, categories: ['cours'] },
];

export const getFamily = (slug?: string) => families.find((f) => f.slug === slug);
export const familyCategories = (slug?: string) => {
  const f = getFamily(slug);
  if (!f) return [];
  return categories.filter((c) => f.categories.includes(c.slug));
};

export type Service = { label: string; price: number; unit: string };

export type Provider = {
  id: string;
  name: string;
  category: string; // slug de catégorie
  tagline: string;
  rating: number;
  reviews: number;
  jobs: number;
  city: string;
  verified: boolean;
  bio: string;
  services: Service[];
  radiusKm?: number; // rayon d'intervention autour de la ville
  certifications?: string[]; // diplômes / certifications
};

export const providers: Provider[] = [
  // Ménage
  {
    id: 'p-menage-1', name: 'Awa Diop', category: 'menage', tagline: 'Ménage & repassage soignés',
    rating: 4.9, reviews: 128, jobs: 540, city: 'Paris 11e', verified: true,
    bio: "10 ans d'expérience dans l'entretien de domiciles et bureaux. Produits écologiques, ponctualité garantie, attention aux détails.",
    services: [
      { label: 'Ménage régulier', price: 25, unit: '/ h' },
      { label: 'Grand nettoyage', price: 32, unit: '/ h' },
      { label: 'Repassage', price: 22, unit: '/ h' },
    ],
  },
  {
    id: 'p-menage-2', name: 'Léa Moreau', category: 'menage', tagline: 'Entretien éco-responsable',
    rating: 4.8, reviews: 76, jobs: 310, city: 'Paris 15e', verified: true,
    bio: 'Spécialiste du nettoyage écologique pour particuliers exigeants. Flexible sur les horaires, du lundi au samedi.',
    services: [
      { label: 'Ménage régulier', price: 27, unit: '/ h' },
      { label: 'Vitres & sols', price: 30, unit: '/ h' },
    ],
  },
  // Jardinage
  {
    id: 'p-jardinage-1', name: 'Hugo Bernard', category: 'jardinage', tagline: 'Paysagiste diplômé',
    rating: 4.9, reviews: 94, jobs: 280, city: 'Boulogne', verified: true,
    bio: "Création et entretien d'espaces verts. Tonte, taille, plantation et conseils d'aménagement. Matériel professionnel fourni.",
    services: [
      { label: 'Tonte de pelouse', price: 30, unit: '/ h' },
      { label: 'Taille de haies', price: 35, unit: '/ h' },
      { label: 'Aménagement', price: 45, unit: '/ h' },
    ],
  },
  {
    id: 'p-jardinage-2', name: 'Inès Faure', category: 'jardinage', tagline: 'Entretien de jardins',
    rating: 4.7, reviews: 52, jobs: 160, city: 'Vincennes', verified: false,
    bio: 'Passionnée de jardinage, je prends soin de vos extérieurs avec rigueur et bonne humeur.',
    services: [
      { label: 'Entretien courant', price: 28, unit: '/ h' },
      { label: 'Désherbage', price: 26, unit: '/ h' },
    ],
  },
  // Plomberie
  {
    id: 'p-plomberie-1', name: 'Karim Haddad', category: 'plomberie', tagline: 'Plombier — dépannage rapide',
    rating: 4.9, reviews: 211, jobs: 870, city: 'Paris 12e', verified: true,
    bio: 'Artisan plombier, intervention en urgence 7j/7. Fuites, sanitaires, chauffe-eau. Devis transparent avant intervention.',
    services: [
      { label: 'Dépannage fuite', price: 60, unit: 'forfait' },
      { label: 'Installation sanitaire', price: 50, unit: '/ h' },
      { label: 'Chauffe-eau', price: 90, unit: 'forfait' },
    ],
  },
  {
    id: 'p-plomberie-2', name: 'Thomas Petit', category: 'plomberie', tagline: 'Sanitaire & chauffage',
    rating: 4.8, reviews: 88, jobs: 340, city: 'Montreuil', verified: true,
    bio: '15 ans de métier. Travail propre et garanti, conseils pour réduire votre consommation.',
    services: [
      { label: 'Installation', price: 48, unit: '/ h' },
      { label: 'Entretien chaudière', price: 110, unit: 'forfait' },
    ],
  },
  // Électricité
  {
    id: 'p-electricite-1', name: 'Sofia Lopez', category: 'electricite', tagline: 'Électricienne certifiée',
    rating: 4.9, reviews: 143, jobs: 460, city: 'Paris 18e', verified: true,
    bio: 'Mise aux normes, tableaux électriques, dépannage. Certifiée Qualifelec, intervention soignée et sécurisée.',
    services: [
      { label: 'Dépannage', price: 55, unit: '/ h' },
      { label: 'Mise aux normes', price: 65, unit: '/ h' },
      { label: 'Tableau électrique', price: 120, unit: 'forfait' },
    ],
  },
  {
    id: 'p-electricite-2', name: 'Yanis Roux', category: 'electricite', tagline: 'Installation & domotique',
    rating: 4.7, reviews: 61, jobs: 190, city: 'Issy', verified: false,
    bio: 'Spécialiste domotique et éclairage. Je modernise votre installation pour plus de confort.',
    services: [
      { label: 'Installation', price: 52, unit: '/ h' },
      { label: 'Domotique', price: 70, unit: '/ h' },
    ],
  },
  // Coaching
  {
    id: 'p-coaching-1', name: 'Marc Lefevre', category: 'coaching', tagline: 'Coach sportif à domicile',
    rating: 5.0, reviews: 102, jobs: 420, city: 'Paris 8e', verified: true,
    bio: 'Coach diplômé. Programmes personnalisés perte de poids, renforcement, remise en forme. À domicile ou en extérieur.',
    services: [
      { label: 'Séance individuelle', price: 45, unit: '/ séance' },
      { label: 'Pack 10 séances', price: 400, unit: 'forfait' },
    ],
  },
  {
    id: 'p-coaching-2', name: 'Nadia Cohen', category: 'coaching', tagline: 'Yoga & bien-être',
    rating: 4.9, reviews: 67, jobs: 230, city: 'Neuilly', verified: true,
    bio: 'Professeure de yoga certifiée. Séances douces pour réduire le stress et gagner en souplesse.',
    services: [
      { label: 'Séance yoga', price: 40, unit: '/ séance' },
      { label: 'Méditation guidée', price: 35, unit: '/ séance' },
    ],
  },
  // Cours particuliers
  {
    id: 'p-cours-1', name: 'Julien Mercier', category: 'cours', tagline: 'Maths & physique — lycée/prépa',
    rating: 4.9, reviews: 154, jobs: 600, city: 'Paris 5e', verified: true,
    bio: 'Agrégé de mathématiques. Pédagogie patiente et méthodes efficaces. Préparation bac, prépa et concours.',
    services: [
      { label: 'Cours de maths', price: 30, unit: '/ h' },
      { label: 'Cours de physique', price: 30, unit: '/ h' },
      { label: 'Stage intensif', price: 120, unit: 'forfait' },
    ],
  },
  {
    id: 'p-cours-2', name: 'Emma Garcia', category: 'cours', tagline: 'Langues — anglais & espagnol',
    rating: 4.8, reviews: 83, jobs: 290, city: 'Paris 9e', verified: false,
    bio: 'Bilingue, je rends les langues vivantes et accessibles. Conversation, grammaire, préparation aux examens.',
    services: [
      { label: 'Cours anglais', price: 28, unit: '/ h' },
      { label: 'Cours espagnol', price: 28, unit: '/ h' },
    ],
  },
  // Beauté
  {
    id: 'p-beaute-1', name: 'Chloé Dubois', category: 'beaute', tagline: 'Coiffure à domicile',
    rating: 4.9, reviews: 176, jobs: 510, city: 'Paris 16e', verified: true,
    bio: 'Coiffeuse professionnelle. Coupe, couleur, coiffure événementielle — directement chez vous, sans déplacement.',
    services: [
      { label: 'Coupe femme', price: 40, unit: 'forfait' },
      { label: 'Couleur', price: 60, unit: 'forfait' },
      { label: 'Coiffure mariage', price: 90, unit: 'forfait' },
    ],
  },
  {
    id: 'p-beaute-2', name: 'Sarah Benali', category: 'beaute', tagline: 'Soins & manucure',
    rating: 4.8, reviews: 91, jobs: 320, city: 'Levallois', verified: true,
    bio: 'Esthéticienne diplômée. Soins du visage, manucure, beauté des pieds dans le confort de votre maison.',
    services: [
      { label: 'Manucure', price: 35, unit: 'forfait' },
      { label: 'Soin du visage', price: 50, unit: 'forfait' },
    ],
  },
  // Bricolage
  {
    id: 'p-bricolage-1', name: 'Paul Girard', category: 'bricolage', tagline: 'Homme toutes mains',
    rating: 4.8, reviews: 119, jobs: 480, city: 'Paris 20e', verified: true,
    bio: 'Montage de meubles, petites réparations, fixations, pose d’étagères. Outillage complet, travail rapide et soigné.',
    services: [
      { label: 'Montage de meubles', price: 38, unit: '/ h' },
      { label: 'Petites réparations', price: 40, unit: '/ h' },
      { label: 'Pose & fixation', price: 42, unit: '/ h' },
    ],
  },
  {
    id: 'p-bricolage-2', name: 'David Martin', category: 'bricolage', tagline: 'Réparations & peinture',
    rating: 4.7, reviews: 58, jobs: 200, city: 'Clichy', verified: false,
    bio: 'Bricoleur polyvalent. De la retouche peinture au petit dépannage, je vous simplifie la vie.',
    services: [
      { label: 'Peinture', price: 36, unit: '/ h' },
      { label: 'Dépannage', price: 38, unit: '/ h' },
    ],
  },
];

export type Review = { author: string; rating: number; date: string; text: string };

export const sampleReviews: Review[] = [
  { author: 'Camille R.', rating: 5, date: 'il y a 3 jours', text: 'Ponctuel, soigné et très professionnel. Je recommande à 100 %.' },
  { author: 'Mehdi B.', rating: 5, date: 'il y a 1 semaine', text: 'Travail impeccable et excellent contact. Je referai appel sans hésiter.' },
  { author: 'Sophie L.', rating: 4, date: 'il y a 2 semaines', text: 'Très satisfaite de la prestation, rien à redire.' },
];

// — Données côté prestataire —

export type BookingRequest = {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  city: string;
  price: number;
};

export const proRequests: BookingRequest[] = [
  { id: 'r1', client: 'Camille Renaud', service: 'Ménage régulier', date: "Aujourd'hui", time: '14:00', city: 'Paris 11e', price: 50 },
  { id: 'r2', client: 'Thomas Leroy', service: 'Grand nettoyage', date: 'Demain', time: '09:00', city: 'Paris 11e', price: 96 },
  { id: 'r3', client: 'Aïcha Benkacem', service: 'Repassage', date: 'Jeu. 26 juin', time: '10:30', city: 'Montreuil', price: 44 },
];

export type PlanningDay = {
  day: string;
  items: { time: string; client: string; service: string; city: string }[];
};

export const proPlanning: PlanningDay[] = [
  {
    day: "Aujourd'hui",
    items: [
      { time: '14:00', client: 'Camille Renaud', service: 'Ménage régulier', city: 'Paris 11e' },
      { time: '17:30', client: 'Léo Marchetti', service: 'Repassage', city: 'Paris 12e' },
    ],
  },
  {
    day: 'Demain',
    items: [{ time: '09:00', client: 'Thomas Leroy', service: 'Grand nettoyage', city: 'Paris 11e' }],
  },
  {
    day: 'Jeu. 26 juin',
    items: [{ time: '10:30', client: 'Aïcha Benkacem', service: 'Repassage', city: 'Montreuil' }],
  },
];

// Prestataire « connecté » (démo) — à remplacer par la session Supabase.
export const currentPro = providers[0];

// — Helpers —

export const getCategory = (slug?: string) => categories.find((c) => c.slug === slug);
export const getProvider = (id?: string) => providers.find((p) => p.id === id);
export const providersByCategory = (slug?: string) => providers.filter((p) => p.category === slug);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
