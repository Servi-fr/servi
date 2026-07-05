import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { createBillingDoc } from '../lib/api';
import { generateBillingPdf } from '../lib/invoice';

// Devis / facture LIBRE : pour n'importe quel client (mission perso, client
// historique…). Numérotation officielle (FACT-/DEV-) + PDF/A-3 + Factur-X serveur.

export default function FactureNew() {
  const router = useRouter();
  const p = useLocalSearchParams<{ docType?: string; clientName?: string; clientPhone?: string; service?: string; price?: string }>();

  const [type, setType] = useState<'facture' | 'devis'>(p.docType === 'devis' ? 'devis' : 'facture');
  const [clientName, setClientName] = useState(p.clientName ?? '');
  const [clientPhone, setClientPhone] = useState(p.clientPhone ?? '');
  const [service, setService] = useState(p.service ?? '');
  const [amount, setAmount] = useState(p.price ?? '');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  const total = parseFloat(amount.replace(',', '.'));
  const missing: string[] = [];
  if (!clientName.trim()) missing.push('le client');
  if (!service.trim()) missing.push('la prestation');
  if (!(total > 0)) missing.push('le montant');
  const ready = missing.length === 0;

  async function generate() {
    if (!ready || busy) return;
    setBusy(true);
    const rec = await createBillingDoc({ type, clientName: clientName.trim(), service: service.trim(), total });
    if (!rec.ok || !rec.number) {
      setBusy(false);
      Alert.alert('Document', `Création impossible.\n\n(${rec.error ?? 'erreur inconnue'})`);
      return;
    }
    const now = new Date();
    const r = await generateBillingPdf({
      type,
      number: rec.number,
      date: now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      issueDateISO: now.toISOString(),
      prestataireName: '', // rempli côté serveur (profil) ; utilisé seulement par le repli local
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || null,
      interventionAddress: address.trim() || null,
      service: service.trim(),
      total,
    });
    setBusy(false);
    if (!r.ok) {
      Alert.alert('Document', `La génération du PDF a échoué.\n\n(${r.error ?? 'erreur inconnue'})`);
      return;
    }
    Alert.alert(
      type === 'facture' ? 'Facture' : 'Devis',
      `${type === 'facture' ? 'Facture' : 'Devis'} ${rec.number} généré ✓${r.pdfa ? '\n\nPDF/A-3' + (r.facturx ? ' + Factur-X (EN 16931)' : '') + ' — généré par le serveur SERVI.' : '\n\nVersion provisoire générée sur l\'appareil.'}`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Nouveau document" dark />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.intro}>
            Pour n'importe quel client — y compris hors SERVI. Numérotation officielle et facture au format
            électronique (Factur-X).
          </Text>

          <View style={s.segment}>
            {(['facture', 'devis'] as const).map((t) => {
              const active = t === type;
              return (
                <Pressable key={t} style={[s.segBtn, active && s.segOn]} onPress={() => setType(t)}>
                  <Text style={[s.segText, active && s.segTextOn]}>{t === 'facture' ? 'Facture' : 'Devis'}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>Client <Text style={s.req}>*</Text></Text>
          <TextInput value={clientName} onChangeText={setClientName} placeholder="Nom du client" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Téléphone</Text>
          <TextInput value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" placeholder="06 12 34 56 78" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Prestation <Text style={s.req}>*</Text></Text>
          <TextInput value={service} onChangeText={setService} placeholder="Ex. remplacement chauffe-eau" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Montant TTC (€) <Text style={s.req}>*</Text></Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="120" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Lieu d'intervention</Text>
          <TextInput value={address} onChangeText={setAddress} placeholder="12 rue de la République, Lyon" placeholderTextColor={colors.faint} style={s.input} />

          <Pressable style={[s.btn, (!ready || busy) && s.btnOff]} disabled={!ready || busy} onPress={generate}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>
                {ready ? `Générer ${type === 'facture' ? 'la facture' : 'le devis'} (PDF)` : `Renseignez ${missing.join(', ')}`}
              </Text>
            )}
          </Pressable>
          <Text style={s.reqLegend}>* Champs obligatoires · TVA non applicable, art. 293 B du CGI</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  intro: { fontFamily: font.body, fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: 14 },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, padding: 4, gap: 4 },
  segBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  segOn: { backgroundColor: colors.proInk },
  segText: { fontFamily: font.semi, fontSize: 14, color: colors.muted },
  segTextOn: { color: '#fff' },
  label: { fontFamily: font.semi, fontSize: 14, color: colors.ink, marginTop: 18, marginBottom: 10 },
  req: { color: colors.blue, fontFamily: font.semi },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  btn: { backgroundColor: colors.proInk, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnOff: { backgroundColor: colors.faint },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 15.5 },
  reqLegend: { fontFamily: font.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 10 },
});
