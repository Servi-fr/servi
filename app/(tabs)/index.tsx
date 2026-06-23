import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Sparkles,
  Sprout,
  Wrench,
  Zap,
  Dumbbell,
  GraduationCap,
  Scissors,
  Hammer,
  type LucideIcon,
} from 'lucide-react-native';
import { Logo } from '../../components/Logo';
import { colors, font } from '../../theme/colors';

const services: { name: string; Icon: LucideIcon; count: string }[] = [
  { name: 'Ménage', Icon: Sparkles, count: '480' },
  { name: 'Jardinage', Icon: Sprout, count: '320' },
  { name: 'Plomberie', Icon: Wrench, count: '210' },
  { name: 'Électricité', Icon: Zap, count: '185' },
  { name: 'Coaching', Icon: Dumbbell, count: '140' },
  { name: 'Cours', Icon: GraduationCap, count: '390' },
  { name: 'Beauté', Icon: Scissors, count: '260' },
  { name: 'Bricolage', Icon: Hammer, count: '300' },
];

export default function Home() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topbar}>
          <Logo size={21} />
        </View>

        <Text style={s.h1}>Le bon prestataire,{'\n'}près de chez vous.</Text>
        <Text style={s.lead}>
          Réservation, paiement et suivi au même endroit — avec des pros vérifiés.
        </Text>

        <Pressable style={s.searchBar} onPress={() => router.push('/(tabs)/services')}>
          <Search size={20} color={colors.link} />
          <Text style={s.searchText}>Ménage, plomberie…</Text>
        </Pressable>

        <View style={s.rowBetween}>
          <Text style={s.section}>Services populaires</Text>
        </View>

        <View style={s.grid}>
          {services.map(({ name, Icon, count }) => (
            <Pressable key={name} style={s.card} onPress={() => router.push('/(tabs)/services')}>
              <View style={s.iconBox}>
                <Icon size={24} color={colors.link} />
              </View>
              <Text style={s.cardTitle}>{name}</Text>
              <Text style={s.cardCount}>{count} pros</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const GAP = 12;
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  topbar: { paddingVertical: 12 },
  h1: { fontFamily: font.display, fontSize: 30, color: colors.ink, lineHeight: 36, marginTop: 6, letterSpacing: -0.5 },
  lead: { fontFamily: font.body, fontSize: 15, color: colors.muted, marginTop: 10, lineHeight: 22 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line3,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 18,
  },
  searchText: { fontFamily: font.medium, fontSize: 15, color: colors.faint },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 14 },
  section: { fontFamily: font.display, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: GAP },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 18,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  cardCount: { fontFamily: font.body, fontSize: 13, color: colors.faint, marginTop: 2 },
});
