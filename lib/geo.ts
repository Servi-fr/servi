// Géocodage via l'API Base Adresse Nationale (gouv.fr) — gratuite, sans clé, idéale pour la France.
export type LatLng = { lat: number; lng: number };

export async function geocode(query: string): Promise<LatLng | null> {
  const q = (query || '').trim();
  if (q.length < 3) return null;
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`);
    const json = await res.json();
    const f = json?.features?.[0];
    if (!f?.geometry?.coordinates) return null;
    const [lng, lat] = f.geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
}

// Distance en km entre deux points (formule de haversine).
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type AddressSuggestion = { label: string; lat: number; lng: number; city: string; postcode: string };

// Autocomplétion d'adresses réelles via la BAN (jusqu'à 5 suggestions).
// Garantit que le client choisit une adresse existante (pas du texte libre).
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`,
    );
    const json = await res.json();
    return (json?.features ?? [])
      .filter((f: any) => f?.geometry?.coordinates && f?.properties?.label)
      .map((f: any) => {
        const [lng, lat] = f.geometry.coordinates;
        return {
          label: f.properties.label as string,
          lat,
          lng,
          city: (f.properties.city as string) || '',
          postcode: (f.properties.postcode as string) || '',
        };
      });
  } catch {
    return [];
  }
}

// Distance (km) entre un point déjà géocodé et la zone du prestataire.
// null si la zone est introuvable (on ne pénalise pas le client dans ce cas).
export async function distanceToZoneKm(point: LatLng, providerZone: string): Promise<number | null> {
  const z = await geocode(providerZone);
  if (!z) return null;
  return haversineKm(point, z);
}

// Vérifie si l'adresse est dans le rayon d'intervention (ville + radiusKm).
// En cas d'échec de géocodage, ne bloque pas (ok: true) — on ne pénalise pas le client.
export async function checkInPerimeter(
  address: string,
  providerZone: string,
  radiusKm: number,
): Promise<{ ok: boolean; distanceKm?: number }> {
  const [a, z] = await Promise.all([geocode(address), geocode(providerZone)]);
  if (!a || !z) return { ok: true };
  const d = haversineKm(a, z);
  return { ok: d <= radiusKm, distanceKm: Math.round(d) };
}
