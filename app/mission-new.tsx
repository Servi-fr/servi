import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Pressable } from '../components/motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { createManualJob } from '../lib/api';

// Mission PERSO : un travail pour un client HORS SERVI (aucune commission).
// C'est ce qui fait de SERVI Pro l'agenda de TOUTE l'activité du prestataire.

const WD = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const DURATIONS = [30, 60, 90, 120, 180, 240];

export default function MissionNew() {
  const router = useRouter();
  const pre = useLocalSearchParams<{ clientName?: string; clientPhone?: string }>();
  const [clientName, setClientName] = useState(pre.clientName ?? '');
  const [clientPhone, setClientPhone] = useState(pre.clientPhone ?? '');
  const [service, setService] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return { key: i, label: i === 0 ? "Auj." : i === 1 ? 'Dem.' : WD[d.getDay()], num: d.getDate() };
      }),
    [],
  );

  // Guidage : le bouton dit ce qui manque (règle 8).
  const missing: string[] = [];
  if (!clientName.trim()) missing.push('le nom du client');
  if (!service.trim()) missing.push('la prestation');
  if (!slot) missing.push("l'horaire");
  const ready = missing.length === 0;

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    const d = new Date();
    d.setDate(d.getDate() + dayIdx);
    const [h, m] = (slot as string).split(':').map(Number);
    d.setHours(h, m, 0, 0);
    const r = await createManualJob({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      service: service.trim(),
      dateISO: d.toISOString(),
      durationMin: duration,
      price: parseFloat(price.replace(',', '.')) || 0,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (!r.ok) {
      Alert.alert('Mission', `L'enregistrement a échoué.\n\n(${r.error ?? 'erreur inconnue'})`);
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Nouvelle mission perso" dark />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.intro}>
            Un travail pour un client hors SERVI : il rejoint votre planning et vos revenus, sans aucune commission.
          </Text>

          <Text style={s.label}>Client <Text style={s.req}>*</Text></Text>
          <TextInput value={clientName} onChangeText={setClientName} placeholder="Nom du client" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Téléphone</Text>
          <TextInput value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" placeholder="06 12 34 56 78" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Prestation <Text style={s.req}>*</Text></Text>
          <TextInput value={service} onChangeText={setService} placeholder="Ex. remplacement chauffe-eau" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Date <Text style={s.req}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {days.map((d) => {
              const active = d.key === dayIdx;
              return (
                <Pressable key={d.key} style={[s.dayChip, active && s.chipOn]} onPress={() => setDayIdx(d.key)}>
                  <Text style={[s.dayWd, active && s.chipTextOn]}>{d.label}</Text>
                  <Text style={[s.dayNum, active && s.chipTextOn]}>{d.num}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={s.label}>Horaire <Text style={s.req}>*</Text></Text>
          <View style={s.wrapRow}>
            {SLOTS.map((t) => {
              const active = t === slot;
              return (
                <Pressable key={t} style={[s.slot, active && s.chipOn]} onPress={() => setSlot(t)}>
                  <Text style={[s.slotText, active && s.chipTextOn]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>Durée</Text>
          <View style={s.wrapRow}>
            {DURATIONS.map((min) => {
              const active = min === duration;
              return (
                <Pressable key={min} style={[s.slot, active && s.chipOn]} onPress={() => setDuration(min)}>
                  <Text style={[s.slotText, active && s.chipTextOn]}>{min < 60 ? `${min} min` : `${min / 60} h`}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>Prix (€)</Text>
          <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="120" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Adresse</Text>
          <TextInput value={address} onChangeText={setAddress} placeholder="12 rue de la République, Lyon" placeholderTextColor={colors.faint} style={s.input} />

          <Text style={s.label}>Notes</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Matériel à prévoir, code d'entrée…" placeholderTextColor={colors.faint} multiline style={s.textarea} />

          <Pressable style={[s.btn, (!ready || saving) && s.btnOff]} disabled={!ready || saving} onPress={save}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>{ready ? 'Ajouter à mon planning' : `Renseignez ${missing.join(', ')}`}</Text>
            )}
          </Pressable>
          <Text style={s.reqLegend}>* Champs obligatoires</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  intro: { fontFamily: font.body, fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: 6 },
  label: { fontFamily: font.semi, fontSize: 14, color: colors.ink, marginTop: 18, marginBottom: 10 },
  req: { color: colors.blue, fontFamily: font.semi },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  textarea: { minHeight: 80, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, padding: 14, fontFamily: font.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { width: 58, paddingVertical: 11, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, alignItems: 'center' },
  dayWd: { fontFamily: font.medium, fontSize: 12, color: colors.faint },
  dayNum: { fontFamily: font.display, fontSize: 17, color: colors.ink, marginTop: 2 },
  slot: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3 },
  slotText: { fontFamily: font.semi, fontSize: 13.5, color: colors.ink },
  chipOn: { backgroundColor: colors.proInk, borderColor: colors.proInk },
  chipTextOn: { color: '#fff' },
  btn: { backgroundColor: colors.proInk, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnOff: { backgroundColor: colors.faint },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 15.5 },
  reqLegend: { fontFamily: font.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 10 },
});
