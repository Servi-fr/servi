import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { TrendingUp, Star, CheckCircle2, Clock, ChevronRight, ArrowUpRight, Megaphone, FileText } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { NotifBell } from '../../components/NotifBell';
import { initials } from '../../lib/data';
import { getProBookings, getMyProfile, boostMyListing, isMyListingSponsored, type BookingRow } from '../../lib/api';

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export default function ProDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [name, setName] = useState('Prestataire');
  const [isSpon, setIsSpon] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProBookings().then((b) => active && setBookings(b));
      getMyProfile().then((p) => active && p?.name && setName(p.name));
      isMyListingSponsored().then((v) => active && setIsSpon(v));
      return () => {
        active = false;
      };
    }, []),
  );

  const bk = bookings ?? [];
  const pendingCount = bk.filter((b) => b.status === 'PENDING').length;
  const missions = bk.length;
  const revenue = bk.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + b.price, 0);
  const today: { time: string; client: string; service: string }[] = bk
    .filter((b) => b.status !== 'CANCELLED' && isToday(b.date))
    .map((b) => ({ time: hhmm(b.date), client: b.client?.name ?? 'Client', service: b.service }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <View>
            <Text style={s.hello}>Bonjour,</Text>
            <Text style={s.name}>{name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <NotifBell />
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(name)}</Text>
            </View>
          </View>
        </View>

        <View style={s.hero}>
          <Text style={s.heroLabel}>Revenus (prestations terminées)</Text>
          <Text style={s.heroValue}>{revenue.toLocaleString('fr-FR')} €</Text>
          <View style={s.heroTrend}>
            <ArrowUpRight size={15} color="#7ee2a8" />
            <Text style={s.heroTrendText}>
              {missions} réservation{missions > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={s.kpiRow}>
          <Kpi Icon={TrendingUp} value={String(missions)} label="Missions" />
          <Kpi Icon={Star} value="—" label="Note" />
          <Kpi Icon={CheckCircle2} value={String(pendingCount)} label="En attente" />
        </View>

        <Pressable
          style={[s.boost, isSpon && s.boostOn]}
          onPress={async () => {
            if (isSpon) return;
            const r = await boostMyListing();
            if (r.ok) setIsSpon(true);
            else Alert.alert('Mise en avant', 'Action impossible. Réessayez.');
          }}
        >
          <Megaphone size={20} color={isSpon ? colors.okText : colors.proInk} />
          <View style={{ flex: 1 }}>
            <Text style={s.boostTitle}>{isSpon ? 'Fiche mise en avant ✓' : 'Mettre ma fiche en avant'}</Text>
            <Text style={s.boostSub}>
              {isSpon ? "Vous apparaissez « À la une » sur l'accueil." : "Apparaissez « À la une » sur l'accueil des clients."}
            </Text>
          </View>
        </Pressable>

        <Pressable style={s.boost} onPress={() => router.push('/facturation')}>
          <FileText size={20} color={colors.proInk} />
          <View style={{ flex: 1 }}>
            <Text style={s.boostTitle}>Facturation</Text>
            <Text style={s.boostSub}>Vos devis & factures, chiffre d'affaires</Text>
          </View>
          <ChevronRight size={20} color={colors.faint} />
        </Pressable>

        {pendingCount > 0 && (
          <Pressable style={s.alert} onPress={() => router.push('/(pro)/demandes')}>
            <View style={s.alertIcon}>
              <Clock size={18} color={colors.proInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>
                {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente
              </Text>
              <Text style={s.alertSub}>Répondez vite pour booster votre classement.</Text>
            </View>
            <ChevronRight size={20} color={colors.faint} />
          </Pressable>
        )}

        <View style={s.sectionRow}>
          <Text style={s.section}>Aujourd'hui</Text>
          <Pressable onPress={() => router.push('/(pro)/planning')}>
            <Text style={s.link}>Tout voir</Text>
          </Pressable>
        </View>

        {today.length > 0 ? (
          <View style={{ gap: 10 }}>
            {today.map((m, idx) => (
              <View key={m.time + m.client + idx} style={s.mission}>
                <View style={s.missionTime}>
                  <Text style={s.missionTimeText}>{m.time}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.missionClient}>{m.client}</Text>
                  <Text style={s.missionService}>{m.service}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.empty}>Aucune mission aujourd'hui.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Kpi({ Icon, value, label }: { Icon: any; value: string; label: string }) {
  return (
    <View style={s.kpi}>
      <Icon size={18} color={colors.proInk} />
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  hello: { fontFamily: font.body, fontSize: 14, color: colors.muted },
  name: { fontFamily: font.display, fontSize: 24, color: colors.proInk, letterSpacing: -0.5, marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.proInk, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.display, fontSize: 16, color: '#fff' },
  hero: { backgroundColor: colors.proInk, borderRadius: 22, padding: 22 },
  heroLabel: { fontFamily: font.medium, fontSize: 13, color: '#aeb6c6' },
  heroValue: { fontFamily: font.display, fontSize: 34, color: '#fff', letterSpacing: -1, marginTop: 6 },
  heroTrend: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  heroTrendText: { fontFamily: font.medium, fontSize: 13, color: '#7ee2a8' },
  kpiRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  kpi: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 5 },
  kpiValue: { fontFamily: font.displaySemi, fontSize: 19, color: colors.proInk },
  kpiLabel: { fontFamily: font.body, fontSize: 11.5, color: colors.faint },
  boost: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 16, padding: 14, marginTop: 14 },
  boostOn: { backgroundColor: colors.okBg, borderColor: colors.okBg },
  boostTitle: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  boostSub: { fontFamily: font.body, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 16, padding: 14, marginTop: 14 },
  alertIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  alertSub: { fontFamily: font.body, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  section: { fontFamily: font.display, fontSize: 19, color: colors.proInk, letterSpacing: -0.4 },
  link: { fontFamily: font.semi, fontSize: 13.5, color: colors.proInk },
  mission: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  missionTime: { backgroundColor: colors.proInk, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 11 },
  missionTimeText: { fontFamily: font.semi, fontSize: 13, color: '#fff' },
  missionClient: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  missionService: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 1 },
  empty: { fontFamily: font.body, fontSize: 14, color: colors.faint },
});
