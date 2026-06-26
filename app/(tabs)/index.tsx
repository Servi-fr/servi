import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Sparkles, ChevronRight, Star } from 'lucide-react-native';
import { Logo } from '../../components/Logo';
import { NotifBell } from '../../components/NotifBell';
import { colors, font } from '../../theme/colors';
import { families, initials, type Provider } from '../../lib/data';
import { getSponsoredProviders } from '../../lib/api';
import { useBreakpoint, centeredContent } from '../../lib/responsive';

export default function Home() {
  const router = useRouter();
  const { contentMaxWidth, isLarge, isRegularUp } = useBreakpoint();
  const [sponsored, setSponsored] = useState<Provider[]>([]);
  useEffect(() => {
    getSponsoredProviders().then(setSponsored);
  }, []);
  const familyCardWidth = isLarge ? '23%' : isRegularUp ? '31.5%' : '48%';
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]} showsVerticalScrollIndicator={false}>
        <View style={s.topbar}>
          <Logo size={21} />
          <NotifBell />
        </View>

        <Text style={s.h1}>Le bon prestataire,{'\n'}près de chez vous.</Text>
        <Text style={s.lead}>
          Réservation, paiement et suivi au même endroit — avec des pros vérifiés.
        </Text>

        <Pressable style={s.searchBar} onPress={() => router.push('/services')}>
          <Search size={20} color={colors.link} />
          <Text style={s.searchText}>Ménage, plomberie…</Text>
        </Pressable>

        <Pressable style={s.needCard} onPress={() => router.push('/besoin')}>
          <View style={s.needIcon}>
            <Sparkles size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.needTitle}>Décrivez votre besoin</Text>
            <Text style={s.needSub}>On trouve les bons prestataires pour vous</Text>
          </View>
          <ChevronRight size={20} color="#fff" />
        </Pressable>

        {sponsored.length > 0 && (
          <>
            <Text style={s.sponsoredTitle}>À la une</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sponsoredRow}>
              {sponsored.map((p) => (
                <Pressable key={p.id} style={s.sponsoredCard} onPress={() => router.push(`/prestataire/${p.id}`)}>
                  <View style={s.sponsoredBadge}>
                    <Text style={s.sponsoredBadgeText}>Sponsorisé</Text>
                  </View>
                  <View style={s.sponsoredAvatar}>
                    {p.logo ? (
                      <Image source={{ uri: p.logo }} style={s.sponsoredAvatarImg} />
                    ) : (
                      <Text style={s.sponsoredAvatarText}>{initials(p.name)}</Text>
                    )}
                  </View>
                  <Text style={s.sponsoredName} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.sponsoredTag} numberOfLines={1}>{p.tagline}</Text>
                  <View style={s.sponsoredMeta}>
                    <Star size={12} color={colors.star} fill={colors.star} />
                    <Text style={s.sponsoredRating}>{p.rating.toFixed(1)}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <View style={s.rowBetween}>
          <Text style={s.section}>Explorez par famille</Text>
          <Pressable onPress={() => router.push('/services')}>
            <Text style={s.link}>Tous les services</Text>
          </Pressable>
        </View>

        <View style={s.grid}>
          {families.map((f) => (
            <Pressable key={f.slug} style={[s.card, { width: familyCardWidth }]} onPress={() => router.push(`/family/${f.slug}`)}>
              <View style={s.iconBox}>
                <f.Icon size={24} color={colors.link} />
              </View>
              <Text style={s.cardTitle}>{f.name}</Text>
              <Text style={s.cardCount}>
                {f.categories.length} service{f.categories.length > 1 ? 's' : ''}
              </Text>
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
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
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
  needCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.blue, borderRadius: 16, padding: 16, marginTop: 12 },
  needIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  needTitle: { fontFamily: font.semi, fontSize: 15.5, color: '#fff' },
  needSub: { fontFamily: font.body, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  sponsoredTitle: { fontFamily: font.display, fontSize: 20, color: colors.ink, letterSpacing: -0.4, marginTop: 26, marginBottom: 12 },
  sponsoredRow: { gap: 12, paddingRight: 8 },
  sponsoredCard: { width: 150, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  sponsoredBadge: { alignSelf: 'flex-start', backgroundColor: colors.chip, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 10 },
  sponsoredBadgeText: { fontFamily: font.semi, fontSize: 10, color: colors.link },
  sponsoredAvatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 },
  sponsoredAvatarImg: { width: '100%', height: '100%' },
  sponsoredAvatarText: { fontFamily: font.display, fontSize: 15, color: colors.link },
  sponsoredName: { fontFamily: font.semi, fontSize: 14.5, color: colors.ink },
  sponsoredTag: { fontFamily: font.body, fontSize: 12, color: colors.muted, marginTop: 1 },
  sponsoredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  sponsoredRating: { fontFamily: font.semi, fontSize: 12.5, color: colors.ink },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 14 },
  section: { fontFamily: font.display, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  link: { fontFamily: font.semi, fontSize: 13.5, color: colors.link },
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
