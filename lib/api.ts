// Couche d'accès aux données — Supabase d'abord, repli sur le catalogue local.
// Backend = celui du web (Prisma : User, PrestataireProfile, Booking, Review, ChatRoom, Message).
// Clé : public."User".id == auth.users.id (trigger) → clientId = session.user.id.
import { supabase } from './supabase';
import {
  providers as seedProviders,
  categories,
  proRequests as seedRequests,
  proPlanning as seedPlanning,
  type Provider,
} from './data';
import { config } from './config';

const nowISO = () => new Date().toISOString();
const genId = (p: string) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export async function getUid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ============================================================
//  Catalogue prestataires
// ============================================================
type ProfileRow = {
  id: string;
  userId: string;
  service: string;
  hourlyRate: number | null;
  description: string | null;
  skills: string[] | null;
  rating: number | null;
  zone: string | null;
  radiusKm: number | null;
  certifications: string | null;
  User: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    address: string | null;
  } | null;
};

function serviceToSlug(service: string): string {
  const s = (service || '').toLowerCase();
  for (const c of categories) {
    const key = c.name.toLowerCase().split(' ')[0];
    if (s.includes(key) || s.includes(c.slug)) return c.slug;
  }
  return categories[0].slug;
}

function fullName(u: ProfileRow['User']): string {
  if (!u) return 'Prestataire SERVI';
  return u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Prestataire SERVI';
}

// Découpe le texte des certifications (une par ligne ou séparées par ;) en liste.
export function parseCertifications(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[\n;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function mapRow(r: ProfileRow): Provider {
  return {
    id: r.userId,
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
    radiusKm: r.radiusKm ?? undefined,
    certifications: parseCertifications(r.certifications),
  };
}

const SELECT_FULL =
  'id,userId,service,hourlyRate,description,skills,rating,zone,radiusKm,certifications,User(name,firstName,lastName,address)';
const SELECT_BASE =
  'id,userId,service,hourlyRate,description,skills,rating,zone,User(name,firstName,lastName,address)';

async function fetchLive(): Promise<Provider[]> {
  try {
    let res = await supabase.from('PrestataireProfile').select(SELECT_FULL);
    // Repli si les colonnes radiusKm/certifications ne sont pas encore en base.
    if (res.error) res = await supabase.from('PrestataireProfile').select(SELECT_BASE);
    const { data, error } = res;
    if (error || !data || data.length === 0) return [];
    return (data as unknown as ProfileRow[])
      .filter((r) => r.User && r.service && r.service !== 'À définir' && (r.hourlyRate ?? 0) > 0)
      .map(mapRow);
  } catch {
    return [];
  }
}

export async function getProviders(): Promise<Provider[]> {
  const live = await fetchLive();
  if (live.length === 0) return config.useSeedFallback ? seedProviders : [];
  if (!config.useSeedFallback) return live;
  const liveCats = new Set(live.map((p) => p.category));
  const fill = seedProviders.filter((p) => !liveCats.has(p.category));
  return [...live, ...fill];
}

export async function getProvidersByCategory(slug: string): Promise<Provider[]> {
  const all = await getProviders();
  const list = all.filter((p) => p.category === slug);
  if (list.length) return list;
  return config.useSeedFallback ? seedProviders.filter((p) => p.category === slug) : [];
}

export async function getProviderById(id: string): Promise<Provider | undefined> {
  const all = await getProviders();
  return all.find((p) => p.id === id) ?? seedProviders.find((p) => p.id === id);
}

// ============================================================
//  Profil utilisateur
// ============================================================
export type Role = 'CLIENT' | 'PRESTATAIRE' | 'ADMIN';
export type MyProfile = {
  id: string;
  name: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  phone: string | null;
  image: string | null;
  role: Role;
  plan: string; // FREE | PREMIUM | PRO
};

export async function getMyProfile(): Promise<MyProfile | null> {
  const uid = await getUid();
  if (!uid) return null;
  try {
    const { data } = await supabase
      .from('User')
      .select('id,name,email,firstName,lastName,address,phone,image,role,plan')
      .eq('id', uid)
      .maybeSingle();
    return (data as MyProfile) ?? null;
  } catch {
    return null;
  }
}

export async function updateMyProfile(
  p: Partial<Pick<MyProfile, 'firstName' | 'lastName' | 'address' | 'phone' | 'name' | 'image'>>,
): Promise<{ ok: boolean; error?: string }> {
  const uid = await getUid();
  if (!uid) return { ok: false, error: 'not-auth' };
  const { error } = await supabase
    .from('User')
    .update({ ...p, updatedAt: nowISO() })
    .eq('id', uid);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ============================================================
//  Être / devenir prestataire
// ============================================================
export type ProviderProfile = {
  id: string;
  service: string;
  hourlyRate: number;
  description: string | null;
  zone: string | null;
  radiusKm: number | null;
  certifications: string | null;
  skills: string[] | null;
  rating: number | null;
  siret?: string | null;
  logo?: string | null;
};

export async function getMyProviderProfile(): Promise<ProviderProfile | null> {
  const uid = await getUid();
  if (!uid) return null;
  try {
    // Résilient : tente avec siret, repli sans la colonne si la migration n'est pas encore passée.
    let res = await supabase
      .from('PrestataireProfile')
      .select('id,service,hourlyRate,description,zone,radiusKm,certifications,skills,rating,siret,logo')
      .eq('userId', uid)
      .maybeSingle();
    if (res.error) {
      res = await supabase
        .from('PrestataireProfile')
        .select('id,service,hourlyRate,description,zone,radiusKm,certifications,skills,rating')
        .eq('userId', uid)
        .maybeSingle();
    }
    return (res.data as ProviderProfile) ?? null;
  } catch {
    return null;
  }
}

export async function upsertMyProviderProfile(p: {
  service: string;
  hourlyRate: number;
  description?: string;
  zone?: string;
  radiusKm?: number;
  certifications?: string;
  siret?: string;
  logo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const uid = await getUid();
  if (!uid) return { ok: false, error: 'not-auth' };
  const existing = await getMyProviderProfile();
  const base = {
    service: p.service,
    hourlyRate: p.hourlyRate,
    description: p.description ?? null,
    zone: p.zone ?? null,
    radiusKm: p.radiusKm ?? null,
    certifications: p.certifications ?? null,
  };
  const withExtra = { ...base, siret: p.siret ?? null, logo: p.logo ?? null };
  if (existing) {
    // Résilient : tente avec siret/logo, repli sans ces colonnes si la migration n'est pas passée.
    let { error } = await supabase.from('PrestataireProfile').update(withExtra).eq('userId', uid);
    if (error) ({ error } = await supabase.from('PrestataireProfile').update(base).eq('userId', uid));
    if (error) return { ok: false, error: error.message };
  } else {
    const insBase = { id: genId('pp'), userId: uid, ...base, skills: [], totalEarned: 0, rating: 0 };
    let { error } = await supabase.from('PrestataireProfile').insert({ ...insBase, siret: p.siret ?? null, logo: p.logo ?? null });
    if (error) ({ error } = await supabase.from('PrestataireProfile').insert(insBase));
    if (error) return { ok: false, error: error.message };
  }
  await supabase.from('User').update({ role: 'PRESTATAIRE', updatedAt: nowISO() }).eq('id', uid);
  return { ok: true };
}

// ============================================================
//  Réservations
// ============================================================
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type BookingRow = {
  id: string;
  service: string;
  date: string;
  duration: number;
  price: number;
  commission: number;
  status: BookingStatus;
  address?: string | null;
  notes?: string | null;
  clientId: string;
  prestataireId: string;
  client?: { name: string | null } | null;
  prestataire?: { name: string | null } | null;
};

export type NewBooking = {
  prestataireId: string;
  service: string;
  dateISO: string;
  durationMin: number;
  price: number;
  commission: number;
  address?: string;
  notes?: string;
};

export async function createBooking(b: NewBooking): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (b.prestataireId.startsWith('p-')) return { ok: false, error: 'demo-local' };
  try {
    const uid = await getUid();
    if (!uid) return { ok: false, error: 'not-authenticated' };
    const id = genId('bk');
    const { error } = await supabase.from('Booking').insert({
      id,
      clientId: uid,
      prestataireId: b.prestataireId,
      service: b.service,
      date: b.dateISO,
      duration: b.durationMin,
      price: b.price,
      commission: b.commission,
      address: b.address ?? null,
      notes: b.notes ?? null,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      updatedAt: nowISO(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}

export async function getMyBookings(): Promise<BookingRow[]> {
  const uid = await getUid();
  if (!uid) return [];
  try {
    const { data, error } = await supabase
      .from('Booking')
      .select(
        'id,service,date,duration,price,commission,status,address,notes,clientId,prestataireId,prestataire:User!Booking_prestataireId_fkey(name)',
      )
      .eq('clientId', uid)
      .order('date', { ascending: false });
    if (error || !data) return [];
    return data as unknown as BookingRow[];
  } catch {
    return [];
  }
}

export async function getProBookings(): Promise<BookingRow[]> {
  const uid = await getUid();
  if (!uid) return [];
  try {
    const { data, error } = await supabase
      .from('Booking')
      .select(
        'id,service,date,duration,price,commission,status,address,notes,clientId,prestataireId,client:User!Booking_clientId_fkey(name)',
      )
      .eq('prestataireId', uid)
      .order('date', { ascending: true });
    if (error || !data) return [];
    return data as unknown as BookingRow[];
  } catch {
    return [];
  }
}

export async function getBookingById(id: string): Promise<BookingRow | null> {
  try {
    const { data } = await supabase
      .from('Booking')
      .select(
        'id,service,date,duration,price,commission,status,address,notes,clientId,prestataireId,prestataire:User!Booking_prestataireId_fkey(name),client:User!Booking_clientId_fkey(name)',
      )
      .eq('id', id)
      .maybeSingle();
    return (data as unknown as BookingRow) ?? null;
  } catch {
    return null;
  }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('Booking')
    .update({ status, updatedAt: nowISO() })
    .eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// Le créneau est-il déjà réservé chez ce prestataire ? (fonction SQL SECURITY DEFINER
// → ne fuite pas les réservations d'autrui, renvoie juste un booléen.)
export async function isSlotTaken(prestataireId: string, dateISO: string): Promise<boolean> {
  if (prestataireId.startsWith('p-')) return false; // catalogue local de démo
  try {
    const { data } = await supabase.rpc('servi_slot_taken', {
      p_prestataire: prestataireId,
      p_date: dateISO,
    });
    return data === true;
  } catch {
    return false;
  }
}

// Repli démo pour l'espace prestataire quand l'utilisateur n'a pas (encore) de vraies demandes.
export const seedProRequests = seedRequests;
export const seedProPlanning = seedPlanning;

// ============================================================
//  Avis
// ============================================================
export type Review = { author: string; rating: number; date: string; text: string };

export async function getReviewsForProvider(userId: string): Promise<Review[]> {
  if (!userId || userId.startsWith('p-')) return [];
  try {
    const { data } = await supabase
      .from('Review')
      .select('rating,comment,createdAt,fromUser:User!Review_fromUserId_fkey(name)')
      .eq('toUserId', userId)
      .order('createdAt', { ascending: false })
      .limit(10);
    if (!data) return [];
    return (data as any[]).map((r) => ({
      author: r.fromUser?.name ?? 'Client',
      rating: r.rating,
      date: formatShortDate(r.createdAt),
      text: r.comment ?? '',
    }));
  } catch {
    return [];
  }
}

export async function createReview(input: {
  bookingId: string;
  toUserId: string;
  rating: number;
  comment: string;
}): Promise<{ ok: boolean; error?: string }> {
  const uid = await getUid();
  if (!uid) return { ok: false, error: 'not-auth' };
  const { error } = await supabase.from('Review').insert({
    id: genId('rv'),
    bookingId: input.bookingId,
    rating: input.rating,
    comment: input.comment,
    fromUserId: uid,
    toUserId: input.toUserId,
    updatedAt: nowISO(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ============================================================
//  Messagerie (par réservation)
// ============================================================
export type ChatMessage = { id: string; content: string; senderId: string; createdAt: string };

async function ensureRoom(bookingId: string): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from('ChatRoom')
      .select('id')
      .eq('bookingId', bookingId)
      .maybeSingle();
    if (existing?.id) return existing.id as string;
    const id = genId('cr');
    const { error } = await supabase
      .from('ChatRoom')
      .insert({ id, type: 'BOOKING', bookingId, updatedAt: nowISO() });
    if (error) return null;
    return id;
  } catch {
    return null;
  }
}

export async function getMessages(bookingId: string): Promise<ChatMessage[]> {
  const roomId = await ensureRoom(bookingId);
  if (!roomId) return [];
  try {
    const { data } = await supabase
      .from('Message')
      .select('id,content,senderId,createdAt')
      .eq('chatRoomId', roomId)
      .order('createdAt', { ascending: true });
    return (data as ChatMessage[]) ?? [];
  } catch {
    return [];
  }
}

export async function sendMessage(bookingId: string, content: string): Promise<{ ok: boolean; error?: string }> {
  const uid = await getUid();
  if (!uid) return { ok: false, error: 'not-auth' };
  const roomId = await ensureRoom(bookingId);
  if (!roomId) return { ok: false, error: 'no-room' };
  const { error } = await supabase.from('Message').insert({
    id: genId('msg'),
    content,
    senderId: uid,
    chatRoomId: roomId,
    updatedAt: nowISO(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ============================================================
//  Notifications & push
// ============================================================
export type Notif = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  link: string | null;
  createdAt: string;
};

export async function getNotifications(): Promise<Notif[]> {
  const uid = await getUid();
  if (!uid) return [];
  try {
    const { data } = await supabase
      .from('Notification')
      .select('id,type,title,message,read,link,createdAt')
      .eq('userId', uid)
      .order('createdAt', { ascending: false })
      .limit(50);
    return (data as Notif[]) ?? [];
  } catch {
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  const uid = await getUid();
  if (!uid) return 0;
  try {
    const { count } = await supabase
      .from('Notification')
      .select('id', { count: 'exact', head: true })
      .eq('userId', uid)
      .eq('read', false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const uid = await getUid();
  if (!uid) return;
  try {
    await supabase.from('Notification').update({ read: true, updatedAt: nowISO() }).eq('userId', uid).eq('read', false);
  } catch {
    /* ignore */
  }
}

export async function savePushToken(token: string): Promise<void> {
  const uid = await getUid();
  if (!uid) return;
  try {
    await supabase.from('User').update({ pushToken: token, updatedAt: nowISO() }).eq('id', uid);
  } catch {
    /* ignore */
  }
}

// Upload d'une photo de profil → bucket « avatars » → URL publique.
export async function uploadAvatar(uri: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const uid = await getUid();
  if (!uid) return { ok: false, error: 'not-auth' };
  try {
    const arraybuffer = await fetch(uri).then((r) => r.arrayBuffer());
    const path = `${uid}/avatar_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, arraybuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) return { ok: false, error: error.message };
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'upload-failed' };
  }
}

// Logo d'entreprise du prestataire (réutilise le bucket public 'avatars').
export async function uploadProviderLogo(uri: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const uid = await getUid();
  if (!uid) return { ok: false, error: 'not-auth' };
  try {
    const arraybuffer = await fetch(uri).then((r) => r.arrayBuffer());
    const path = `${uid}/logo_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, arraybuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) return { ok: false, error: error.message };
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'upload-failed' };
  }
}

// ============================================================
//  Helpers d'affichage
// ============================================================
export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

// Formate une date ISO en « Mer. 24 juin · 14:00 » sans dépendre d'Intl (Hermes).
const WD = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]} · ${hh}:${mm}`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MO[d.getMonth()]}`;
}

// ============================================================
//  Carnet d'adresses client (adresses d'intervention enregistrées)
// ============================================================
export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

export async function getMyAddresses(): Promise<SavedAddress[]> {
  const uid = await getUid();
  if (!uid) return [];
  try {
    const { data } = await supabase
      .from('SavedAddress')
      .select('id,label,address,lat,lng,isDefault')
      .eq('userId', uid)
      .order('isDefault', { ascending: false });
    return (data as SavedAddress[]) ?? [];
  } catch {
    return [];
  }
}

export async function addMyAddress(a: {
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const uid = await getUid();
  if (!uid) return { ok: false, error: 'not-auth' };
  const { error } = await supabase.from('SavedAddress').insert({
    id: genId('addr'),
    userId: uid,
    label: a.label,
    address: a.address,
    lat: a.lat ?? null,
    lng: a.lng ?? null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteMyAddress(id: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.from('SavedAddress').delete().eq('id', id);
  return { ok: !error };
}
