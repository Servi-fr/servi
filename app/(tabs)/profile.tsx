import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, CalendarDays, CreditCard, Heart, ChevronRight, ArrowLeftRight, FileText, MessageCircle, Crown, Percent, MapPin, type LucideIcon } from 'lucide-react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { colors, font } from '../../theme/colors';
import { getMyProviderProfile, getMyProfile } from '../../lib/api';

const items: { label: string; Icon: LucideIcon; route?: string }[] = [
  { label: 'Passer Premium', Icon: Crown, route: '/premium' },
  { label: 'Mes réservations', Icon: CalendarDays, route: '/bookings' },
  { label: 'Messages', Icon: MessageCircle, route: '/messages' },
  { label: 'Mes adresses', Icon: MapPin, route: '/addresses' },
  { label: "Crédit d'impôt", Icon: Percent, route: '/credit-impot' },
  { label: 'Paiements', Icon: CreditCard },
  { label: 'Favoris', Icon: Heart },
  { label: 'Légal & confidentialité', Icon: FileText, route: '/legal' },
];

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    getMyProviderProfile().then((p) => setIsProvider(!!p));
    getMyProfile().then((p) => setImage(p?.image ?? null));
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  const name = (user?.user_metadata?.name as string) || user?.email || 'Mon compte';
  const initials = name
    .split(/[\s@.]/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.scroll}>
        <Text style={s.h1}>Profil</Text>

        <Pressable style={s.userCard} onPress={() => router.push('/profile-edit')}>
          {image ? (
            <Image source={{ uri: image }} style={s.avatar} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.email}>{user?.email}</Text>
          </View>
          <ChevronRight size={18} color={colors.faint} />
        </Pressable>

        <View style={s.menu}>
          {items.map(({ label, Icon, route }, i) => (
            <Pressable
              key={label}
              style={[s.menuRow, i > 0 && s.menuBorder]}
              onPress={() => route && router.push(route)}
            >
              <Icon size={20} color={colors.link} />
              <Text style={s.menuLabel}>{label}</Text>
              <ChevronRight size={18} color={colors.faint} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={s.switch}
          onPress={() => router.push(isProvider ? '/(pro)/dashboard' : '/devenir-prestataire')}
        >
          <ArrowLeftRight size={18} color={colors.proInk} />
          <Text style={s.switchText}>{isProvider ? 'Espace prestataire' : 'Devenir prestataire'}</Text>
        </Pressable>

        <Pressable onPress={logout} style={s.logout}>
          <LogOut size={18} color="#dc2626" />
          <Text style={s.logoutText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5, marginBottom: 18 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 18,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.link, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.display, fontSize: 18, color: '#fff' },
  name: { fontFamily: font.semi, fontSize: 17, color: colors.ink },
  email: { fontFamily: font.body, fontSize: 13, color: colors.faint, marginTop: 2 },
  menu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, marginTop: 16, paddingHorizontal: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  menuBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  menuLabel: { flex: 1, fontFamily: font.semi, fontSize: 15, color: colors.ink },
  switch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: colors.line3, backgroundColor: colors.surface },
  switchText: { fontFamily: font.semi, fontSize: 15, color: colors.proInk },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 14 },
  logoutText: { fontFamily: font.semi, fontSize: 15, color: '#dc2626' },
});
