import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { proPlanning } from '../../lib/data';

export default function ProPlanning() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.head}>
        <Text style={s.h1}>Planning</Text>
        <Text style={s.lead}>Vos missions confirmées à venir.</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {proPlanning.map((day) => (
          <View key={day.day} style={{ marginBottom: 22 }}>
            <Text style={s.dayLabel}>{day.day}</Text>
            <View style={s.timeline}>
              {day.items.map((m, i) => (
                <View key={m.time + m.client} style={s.row}>
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
                    <View style={s.cityRow}>
                      <MapPin size={13} color={colors.faint} />
                      <Text style={s.city}>{m.city}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
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
  dayLabel: { fontFamily: font.displaySemi, fontSize: 15, color: colors.proInk, marginBottom: 12 },
  timeline: { gap: 0 },
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
