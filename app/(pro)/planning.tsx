import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Pressable } from '../../components/motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MapPin, Plus, Check } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { getProBookings, getMyManualJobs, setManualJobStatus } from '../../lib/api';

const WD = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function dayLabel(d: Date): string {
  const n = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const tomorrow = new Date(n);
  tomorrow.setDate(n.getDate() + 1);
  if (same(d, n)) return "Aujourd'hui";
  if (same(d, tomorrow)) return 'Demain';
  return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`;
}
const hhmm = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

// Item unifié : réservation SERVI ou mission perso (hors plateforme).
type Item = {
  id: string;
  kind: 'servi' | 'perso';
  when: Date;
  time: string;
  client: string;
  service: string;
  address: string;
  done: boolean;
  price: number;
  phone?: string | null;
};
type Day = { day: string; items: Item[] };

export default function ProPlanning() {
  const router = useRouter();
  const [days, setDays] = useState<Day[] | null>(null);

  async function load() {
    const [bookings, jobs] = await Promise.all([getProBookings(), getMyManualJobs()]);
    const items: Item[] = [
      ...bookings
        .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .map((b) => ({
          id: b.id,
          kind: 'servi' as const,
          when: new Date(b.date),
          time: hhmm(new Date(b.date)),
          client: b.client?.name ?? 'Client',
          service: b.service,
          address: b.address ?? '',
          done: b.status === 'COMPLETED',
          price: b.price,
        })),
      ...jobs
        .filter((j) => j.status !== 'CANCELLED')
        .map((j) => ({
          id: j.id,
          kind: 'perso' as const,
          when: new Date(j.date),
          time: hhmm(new Date(j.date)),
          client: j.clientName,
          service: j.service,
          address: j.address ?? '',
          done: j.status === 'DONE',
          price: j.price,
          phone: j.clientPhone,
        })),
    ].sort((a, b) => +a.when - +b.when);

    const map = new Map<string, Day>();
    items.forEach((it) => {
      const label = dayLabel(it.when);
      if (!map.has(label)) map.set(label, { day: label, items: [] });
      map.get(label)!.items.push(it);
    });
    setDays(Array.from(map.values()));
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load().then(() => {
        if (!active) return;
      });
      return () => {
        active = false;
      };
    }, []),
  );

  function billingParams(it: Item, docType: 'facture' | 'devis') {
    return {
      pathname: '/facture-new' as const,
      params: {
        docType,
        clientName: it.client,
        clientPhone: it.phone ?? '',
        service: it.service,
        price: it.price ? String(it.price) : '',
      },
    };
  }

  function onPressItem(it: Item) {
    if (it.kind === 'servi') {
      router.push(`/booking/${it.id}`);
      return;
    }
    if (it.done) {
      // Mission perso terminée → facturer en 1 tap (préremplie).
      Alert.alert(it.service, `${it.client} · terminée`, [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Générer la facture', onPress: () => router.push(billingParams(it, 'facture')) },
      ]);
      return;
    }
    // Mission perso planifiée : actions rapides.
    Alert.alert(it.service, `${it.client} · ${it.time}`, [
      { text: 'Fermer', style: 'cancel' },
      {
        text: 'Marquer terminée',
        onPress: async () => {
          const r = await setManualJobStatus(it.id, 'DONE');
          if (!r.ok) Alert.alert('Mission', `Impossible de mettre à jour.\n\n(${r.error ?? ''})`);
          await load();
        },
      },
      { text: 'Créer un devis', onPress: () => router.push(billingParams(it, 'devis')) },
      {
        text: 'Annuler la mission',
        style: 'destructive',
        onPress: async () => {
          const r = await setManualJobStatus(it.id, 'CANCELLED');
          if (!r.ok) Alert.alert('Mission', `Impossible de mettre à jour.\n\n(${r.error ?? ''})`);
          await load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.h1}>Planning</Text>
          <Text style={s.lead}>Toutes vos missions — SERVI et hors plateforme.</Text>
        </View>
        <Pressable
          style={s.addBtn}
          onPress={() => router.push('/mission-new')}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une mission perso"
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {days === null ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.proInk} />
          </View>
        ) : days.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTitle}>Aucune mission planifiée</Text>
            <Text style={s.emptyText}>
              Vos réservations SERVI apparaîtront ici automatiquement. Ajoutez aussi vos missions hors
              plateforme avec le bouton +.
            </Text>
            <Pressable style={s.emptyCta} onPress={() => router.push('/mission-new')}>
              <Plus size={16} color="#fff" />
              <Text style={s.emptyCtaText}>Ajouter une mission</Text>
            </Pressable>
          </View>
        ) : (
          days.map((day) => (
            <View key={day.day} style={{ marginBottom: 22 }}>
              <Text style={s.dayLabel}>{day.day}</Text>
              <View>
                {day.items.map((m, i) => (
                  <View key={m.kind + m.id} style={s.row}>
                    <View style={s.railCol}>
                      <View style={[s.dot, m.done && s.dotDone]} />
                      {i < day.items.length - 1 && <View style={s.rail} />}
                    </View>
                    <Pressable style={[s.card, m.done && s.cardDone]} onPress={() => onPressItem(m)}>
                      <View style={s.cardTop}>
                        <Text style={s.time}>{m.time}</Text>
                        <Text style={s.client} numberOfLines={1}>{m.client}</Text>
                        <View style={[s.badge, m.kind === 'perso' && s.badgePerso]}>
                          <Text style={[s.badgeText, m.kind === 'perso' && s.badgeTextPerso]}>
                            {m.kind === 'servi' ? 'SERVI' : 'Perso'}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.service}>{m.service}</Text>
                      {!!m.address && (
                        <View style={s.cityRow}>
                          <MapPin size={13} color={colors.muted} />
                          <Text style={s.city} numberOfLines={1}>{m.address}</Text>
                        </View>
                      )}
                      {m.done && (
                        <View style={s.doneRow}>
                          <Check size={13} color={colors.okText} />
                          <Text style={s.doneText}>Terminée</Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.proInk, letterSpacing: -0.5 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 6 },
  addBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.proInk, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  loading: { paddingTop: 60, alignItems: 'center' },
  emptyBox: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 30 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 18, color: colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.proInk, borderRadius: 13, paddingHorizontal: 18, paddingVertical: 13, marginTop: 16 },
  emptyCtaText: { fontFamily: font.semi, fontSize: 14.5, color: '#fff' },
  dayLabel: { fontFamily: font.displaySemi, fontSize: 15, color: colors.proInk, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 14 },
  railCol: { width: 14, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.proInk, marginTop: 18 },
  dotDone: { backgroundColor: colors.ok },
  rail: { flex: 1, width: 2, backgroundColor: colors.line3, marginTop: 2 },
  card: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, marginBottom: 10 },
  cardDone: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { fontFamily: font.display, fontSize: 15, color: colors.proInk },
  client: { flex: 1, fontFamily: font.semi, fontSize: 15, color: colors.ink },
  badge: { backgroundColor: colors.chip, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: font.semi, fontSize: 10.5, color: colors.link },
  badgePerso: { backgroundColor: '#e9ebf0' },
  badgeTextPerso: { color: colors.muted },
  service: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, marginTop: 4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  city: { flex: 1, fontFamily: font.medium, fontSize: 12.5, color: colors.muted },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  doneText: { fontFamily: font.semi, fontSize: 12.5, color: colors.okText },
});
