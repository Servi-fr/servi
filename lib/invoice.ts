import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument, AFRelationship, PDFName } from 'pdf-lib';
import { buildFacturXXml, buildFacturXmp, utf8Bytes } from './facturx';
import { supabase } from './supabase';

export type DocData = {
  type: 'devis' | 'facture';
  number: string;
  bookingId?: string; // si fourni → génération SERVEUR (PDF/A-3, sans filigrane), repli local sinon
  date: string;
  issueDateISO?: string; // date ISO réelle → date d'émission Factur-X (format 102)
  prestataireName: string;
  prestataireSiret?: string | null;
  prestataireEmail?: string | null;
  prestatairePhone?: string | null;
  prestataireAddress?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  interventionAddress?: string | null;
  service: string;
  total: number;
};

// Embarque le XML Factur-X (EN 16931) dans le PDF de la facture → PDF hybride
// (visuel + données structurées). Renvoie l'URI du nouveau fichier. Peut throw
// (l'appelant retombe alors sur le PDF visuel seul).
async function embedFacturX(pdfUri: string, d: DocData): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(pdfUri, { encoding: FileSystem.EncodingType.Base64 });
  const pdfDoc = await PDFDocument.load(base64);

  // 1) XML CII attaché sous le nom normalisé « factur-x.xml », relation « Data ».
  await pdfDoc.attach(utf8Bytes(buildFacturXXml(d)), 'factur-x.xml', {
    mimeType: 'text/xml',
    description: 'Factur-X',
    afRelationship: AFRelationship.Data,
  });

  // 2) Métadonnées XMP Factur-X (reconnaissance par les lecteurs) — best-effort.
  try {
    const stream = pdfDoc.context.stream(buildFacturXmp(), { Type: 'Metadata', Subtype: 'XML' });
    pdfDoc.catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(stream));
  } catch {
    /* XMP best-effort : l'attachement XML reste valable sans lui */
  }

  const outB64 = await pdfDoc.saveAsBase64();
  const outUri = `${FileSystem.cacheDirectory}${d.number.replace(/[^\w-]/g, '')}-facturx.pdf`;
  await FileSystem.writeAsStringAsync(outUri, outB64, { encoding: FileSystem.EncodingType.Base64 });
  return outUri;
}

function buildHtml(d: DocData): string {
  const title = d.type === 'facture' ? 'FACTURE' : 'DEVIS';
  const tva = 'TVA non applicable, art. 293 B du CGI';
  const esc = (s?: string | null) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kv = (label: string, val?: string | null) => (val ? `<br><span class="k">${label} :</span> ${esc(val)}` : '');
  const amount = d.total.toFixed(2);
  const mentions =
    d.type === 'facture'
      ? "Paiement à réception. En cas de retard : pénalités au taux de 3× l'intérêt légal + indemnité forfaitaire de recouvrement de 40 € (art. L441-10 C. com.)."
      : 'Devis valable 30 jours. « Bon pour accord » : date et signature du client requises.';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0f172a;padding:40px;font-size:13px;position:relative}
    .wm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:56px;font-weight:800;color:rgba(220,38,38,0.11);letter-spacing:6px;white-space:nowrap;z-index:0}
    .content{position:relative;z-index:1}
    h1{font-size:26px;letter-spacing:-0.5px;margin:0;color:#2347d9}
    .muted{color:#64748b}
    .k{color:#94a3b8}
    .draft{margin-top:16px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:8px;padding:9px 12px;font-size:11.5px;line-height:1.5}
    .row{display:flex;justify-content:space-between;margin-top:24px;gap:24px}
    .box{font-size:12.5px;line-height:1.55;flex:1}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    th,td{text-align:left;padding:11px 12px;border-bottom:1px solid #e2e8f0}
    th{color:#64748b;font-weight:600;font-size:11.5px}
    .total{text-align:right;font-size:18px;font-weight:700;margin-top:16px}
    .foot{margin-top:26px;font-size:10.5px;color:#94a3b8;line-height:1.65}
  </style></head><body>
    <div class="wm">PROVISOIRE · NON DÉFINITIF</div>
    <div class="content">
      <div class="row" style="margin-top:0">
        <div><h1>SERVI</h1><div class="muted">${title} ${esc(d.number)}</div></div>
        <div class="box" style="text-align:right;flex:none"><span class="k">Date :</span> ${esc(d.date)}</div>
      </div>

      <div class="draft">⚠️ Version non définitive — document provisoire. Non conforme à la facturation électronique légale (à émettre via une plateforme de dématérialisation agréée).</div>

      <div class="row">
        <div class="box"><b>Prestataire</b><br>${esc(d.prestataireName)}${d.prestataireAddress ? `<br>${esc(d.prestataireAddress)}` : ''}${d.prestataireSiret ? `<br><span class="k">SIRET :</span> ${esc(d.prestataireSiret)}` : ''}${kv('Tél', d.prestatairePhone)}${kv('Email', d.prestataireEmail)}</div>
        <div class="box" style="text-align:right"><b>Client</b><br>${esc(d.clientName)}${d.clientAddress ? `<br>${esc(d.clientAddress)}` : ''}${kv('Tél', d.clientPhone)}${kv('Email', d.clientEmail)}</div>
      </div>

      ${d.interventionAddress ? `<div class="box" style="margin-top:16px"><span class="k">Lieu d'intervention :</span> ${esc(d.interventionAddress)}</div>` : ''}

      <table>
        <tr><th>Désignation</th><th style="text-align:right">Montant</th></tr>
        <tr><td>${esc(d.service)}</td><td style="text-align:right">${amount} €</td></tr>
      </table>
      <div class="total">Total ${d.type === 'facture' ? 'à payer' : 'estimé'} : ${amount} €</div>

      <div class="foot">${tva}.<br>${mentions}<br>Document généré via l'application SERVI — <b>version provisoire, non définitive</b>.</div>
    </div>
  </body></html>`;
}

// Génération SERVEUR : Edge Function generate-invoice → PDF/A-3 + Factur-X EN 16931,
// polices embarquées, sans filigrane (document définitif au sens actuel). Peut throw.
// Deux modes : lié à une réservation SERVI (bookingId), ou LIBRE (n'importe quel client).
async function generateOnServer(d: DocData): Promise<{ uri: string; facturx: boolean }> {
  const body = d.bookingId
    ? { bookingId: d.bookingId, type: d.type, number: d.number }
    : {
        type: d.type,
        number: d.number,
        standalone: {
          clientName: d.clientName,
          clientEmail: d.clientEmail ?? null,
          clientPhone: d.clientPhone ?? null,
          clientAddress: d.clientAddress ?? null,
          interventionAddress: d.interventionAddress ?? null,
          service: d.service,
          total: d.total,
          dateISO: d.issueDateISO ?? null,
        },
      };
  const { data, error } = await supabase.functions.invoke('generate-invoice', { body });
  if (error || !data?.ok || !data?.pdfBase64) throw new Error(error?.message ?? data?.error ?? 'server-generation-failed');
  const uri = `${FileSystem.cacheDirectory}${d.number.replace(/[^\w-]/g, '')}-pdfa3.pdf`;
  await FileSystem.writeAsStringAsync(uri, data.pdfBase64 as string, { encoding: FileSystem.EncodingType.Base64 });
  return { uri, facturx: !!data.facturx };
}

export async function generateBillingPdf(
  d: DocData,
): Promise<{ ok: boolean; error?: string; facturx?: boolean; pdfa?: boolean }> {
  // 1) Voie serveur (PDF/A-3 propre) — réservation SERVI ou document libre.
  {
    try {
      const r = await generateOnServer(d);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(r.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${d.type === 'facture' ? 'Facture' : 'Devis'} ${d.number}`,
        });
      }
      return { ok: true, facturx: r.facturx, pdfa: true };
    } catch {
      /* repli sur la génération locale (filigranée « provisoire ») */
    }
  }
  return generateLocally(d);
}

async function generateLocally(d: DocData): Promise<{ ok: boolean; error?: string; facturx?: boolean; pdfa?: boolean }> {
  try {
    const { uri } = await Print.printToFileAsync({ html: buildHtml(d) });
    let shareUri = uri;
    let facturx = false;
    // Factur-X : uniquement pour les FACTURES (les devis ne sont pas concernés).
    if (d.type === 'facture') {
      try {
        shareUri = await embedFacturX(uri, d);
        facturx = true;
      } catch {
        shareUri = uri; // repli : PDF visuel seul (jamais de crash)
      }
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/pdf',
        dialogTitle: `${d.type === 'facture' ? 'Facture' : 'Devis'} ${d.number}`,
      });
    }
    return { ok: true, facturx };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}
