import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarDays, ChevronRight } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusBadge } from '../components/StatusBadge';
import { colors, font } from '../theme/colors';
import { useBreakpoint, centeredContent } from '../lib/responsive';
import { getMyBookings, formatDate, type BookingRow } from '../lib/api';

export default function MyBookings() {
  const router = useRouter();
  const [list, setList] = useState<BookingRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { contentMaxWidth } = useBreakpoint();

  const load = async () => setList(await getMyBookings());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyBookings().then((r) => active && setList(r));
      return () => {
        active = false;
      };
    }, []),
  );
  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Mes réservations" />
      <ScrollView
        contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.link} />}
      >
        {list === null ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.link} />
          </View>
        ) : list.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <CalendarDays size={26} color={colors.link} />
            </View>
            <Text style={s.emptyTitle}>Aucune réservation</Text>
            <Text style={s.emptyText}>Trouvez un prestataire vérifié et réservez en quelques secondes.</Text>
            <Pressable style={s.cta} onPress={() => router.push('/services')}>
              <Text style={s.ctaText}>Explorer les services</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {list.map((b) => (
              <Pressable key={b.id} style={s.card} onPress={() => router.push(`/booking/${b.id}`)}>
                <View style={{ flex: 1 }}>
                  <View style={s.topRow}>
                    <Text style={s.service}>{b.service}</Text>
                    <StatusBadge status={b.status} />
                  </View>
                  <Text style={s.pro}>{b.prestataire?.name ?? 'Prestataire'}</Text>
                  <Text style={s.date}>{formatDate(b.date)}</Text>
                  <Text style={s.price}>{b.price + b.commission} €</Text>
                </View>
                <ChevronRight size={18} color={colors.faint} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 28, flexGrow: 1 },
  center: { paddingTop: 80, alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  service: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  pro: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, marginTop: 2 },
  date: { fontFamily: font.medium, fontSize: 13, color: colors.faint, marginTop: 6 },
  price: { fontFamily: font.display, fontSize: 17, color: colors.ink, marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingTop: 60 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 18, color: colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginBottom: 18 },
  cta: { backgroundColor: colors.blue, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 24 },
  ctaText: { color: '#fff', fontFamily: font.semi, fontSize: 15 },
});
