import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  BadgeCheck,
  Star,
  Wallet,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  type LucideIcon,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { colors, font } from '../../theme/colors';
import { initials } from '../../lib/data';
import { getMyProfile, getMyProviderProfile, getProBookings, type ProviderProfile } from '../../lib/api';

export default function ProProfile() {
  const router = useRouter();
  const [name, setName] = useState('Prestataire');
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [missions, setMissions] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyProfile().then((p) => active && p?.name && setName(p.name));
      getMyProviderProfile().then((p) => active && setProfile(p));
      getProBookings().then((b) => active && setMissions(b.length));
      return () => {
        active = false;
      };
    }, []),
  );

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  const menu: { label: string; Icon: LucideIcon; route?: string }[] = [
    { label: 'Mes prestations & tarifs', Icon: Wallet, route: '/devenir-prestataire' },
    { label: 'Mon profil', Icon: Settings, route: '/profile-edit' },
    { label: 'Paiements & virements', Icon: CreditCard },
    { label: 'Aide & support', Icon: HelpCircle },
    { label: 'Légal & confidentialité', Icon: FileText, route: '/legal' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.h1}>Profil</Text>

        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(name)}</Text>
          </View>
          <View style={s.nameRow}>
            <Text style={s.name}>{name}</Text>
            <BadgeCheck size={18} color="#fff" />
          </View>
          <Text style={s.role}>{profile ? `Prestataire · ${profile.service}` : 'Prestataire'}</Text>

          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <View style={s.heroStatTop}>
                <Star size={14} color="#f5a623" fill="#f5a623" />
                <Text style={s.heroStatValue}>{profile?.rating ? profile.rating.toFixed(1) : '—'}</Text>
              </View>
              <Text style={s.heroStatLabel}>Note</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{missions}</Text>
              <Text style={s.heroStatLabel}>Missions</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{profile ? `${profile.hourlyRate} €` : '—'}</Text>
              <Text style={s.heroStatLabel}>Tarif / h</Text>
            </View>
          </View>
        </View>

        {!profile && (
          <Pressable style={s.setup} onPress={() => router.push('/devenir-prestataire')}>
            <Text style={s.setupText}>Configurer mon activité prestataire</Text>
          </Pressable>
        )}

        <View style={s.menu}>
          {menu.map(({ label, Icon, route }, i) => (
            <Pressable
              key={label}
              style={[s.row, i > 0 && s.rowBorder]}
              onPress={() => route && router.push(route)}
            >
              <View style={s.rowIcon}>
                <Icon size={18} color={colors.proInk} />
              </View>
              <Text style={s.rowLabel}>{label}</Text>
              <ChevronRight size={18} color={colors.faint} />
            </Pressable>
          ))}
        </View>

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
  setup: { marginTop: 16, paddingVertical: 15, borderRadius: 14, backgroundColor: colors.proInk, alignItems: 'center' },
  setupText: { fontFamily: font.semi, fontSize: 15, color: '#fff' },
  menu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 16, marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontFamily: font.semi, fontSize: 15, color: colors.ink },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14 },
  logoutText: { fontFamily: font.semi, fontSize: 15, color: '#dc2626' },
});
