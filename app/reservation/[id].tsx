import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, MapPin } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { getProvider, initials } from '../../lib/data';

const WD = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
const FEE_RATE = 0.1; // frais de service SERVI

export default function ReservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const p = getProvider(id);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return { key: i, label: i === 0 ? "Auj." : WD[d.getDay()], num: d.getDate() };
      }),
    [],
  );

  const [serviceIdx, setServiceIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  if (!p) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title="Réservation" />
        <View style={s.center}>
          <Text style={s.muted}>Prestataire introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const svc = p.services[serviceIdx];
  const fee = Math.round(svc.price * FEE_RATE);
  const total = svc.price + fee;
  const ready = slot !== null && address.trim().length > 3;
  const chosenDay = days[dayIdx];

  function confirm() {
    if (!ready || !p) return;
    router.replace({
      pathname: '/reservation/success',
      params: {
        provider: p.name,
        service: svc.label,
        date: `${chosenDay.label} ${chosenDay.num}`,
        time: slot as string,
        total: String(total),
      },
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Réservation" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={8}
      >
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Prestataire */}
          <View style={s.proCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(p.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.proName}>{p.name}</Text>
              <Text style={s.proTagline} numberOfLines={1}>{p.tagline}</Text>
            </View>
          </View>

          {/* Prestation */}
          <Text style={s.label}>Prestation</Text>
          <View style={s.box}>
            {p.services.map((service, i) => {
              const active = i === serviceIdx;
              return (
                <Pressable key={service.label} style={[s.optRow, i > 0 && s.optBorder]} onPress={() => setServiceIdx(i)}>
                  <View style={[s.radio, active && s.radioOn]}>{active && <Check size={13} color="#fff" />}</View>
                  <Text style={[s.optLabel, active && s.optLabelOn]}>{service.label}</Text>
                  <Text style={s.optPrice}>
                    {service.price} € <Text style={s.optUnit}>{service.unit}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Date */}
          <Text style={s.label}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {days.map((d) => {
              const active = d.key === dayIdx;
              return (
                <Pressable key={d.key} style={[s.dayChip, active && s.dayChipOn]} onPress={() => setDayIdx(d.key)}>
                  <Text style={[s.dayWd, active && s.dayTextOn]}>{d.label}</Text>
                  <Text style={[s.dayNum, active && s.dayTextOn]}>{d.num}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Créneau */}
          <Text style={s.label}>Créneau</Text>
          <View style={s.slotGrid}>
            {SLOTS.map((t) => {
              const active = t === slot;
              return (
                <Pressable key={t} style={[s.slot, active && s.slotOn]} onPress={() => setSlot(t)}>
                  <Text style={[s.slotText, active && s.slotTextOn]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Adresse */}
          <Text style={s.label}>Adresse d'intervention</Text>
          <View style={s.inputWrap}>
            <MapPin size={18} color={colors.faint} />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="12 rue de la République, Paris"
              placeholderTextColor={colors.faint}
              style={s.input}
            />
          </View>

          {/* Notes */}
          <Text style={s.label}>Précisions (optionnel)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Code d'entrée, étage, détails utiles…"
            placeholderTextColor={colors.faint}
            multiline
            style={s.textarea}
          />

          {/* Récap */}
          <View style={s.summary}>
            <Row label={svc.label} value={`${svc.price} €`} />
            <Row label="Frais de service SERVI" value={`${fee} €`} />
            <View style={s.summaryDivider} />
            <Row label="Total" value={`${total} €`} bold />
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={s.ctaBar}>
          <Pressable style={[s.ctaBtn, !ready && s.ctaBtnOff]} disabled={!ready} onPress={confirm}>
            <Text style={s.ctaBtnText}>
              {ready ? `Confirmer · ${total} €` : 'Choisissez un créneau et une adresse'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.sumRow}>
      <Text style={[s.sumLabel, bold && s.sumLabelBold]}>{label}</Text>
      <Text style={[s.sumValue, bold && s.sumValueBold]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: font.body, fontSize: 15, color: colors.muted },

  proCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, marginBottom: 4 },
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.display, fontSize: 15, color: colors.link },
  proName: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  proTagline: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 1 },

  label: { fontFamily: font.semi, fontSize: 14, color: colors.ink, marginTop: 22, marginBottom: 10 },

  box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 14 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  optBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.line3, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  optLabel: { flex: 1, fontFamily: font.medium, fontSize: 15, color: colors.muted },
  optLabelOn: { fontFamily: font.semi, color: colors.ink },
  optPrice: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  optUnit: { fontFamily: font.body, fontSize: 12, color: colors.faint },

  dayChip: { width: 60, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, alignItems: 'center' },
  dayChipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  dayWd: { fontFamily: font.medium, fontSize: 12, color: colors.faint },
  dayNum: { fontFamily: font.display, fontSize: 18, color: colors.ink, marginTop: 2 },
  dayTextOn: { color: '#fff' },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: '30.5%', paddingVertical: 13, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, alignItems: 'center' },
  slotOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  slotText: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  slotTextOn: { color: '#fff' },

  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  textarea: { minHeight: 80, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, padding: 14, fontFamily: font.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },

  summary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginTop: 22 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  sumLabel: { fontFamily: font.body, fontSize: 14, color: colors.muted },
  sumLabelBold: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  sumValue: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  sumValueBold: { fontFamily: font.display, fontSize: 18, color: colors.ink },
  summaryDivider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },

  ctaBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line3, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  ctaBtn: { backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaBtnOff: { backgroundColor: colors.faint },
  ctaBtnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
});
