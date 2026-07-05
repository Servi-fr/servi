// SERVI — Génération SERVEUR de facture/devis : PDF/A-3 + Factur-X (EN 16931).
// Contrairement à la génération mobile (expo-print), ce PDF est construit de zéro :
// polices EMBARQUÉES (Liberation Sans, subset), OutputIntent ICC sRGB, XMP PDF/A-3B
// avec extension schema Factur-X, XML CII profil EN 16931 attaché (factur-x.xml).
// Server-authoritative : les données viennent de la base (jamais du client).
// Déployer : supabase functions deploy generate-invoice   (verify JWT ON)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  PDFDocument,
  PDFName,
  PDFString,
  AFRelationship,
  rgb,
} from 'https://esm.sh/pdf-lib@1.17.1';
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';
import { FONT_REGULAR_B64 } from './font-regular.ts';
import { FONT_BOLD_B64 } from './font-bold.ts';
import { ICC_SRGB_B64 } from './icc-srgb.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Doc = {
  type: 'devis' | 'facture';
  number: string;
  issueDate: Date;
  sellerName: string;
  sellerSiret?: string | null;
  sellerAddress?: string | null;
  sellerEmail?: string | null;
  sellerPhone?: string | null;
  buyerName: string;
  buyerAddress?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  interventionAddress?: string | null;
  service: string;
  total: number;
};

const d102 = (dt: Date) =>
  `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;

// ---------- XML CII — profil EN 16931 (TVA franchise : catégorie E, art. 293 B) ----------
function buildXml(d: Doc): string {
  const amount = d.total.toFixed(2);
  const siret = (d.sellerSiret ?? '').replace(/\s/g, '');
  const legalOrg = siret
    ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0009">${esc(siret)}</ram:ID></ram:SpecifiedLegalOrganization>`
    : '';
  const sellerLine = d.sellerAddress ? `<ram:LineOne>${esc(d.sellerAddress)}</ram:LineOne>` : '';
  const buyerLine = d.buyerAddress ? `<ram:LineOne>${esc(d.buyerAddress)}</ram:LineOne>` : '';
  const exemption = 'TVA non applicable, art. 293 B du CGI';
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(d.number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${d102(d.issueDate)}</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>${esc(d.service)}</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>${amount}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>E</ram:CategoryCode><ram:RateApplicablePercent>0</ram:RateApplicablePercent></ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${amount}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(d.sellerName)}</ram:Name>${legalOrg}
        <ram:PostalTradeAddress>${sellerLine}<ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>
        ${d.sellerEmail ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${esc(d.sellerEmail)}</ram:URIID></ram:URIUniversalCommunication>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(d.buyerName)}</ram:Name>
        <ram:PostalTradeAddress>${buyerLine}<ram:CountryID>FR</ram:CountryID></ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime><udt:DateTimeString format="102">${d102(d.issueDate)}</udt:DateTimeString></ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>${exemption}</ram:ExemptionReason>
        <ram:BasisAmount>${amount}</ram:BasisAmount>
        <ram:CategoryCode>E</ram:CategoryCode>
        <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms><ram:Description>Paiement à réception</ram:Description></ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amount}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${amount}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">0.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amount}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amount}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ---------- XMP PDF/A-3B + extension schema Factur-X ----------
function buildXmp(d: Doc, isoDate: string): string {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
   <pdfaid:part>3</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(d.type === 'facture' ? 'Facture' : 'Devis')} ${esc(d.number)}</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>${esc(d.sellerName)}</rdf:li></rdf:Seq></dc:creator>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
   <xmp:CreateDate>${isoDate}</xmp:CreateDate><xmp:ModifyDate>${isoDate}</xmp:ModifyDate>
   <pdf:Producer>SERVI invoice service</pdf:Producer>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
   <pdfaExtension:schemas><rdf:Bag><rdf:li rdf:parseType="Resource">
    <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
    <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
    <pdfaSchema:prefix>fx</pdfaSchema:prefix>
    <pdfaSchema:property><rdf:Seq>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentFileName</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description></rdf:li>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentType</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>INVOICE</pdfaProperty:description></rdf:li>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>Version</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The actual version of the standard applying to the embedded XML document</pdfaProperty:description></rdf:li>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>ConformanceLevel</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The conformance level of the embedded XML document</pdfaProperty:description></rdf:li>
    </rdf:Seq></pdfaSchema:property>
   </rdf:li></rdf:Bag></pdfaExtension:schemas>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
   <fx:DocumentType>INVOICE</fx:DocumentType>
   <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
   <fx:Version>1.0</fx:Version>
   <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// ---------- PDF/A-3 construit de zéro ----------
async function buildPdf(d: Doc): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const regular = await pdfDoc.embedFont(b64ToBytes(FONT_REGULAR_B64), { subset: true });
  const bold = await pdfDoc.embedFont(b64ToBytes(FONT_BOLD_B64), { subset: true });

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const ink = rgb(0.06, 0.09, 0.16);
  const mut = rgb(0.39, 0.45, 0.55);
  const blue = rgb(0.14, 0.28, 0.85);
  const line = rgb(0.89, 0.91, 0.94);
  const M = 48; // marge
  const W = 595.28 - M * 2;
  let y = 841.89 - 64;

  const wrap = (text: string, font: typeof regular, size: number, maxW: number): string[] => {
    const words = String(text ?? '').split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) <= maxW) cur = t;
      else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  };
  const draw = (text: string, x: number, size: number, opts?: { font?: typeof regular; color?: ReturnType<typeof rgb>; maxW?: number; lh?: number; right?: boolean }) => {
    const font = opts?.font ?? regular;
    const color = opts?.color ?? ink;
    const lh = opts?.lh ?? size * 1.45;
    for (const l of wrap(text, font, size, opts?.maxW ?? W)) {
      const tx = opts?.right ? x - font.widthOfTextAtSize(l, size) : x;
      page.drawText(l, { x: tx, y, size, font, color });
      y -= lh;
    }
  };

  const title = d.type === 'facture' ? 'FACTURE' : 'DEVIS';
  const dateFr = d.issueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // En-tête
  page.drawText('SERVI', { x: M, y, size: 26, font: bold, color: blue });
  page.drawText(dateFr, { x: 595.28 - M - regular.widthOfTextAtSize(dateFr, 11), y: y + 4, size: 11, font: regular, color: mut });
  y -= 22;
  draw(`${title} ${d.number}`, M, 12, { color: mut });
  y -= 16;

  // Parties
  const colW = W / 2 - 12;
  const topY = y;
  draw('PRESTATAIRE', M, 9.5, { font: bold, color: mut });
  draw(d.sellerName, M, 12, { font: bold, maxW: colW });
  if (d.sellerAddress) draw(d.sellerAddress, M, 10.5, { maxW: colW });
  if (d.sellerSiret) draw(`SIRET : ${d.sellerSiret}`, M, 10.5, { color: mut, maxW: colW });
  if (d.sellerPhone) draw(`Tél : ${d.sellerPhone}`, M, 10.5, { color: mut, maxW: colW });
  if (d.sellerEmail) draw(`Email : ${d.sellerEmail}`, M, 10.5, { color: mut, maxW: colW });
  const leftEnd = y;

  y = topY;
  const x2 = M + W / 2 + 12;
  draw('CLIENT', x2, 9.5, { font: bold, color: mut });
  draw(d.buyerName, x2, 12, { font: bold, maxW: colW });
  if (d.buyerAddress) draw(d.buyerAddress, x2, 10.5, { maxW: colW });
  if (d.buyerPhone) draw(`Tél : ${d.buyerPhone}`, x2, 10.5, { color: mut, maxW: colW });
  if (d.buyerEmail) draw(`Email : ${d.buyerEmail}`, x2, 10.5, { color: mut, maxW: colW });
  y = Math.min(leftEnd, y) - 8;

  if (d.interventionAddress) draw(`Lieu d'intervention : ${d.interventionAddress}`, M, 10.5, { color: mut });
  y -= 14;

  // Tableau
  page.drawLine({ start: { x: M, y: y + 6 }, end: { x: M + W, y: y + 6 }, thickness: 0.8, color: line });
  y -= 8;
  page.drawText('Désignation', { x: M, y, size: 10, font: bold, color: mut });
  page.drawText('Montant', { x: M + W - bold.widthOfTextAtSize('Montant', 10), y, size: 10, font: bold, color: mut });
  y -= 20;
  const amountStr = `${d.total.toFixed(2)} €`;
  const svcLines = wrap(d.service, regular, 11.5, W - 110);
  page.drawText(amountStr, { x: M + W - regular.widthOfTextAtSize(amountStr, 11.5), y, size: 11.5, font: regular, color: ink });
  for (const l of svcLines) {
    page.drawText(l, { x: M, y, size: 11.5, font: regular, color: ink });
    y -= 17;
  }
  y -= 2;
  page.drawLine({ start: { x: M, y: y + 8 }, end: { x: M + W, y: y + 8 }, thickness: 0.8, color: line });
  y -= 14;
  const totalLabel = `Total ${d.type === 'facture' ? 'à payer' : 'estimé'} : ${amountStr}`;
  page.drawText(totalLabel, { x: M + W - bold.widthOfTextAtSize(totalLabel, 14), y, size: 14, font: bold, color: ink });
  y -= 40;

  // Mentions légales
  const mentions =
    d.type === 'facture'
      ? [
          'TVA non applicable, art. 293 B du CGI.',
          "Paiement à réception. En cas de retard : pénalités au taux de 3× l'intérêt légal et indemnité forfaitaire de recouvrement de 40 € (art. L441-10 C. com.). Pas d'escompte pour paiement anticipé.",
          'Facture générée via l\'application SERVI — format Factur-X (EN 16931), PDF/A-3.',
        ]
      : ['TVA non applicable, art. 293 B du CGI.', 'Devis valable 30 jours. « Bon pour accord » : date et signature du client requises.', 'Devis généré via l\'application SERVI.'];
  for (const m of mentions) draw(m, M, 9, { color: mut, lh: 12.5 });

  // --- Conformité PDF/A-3 : OutputIntent ICC sRGB ---
  const iccBytes = b64ToBytes(ICC_SRGB_B64);
  const iccStream = pdfDoc.context.stream(iccBytes, { N: 3 });
  const iccRef = pdfDoc.context.register(iccStream);
  const intent = pdfDoc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    OutputConditionIdentifier: PDFString.of('sRGB'),
    Info: PDFString.of('sRGB v2 (CC0)'),
    DestOutputProfile: iccRef,
  });
  pdfDoc.catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([pdfDoc.context.register(intent)]));

  // --- XML Factur-X attaché (factures uniquement) ---
  const now = new Date();
  if (d.type === 'facture') {
    const xmlBytes = new TextEncoder().encode(buildXml(d));
    await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
      mimeType: 'text/xml',
      description: 'Factur-X invoice (EN 16931)',
      creationDate: now,
      modificationDate: now,
      afRelationship: AFRelationship.Data,
    });
  }

  // --- XMP (non compressé, exigence PDF/A) ---
  const xmp = buildXmp(d, now.toISOString().replace(/\.\d{3}Z$/, 'Z'));
  const meta = pdfDoc.context.stream(xmp, { Type: 'Metadata', Subtype: 'XML' });
  pdfDoc.catalog.set(PDFName.of('Metadata'), pdfDoc.context.register(meta));

  pdfDoc.setTitle(`${title} ${d.number}`);
  pdfDoc.setProducer('SERVI invoice service');
  pdfDoc.setCreator('SERVI');
  pdfDoc.setCreationDate(now);
  pdfDoc.setModificationDate(now);

  return await pdfDoc.save({ useObjectStreams: false });
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { bookingId, type, number, standalone } = body;
    if (!number || (type !== 'facture' && type !== 'devis')) {
      return json({ error: 'type (facture|devis) et number requis' }, 400);
    }
    if (!bookingId && !standalone) return json({ error: 'bookingId ou standalone requis' }, 400);

    // Authentification.
    const authHeader = req.headers.get('Authorization') ?? '';
    const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: 'not-authenticated' }, 401);

    // Émetteur : toujours server-authoritative (profil du user connecté).
    const [{ data: seller }, { data: prov }] = await Promise.all([
      admin.from('User').select('name,email,phone,address').eq('id', user.id).maybeSingle(),
      admin.from('PrestataireProfile').select('siret').eq('userId', user.id).maybeSingle(),
    ]);
    const sellerPart = {
      sellerName: seller?.name ?? 'Prestataire',
      sellerSiret: prov?.siret ?? null,
      sellerAddress: seller?.address ?? null,
      sellerEmail: seller?.email ?? null,
      sellerPhone: seller?.phone ?? null,
    };

    let doc: Doc;
    if (standalone) {
      // Document LIBRE (client hors SERVI / mission perso) : le contenu vient du
      // prestataire lui-même (c'est SA facture), bornes de sûreté côté serveur.
      const total = Number(standalone.total);
      if (!standalone.clientName || !standalone.service || !Number.isFinite(total) || total <= 0 || total > 100000) {
        return json({ error: 'standalone invalide (clientName, service, total 0–100000 requis)' }, 400);
      }
      const issue = standalone.dateISO ? new Date(standalone.dateISO) : new Date();
      doc = {
        type,
        number,
        issueDate: isNaN(issue.getTime()) ? new Date() : issue,
        ...sellerPart,
        buyerName: String(standalone.clientName),
        buyerAddress: standalone.clientAddress ?? null,
        buyerEmail: standalone.clientEmail ?? null,
        buyerPhone: standalone.clientPhone ?? null,
        interventionAddress: standalone.interventionAddress ?? null,
        service: String(standalone.service),
        total,
      };
    } else {
      // Document lié à une réservation SERVI : données server-authoritative.
      const { data: booking } = await admin
        .from('Booking')
        .select('id,service,date,price,prestataireId,address,client:User!Booking_clientId_fkey(name,email,phone,address)')
        .eq('id', bookingId)
        .maybeSingle();
      if (!booking) return json({ error: 'booking-not-found' }, 404);
      if (booking.prestataireId !== user.id) return json({ error: 'forbidden' }, 403);

      const client = (booking as any).client ?? {};
      const issue = new Date(booking.date);
      doc = {
        type,
        number,
        issueDate: isNaN(issue.getTime()) ? new Date() : issue,
        ...sellerPart,
        buyerName: client?.name ?? 'Client',
        buyerAddress: client?.address ?? null,
        buyerEmail: client?.email ?? null,
        buyerPhone: client?.phone ?? null,
        interventionAddress: booking.address ?? null,
        service: booking.service,
        total: Number(booking.price),
      };
    }

    const pdfBytes = await buildPdf(doc);
    // base64 par blocs (évite un dépassement de pile sur les gros tableaux)
    let bin = '';
    const CHUNK = 8192;
    for (let i = 0; i < pdfBytes.length; i += CHUNK) bin += String.fromCharCode(...pdfBytes.subarray(i, i + CHUNK));
    return json({ ok: true, number, pdfBase64: btoa(bin), facturx: type === 'facture', pdfa: true });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
