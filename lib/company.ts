// Recherche d'entreprise via l'API publique gratuite recherche-entreprises.api.gouv.fr (sans clé).
// Permet d'auto-remplir le profil prestataire à partir du SIRET ou du nom.
export type CompanyResult = {
  siren: string;
  siret: string;
  name: string;
  address: string;
  city: string;
  ape: string;
};

export async function searchCompany(query: string): Promise<CompanyResult[]> {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&page=1&per_page=5`,
    );
    const json = await res.json();
    return (json?.results ?? []).map((r: any) => ({
      siren: r.siren ?? '',
      siret: r.siege?.siret ?? '',
      name: r.nom_complet ?? r.nom_raison_sociale ?? '',
      address: r.siege?.adresse ?? '',
      city: r.siege?.libelle_commune ?? '',
      ape: r.activite_principale ?? '',
    }));
  } catch {
    return [];
  }
}
