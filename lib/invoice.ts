import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export type DocData = {
  type: 'devis' | 'facture';
  number: string;
  date: string;
  prestataireName: string;
  prestataireSiret?: string | null;
  clientName: string;
  service: string;
  total: number;
};

function buildHtml(d: DocData): string {
  const title = d.type === 'facture' ? 'FACTURE' : 'DEVIS';
  const tva = 'TVA non applicable, art. 293 B du CGI';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0f172a;padding:40px;font-size:14px}
    h1{font-size:26px;letter-spacing:-0.5px;margin:0;color:#2347d9}
    .muted{color:#64748b}
    .row{display:flex;justify-content:space-between;margin-top:28px}
    .box{font-size:13px;line-height:1.5}
    table{width:100%;border-collapse:collapse;margin-top:28px}
    th,td{text-align:left;padding:12px;border-bottom:1px solid #e2e8f0}
    th{color:#64748b;font-weight:600;font-size:12px}
    .total{text-align:right;font-size:18px;font-weight:700;margin-top:16px}
    .foot{margin-top:32px;font-size:11px;color:#94a3b8}
  </style></head><body>
    <div class="row">
      <div><h1>SERVI</h1><div class="muted">${title} ${d.number}</div></div>
      <div class="box" style="text-align:right">${d.date}</div>
    </div>
    <div class="row">
      <div class="box"><b>Prestataire</b><br>${d.prestataireName}${d.prestataireSiret ? `<br>SIRET ${d.prestataireSiret}` : ''}</div>
      <div class="box" style="text-align:right"><b>Client</b><br>${d.clientName}</div>
    </div>
    <table>
      <tr><th>Désignation</th><th style="text-align:right">Montant</th></tr>
      <tr><td>${d.service}</td><td style="text-align:right">${d.total.toFixed(2)} €</td></tr>
    </table>
    <div class="total">Total : ${d.total.toFixed(2)} €</div>
    <div class="foot">${tva}.<br>Document généré via SERVI.</div>
  </body></html>`;
}

export async function generateBillingPdf(d: DocData): Promise<{ ok: boolean; error?: string }> {
  try {
    const { uri } = await Print.printToFileAsync({ html: buildHtml(d) });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${d.type === 'facture' ? 'Facture' : 'Devis'} ${d.number}`,
      });
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}
