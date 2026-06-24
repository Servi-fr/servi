import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { type PlanningDay } from '../../lib/data';
import { getProBookings, seedProPlanning } from '../../lib/api';

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

export default function ProPlanning() {
  const [days, setDays] = useState<PlanningDay[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProBookings().then((bookings) => {
        if (!active) return;
        const confirmed = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
        if (confirmed.length === 0) {
          setDays(seedProPlanning);
          return;
        }
        const map = new Map<string, PlanningDay>();
        confirmed
          .slice()
          .sort((a, b) => +new Date(a.date) - +new Date(b.date))
          .forEach((b) => {
            const d = new Date(b.date);
            const label = dayLabel(d);
            if (!map.has(label)) map.set(label, { day: label, items: [] });
            map.get(label)!.items.push({ time: hhmm(d), client: b.client?.name ?? 'Client', service: b.service, city: '' });
          });
        setDays(Array.from(map.values()));
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.head}>
        <Text style={s.h1}>Planning</Text>
        <Text style={s.lead}>Vos missions confirmées à venir.</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {days === null ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.proInk} />
          </View>
        ) : (
          days.map((day) => (
            <View key={day.day} style={{ marginBottom: 22 }}>
              <Text style={s.dayLabel}>{day.day}</Text>
              <View>
                {day.items.map((m, i) => (
                  <View key={m.time + m.client + i} style={s.row}>
                    <View style={s.railCol}>
                      <View style={s.dot} />
                      {i < day.items.length - 1 && <View style={s.rail} />}
                    </View>
                    <View style={s.card}>
                      <View style={s.cardTop}>
                        <Text style={s.time}>{m.time}</Text>
                        <Text style={s.client}>{m.client}</Text>
                      </View>
                      <Text style={s.service}>{m.service}</Text>
                      {!!m.city && (
                        <View style={s.cityRow}>
                          <MapPin size={13} color={colors.faint} />
                          <Text style={s.city}>{m.city}</Text>
                        </View>
                      )}
                    </View>
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
  head: { paddingHorizontal: 20, paddingTop: 8 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.proInk, letterSpacing: -0.5 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 6 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  loading: { paddingTop: 60, alignItems: 'center' },
  dayLabel: { fontFamily: font.displaySemi, fontSize: 15, color: colors.proInk, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 14 },
  railCol: { width: 14, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.proInk, marginTop: 18 },
  rail: { flex: 1, width: 2, backgroundColor: colors.line3, marginTop: 2 },
  card: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { fontFamily: font.display, fontSize: 15, color: colors.proInk },
  client: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  service: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, marginTop: 4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  city: { fontFamily: font.medium, fontSize: 12.5, color: colors.faint },
});
