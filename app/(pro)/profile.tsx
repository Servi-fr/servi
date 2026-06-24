import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BadgeCheck,
  Star,
  Wallet,
  Settings,
  CreditCard,
  HelpCircle,
  ArrowLeftRight,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { colors, font } from '../../theme/colors';
import { currentPro, getCategory, initials } from '../../lib/data';

const menu: { label: string; Icon: LucideIcon }[] = [
  { label: 'Mes prestations & tarifs', Icon: Wallet },
  { label: 'Paiements & virements', Icon: CreditCard },
  { label: 'Paramètres du compte', Icon: Settings },
  { label: 'Aide & support', Icon: HelpCircle },
];

export default function ProProfile() {
  const router = useRouter();
  const category = getCategory(currentPro.category);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.h1}>Profil</Text>

        {/* Carte profil N&B */}
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(currentPro.name)}</Text>
          </View>
          <View style={s.nameRow}>
            <Text style={s.name}>{currentPro.name}</Text>
            {currentPro.verified && <BadgeCheck size={18} color="#fff" />}
          </View>
          <Text style={s.role}>Prestataire · {category?.name}</Text>

          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <View style={s.heroStatTop}>
                <Star size={14} color="#f5a623" fill="#f5a623" />
                <Text style={s.heroStatValue}>{currentPro.rating.toFixed(1)}</Text>
              </View>
              <Text style={s.heroStatLabel}>Note</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{currentPro.jobs}+</Text>
              <Text style={s.heroStatLabel}>Missions</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{currentPro.reviews}</Text>
              <Text style={s.heroStatLabel}>Avis</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menu}>
          {menu.map(({ label, Icon }, i) => (
            <Pressable key={label} style={[s.row, i > 0 && s.rowBorder]}>
              <View style={s.rowIcon}>
                <Icon size={18} color={colors.proInk} />
              </View>
              <Text style={s.rowLabel}>{label}</Text>
              <ChevronRight size={18} color={colors.faint} />
            </Pressable>
          ))}
        </View>

        {/* Basculer côté client */}
        <Pressable style={s.switch} onPress={() => router.replace('/(tabs)')}>
          <ArrowLeftRight size={18} color={colors.link} />
          <Text style={s.switchText}>Passer à l'espace client</Text>
        </Pressable>

        <Pressable onPress={logout} style={s.logout}>
          <LogOut size={18} color="#dc2626" />
          <Text style={s.logoutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.proInk, letterSpacing: -0.5, marginBottom: 18 },

  hero: { backgroundColor: colors.proInk, borderRadius: 22, padding: 22, alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontFamily: font.display, fontSize: 24, color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: font.display, fontSize: 22, color: '#fff', letterSpacing: -0.5 },
  role: { fontFamily: font.body, fontSize: 13.5, color: '#aeb6c6', marginTop: 4 },
  heroStats: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 20 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatValue: { fontFamily: font.displaySemi, fontSize: 18, color: '#fff' },
  heroStatLabel: { fontFamily: font.body, fontSize: 11.5, color: '#8b94a6', marginTop: 3 },
  heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.12)' },

  menu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 16, marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontFamily: font.semi, fontSize: 15, color: colors.ink },

  switch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: colors.line3, backgroundColor: colors.surface },
  switchText: { fontFamily: font.semi, fontSize: 15, color: colors.link },

  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 14 },
  logoutText: { fontFamily: font.semi, fontSize: 15, color: '#dc2626' },
});
