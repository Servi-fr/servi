import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, MapPin } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { getProvider as seedProvider, initials, type Provider } from '../../lib/data';
import { createBooking, getProviderById, getUid, isSlotTaken, sendMessage } from '../../lib/api';
import { config } from '../../lib/config';
import { payForBooking } from '../../lib/payments';
import { searchAddresses, distanceToZoneKm, type AddressSuggestion } from '../../lib/geo';

const WD = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
const FEE_RATE = 0.1; // frais de service SERVI

export default function ReservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<Provider | undefined>(() => seedProvider(id));
  const [loadingP, setLoadingP] = useState(!p);
  const [myUid, setMyUid] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getProviderById(id).then((r) => {
      if (!active) return;
      if (r) setP(r);
      setLoadingP(false);
    });
    getUid().then((u) => active && setMyUid(u));
    return () => {
      active = false;
    };
  }, [id]);

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
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Autocomplétion d'adresse (BAN), déclenchée à la frappe tant qu'aucune n'est validée.
  useEffect(() => {
    if (selected) return;
    const q = address.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await searchAddresses(q);
      setSuggestions(res);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [address, selected]);

  function pickAddress(a: AddressSuggestion) {
    setSelected(a);
    setAddress(a.label);
    setSuggestions([]);
  }

  if (loadingP && !p) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title="Réservation" />
        <View style={s.center}>
          <ActivityIndicator color={colors.link} />
        </View>
      </SafeAreaView>
    );
  }

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
  const ready = slot !== null && selected !== null;
  const chosenDay = days[dayIdx];
  const isSelf = !!myUid && p.id === myUid;

  // Un créneau d'aujourd'hui déjà passé n'est pas réservable.
  function slotIsPast(time: string): boolean {
    if (dayIdx !== 0) return false;
    const [h, m] = time.split(':').map(Number);
    const sd = new Date();
    sd.setHours(h, m, 0, 0);
    return sd.getTime() <= Date.now();
  }

  function buildDate() {
    const d = new Date();
    d.setDate(d.getDate() + dayIdx);
    const [h, m] = (slot as string).split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }

  // Crée la réservation ; si askMessage est fourni, l'envoie au prestataire et ouvre le chat.
  async function finalize(d: Date, askMessage?: string) {
    if (!p) return;
    const result = await createBooking({
      prestataireId: p.id,
      service: svc.label,
      dateISO: d.toISOString(),
      durationMin: 60,
      price: svc.price,
      commission: fee,
      address: selected?.label ?? address.trim(),
      notes: notes.trim() || undefined,
    });
    // Échec → on le DIT (plus de faux « succès »).
    if (!result.ok) {
      setSubmitting(false);
      const msg =
        result.error === 'not-authenticated'
          ? 'Vous devez être connecté pour réserver.'
          : result.error === 'demo-local'
            ? "Ce prestataire de démonstration n'est pas réservable."
            : `La réservation n'a pas pu être créée. Réessayez.${result.error ? `\n\n(${result.error})` : ''}`;
      Alert.alert('Réservation impossible', msg);
      return;
    }
    if (result.id && askMessage) {
      await sendMessage(result.id, askMessage);
      setSubmitting(false);
      router.replace(`/chat/${result.id}`);
      return;
    }
    if (config.paymentsEnabled && result.id) {
      await payForBooking(result.id);
    }
    setSubmitting(false);
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

  async function confirm() {
    if (!ready || !p || submitting || !selected) return;
    setSubmitting(true);
    const d = buildDate();

    // 1) Créneau dans le passé → impossible.
    if (d.getTime() <= Date.now()) {
      setSubmitting(false);
      Alert.alert('Créneau passé', 'Ce créneau est déjà passé. Choisissez un horaire à venir.');
      return;
    }

    // Vérifs en parallèle : zone (adresse déjà validée) + créneau déjà pris.
    const [dist, taken] = await Promise.all([
      p.city ? distanceToZoneKm({ lat: selected.lat, lng: selected.lng }, p.city) : Promise.resolve(null),
      isSlotTaken(p.id, d.toISOString()),
    ]);

    // 2) Créneau déjà réservé chez ce prestataire → BLOCAGE STRICT (pas de double-booking).
    if (taken) {
      setSubmitting(false);
      Alert.alert(
        'Créneau indisponible',
        "Ce prestataire a déjà une réservation sur ce créneau. Merci d'en choisir un autre.",
      );
      return;
    }

    // 3) Hors zone → on propose une demande par message (non bloquant).
    if (dist !== null && dist > (p.radiusKm ?? 15)) {
      setSubmitting(false);
      const askMessage =
        `Bonjour, je souhaiterais réserver « ${svc.label} » le ${chosenDay.label} ${chosenDay.num} à ${slot}, ` +
        `à l'adresse : ${address.trim()}. C'est à ~${Math.round(dist)} km (hors de votre zone de ${p.radiusKm ?? 15} km). Est-ce envisageable ?`;
      Alert.alert(
        'Hors de la zone du prestataire',
        `L'adresse est à ~${Math.round(dist)} km (zone d'intervention : ${p.radiusKm ?? 15} km). Envoyer une demande par message pour savoir si ça lui convient ?`,
        [
          { text: 'Modifier', style: 'cancel' },
          {
            text: 'Envoyer la demande',
            onPress: () => {
              setSubmitting(true);
              finalize(d, askMessage);
            },
          },
        ],
      );
      return;
    }

    await finalize(d);
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

          {isSelf && (
            <View style={s.selfBanner}>
              <Text style={s.selfBannerText}>
                ℹ️ C'est votre propre profil prestataire : la demande vous sera envoyée à vous-même (pratique pour
                tester l'espace prestataire).
              </Text>
            </View>
          )}

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
                <Pressable
                  key={d.key}
                  style={[s.dayChip, active && s.dayChipOn]}
                  onPress={() => {
                    setDayIdx(d.key);
                    setSlot(null);
                  }}
                >
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
              const past = slotIsPast(t);
              const active = t === slot;
              return (
                <Pressable
                  key={t}
                  style={[s.slot, active && s.slotOn, past && s.slotPast]}
                  disabled={past}
                  onPress={() => setSlot(t)}
                >
                  <Text style={[s.slotText, active && s.slotTextOn, past && s.slotTextPast]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
          {dayIdx === 0 && SLOTS.every((t) => slotIsPast(t)) && (
            <Text style={s.addrHint}>Plus de créneau disponible aujourd'hui — choisissez un autre jour.</Text>
          )}

          {/* Adresse — autocomplétion BAN, sélection obligatoire */}
          <Text style={s.label}>Adresse d'intervention</Text>
          <View style={[s.inputWrap, selected && s.inputWrapOk]}>
            <MapPin size={18} color={selected ? colors.okText : colors.faint} />
            <TextInput
              value={address}
              onChangeText={(t) => {
                setAddress(t);
                setSelected(null);
              }}
              placeholder="Commencez à taper votre adresse…"
              placeholderTextColor={colors.faint}
              style={s.input}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searching ? (
              <ActivityIndicator size="small" color={colors.faint} />
            ) : selected ? (
              <Check size={18} color={colors.okText} />
            ) : null}
          </View>

          {!selected && suggestions.length > 0 && (
            <View style={s.suggestBox}>
              {suggestions.map((a, i) => (
                <Pressable
                  key={a.label + i}
                  style={[s.suggestRow, i > 0 && s.suggestBorder]}
                  onPress={() => pickAddress(a)}
                >
                  <MapPin size={15} color={colors.faint} />
                  <Text style={s.suggestText} numberOfLines={1}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {!selected && !searching && suggestions.length === 0 && address.trim().length >= 3 && (
            <Text style={s.addrHint}>Aucune adresse trouvée — vérifiez l'orthographe.</Text>
          )}
          {!selected && address.trim().length < 3 && (
            <Text style={s.addrHint}>Choisissez une adresse dans la liste pour la valider.</Text>
          )}

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
          <Pressable
            style={[s.ctaBtn, (!ready || submitting) && s.ctaBtnOff]}
            disabled={!ready || submitting}
            onPress={confirm}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.ctaBtnText}>
                {ready ? `Confirmer · ${total} €` : 'Choisissez un créneau et une adresse'}
              </Text>
            )}
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
  slotPast: { opacity: 0.4 },
  slotText: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  slotTextOn: { color: '#fff' },
  slotTextPast: { color: colors.faint, textDecorationLine: 'line-through' },

  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, paddingHorizontal: 14 },
  inputWrapOk: { borderColor: colors.okText, backgroundColor: colors.okBg },
  input: { flex: 1, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  suggestBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, marginTop: 8, overflow: 'hidden' },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14 },
  suggestBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  suggestText: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.ink },
  addrHint: { fontFamily: font.body, fontSize: 12.5, color: colors.faint, marginTop: 8 },
  selfBanner: { backgroundColor: colors.okBg, borderRadius: 12, padding: 12, marginTop: 10 },
  selfBannerText: { fontFamily: font.body, fontSize: 12.5, color: colors.okText, lineHeight: 18 },
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
