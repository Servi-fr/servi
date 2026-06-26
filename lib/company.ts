// Recherche d'entreprise via l'API publique gratuite recherche-entreprises.api.gouv.fr (sans clé).
// Permet d'auto-remplir le profil prestataire à partir du SIRET ou du nom.
export type CompanyResult = {
  siren: string;
  siret: string;
  name: string;
  address: string;
  city: string;
  ape: string;
  labels: string[]; // certifications officielles détectées (RGE, Qualiopi, Bio…)
};

// Labels officiels exposés par l'API (à jour) → libellés affichables.
function companyLabels(complements: any): string[] {
  const out: string[] = [];
  if (complements?.est_rge) out.push('Certifié RGE');
  if (complements?.est_qualiopi) out.push('Certifié Qualiopi');
  if (complements?.est_bio) out.push('Certifié Bio (Agriculture Biologique)');
  return out;
}

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
      labels: companyLabels(r.complements),
    }));
  } catch {
    return [];
  }
}
