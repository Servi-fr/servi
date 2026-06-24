// Couche d'accès aux données — Supabase d'abord, repli sur le catalogue local.
// Le backend est le même que le web (tables Prisma : User, PrestataireProfile, Booking).
// Rappel schéma : public."User".id == auth.users.id (trigger) → clientId = session.user.id.
import { supabase } from './supabase';
import { providers as seedProviders, categories, type Provider } from './data';

type ProfileRow = {
  id: string;
  userId: string;
  service: string;
  hourlyRate: number | null;
  description: string | null;
  skills: string[] | null;
  rating: number | null;
  zone: string | null;
  User: {
    name: string | null;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    address: string | null;
  } | null;
};

// Associe un service (texte libre en base) à un slug de catégorie de l'app.
function serviceToSlug(service: string): string {
  const s = (service || '').toLowerCase();
  for (const c of categories) {
    const key = c.name.toLowerCase().split(' ')[0]; // « Cours particuliers » → « cours »
    if (s.includes(key) || s.includes(c.slug)) return c.slug;
  }
  return categories[0].slug;
}

function fullName(u: ProfileRow['User']): string {
  if (!u) return 'Prestataire SERVI';
  return u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Prestataire SERVI';
}

function mapRow(r: ProfileRow): Provider {
  return {
    id: r.userId, // == prestataireId pour la réservation
    name: fullName(r.User),
    category: serviceToSlug(r.service),
    tagline: r.service || 'Prestataire vérifié',
    rating: r.rating ?? 4.8,
    reviews: 0,
    jobs: 0,
    city: r.zone || r.User?.address || '',
    verified: true,
    bio: r.description || '',
    services: [{ label: r.service || 'Prestation', price: Math.round(r.hourlyRate ?? 0), unit: '/ h' }],
  };
}

// Prestataires réellement en base (vide si rien / erreur / RLS).
async function fetchLive(): Promise<Provider[]> {
  try {
    const { data, error } = await supabase
      .from('PrestataireProfile')
      .select(
        'id,userId,service,hourlyRate,description,skills,rating,zone,User(name,image,firstName,lastName,address)',
      );
    if (error || !data || data.length === 0) return [];
    return (data as unknown as ProfileRow[]).map(mapRow);
  } catch {
    return [];
  }
}

// Catalogue : prestataires en base, complétés par le catalogue local
// pour les catégories qui n'ont pas encore de pro réel.
export async function getProviders(): Promise<Provider[]> {
  const live = await fetchLive();
  if (live.length === 0) return seedProviders;
  const liveCats = new Set(live.map((p) => p.category));
  const fill = seedProviders.filter((p) => !liveCats.has(p.category));
  return [...live, ...fill];
}

export async function getProvidersByCategory(slug: string): Promise<Provider[]> {
  const all = await getProviders();
  const list = all.filter((p) => p.category === slug);
  return list.length ? list : seedProviders.filter((p) => p.category === slug);
}

export async function getProviderById(id: string): Promise<Provider | undefined> {
  const all = await getProviders();
  return all.find((p) => p.id === id) ?? seedProviders.find((p) => p.id === id);
}

// — Réservation —
export type NewBooking = {
  prestataireId: string;
  service: string;
  dateISO: string;
  durationMin: number;
  price: number;
  commission: number;
};

// Crée la réservation en base. Best-effort : ne bloque jamais le parcours.
export async function createBooking(b: NewBooking): Promise<{ ok: boolean; error?: string }> {
  // Prestataire du catalogue local (pas encore en base) → pas d'insert FK.
  if (b.prestataireId.startsWith('p-')) return { ok: false, error: 'demo-local' };
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return { ok: false, error: 'not-authenticated' };
    const id = 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    const { error } = await supabase.from('Booking').insert({
      id,
      clientId: uid,
      prestataireId: b.prestataireId,
      service: b.service,
      date: b.dateISO,
      duration: b.durationMin,
      price: b.price,
      commission: b.commission,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      updatedAt: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}
