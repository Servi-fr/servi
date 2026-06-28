import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, MapPin, BadgeCheck, ChevronRight, SearchX } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { getCategory, providersByCategory, initials, isSapEligible } from '../../lib/data';
import { getProvidersByCategory } from '../../lib/api';
import { useBreakpoint, centeredContent } from '../../lib/responsive';
import { SapBadge } from '../../components/SapBadge';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { contentMaxWidth, isRegularUp } = useBreakpoint();
  const category = getCategory(slug);
  // Affiche le catalogue local instantanément, puis remplace par les pros en base.
  const [list, setList] = useState(() => providersByCategory(slug));
  useEffect(() => {
    let active = true;
    getProvidersByCategory(slug).then((r) => {
      if (active && r.length) setList(r);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={category?.name ?? 'Prestataires'} />
      <ScrollView contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]} showsVerticalScrollIndicator={false}>
        <Text style={s.lead}>
          {category?.desc ?? 'Trouvez un prestataire vérifié.'}
        </Text>
        <Text style={s.count}>{list.length} prestataire{list.length > 1 ? 's' : ''} disponible{list.length > 1 ? 's' : ''}</Text>
        {isSapEligible(slug) && (
          <View style={{ marginTop: 10 }}>
            <SapBadge />
          </View>
        )}

        {list.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <SearchX size={26} color={colors.link} />
            </View>
            <Text style={s.emptyTitle}>Aucun prestataire pour le moment</Text>
            <Text style={s.emptyText}>Revenez bientôt, de nouveaux pros rejoignent SERVI chaque jour.</Text>
          </View>
        ) : (
          <View style={[{ gap: 12, marginTop: 14 }, isRegularUp && s.gridWrap]}>
            {list.map((p) => (
              <Pressable
                key={p.id}
                style={[s.card, isRegularUp && s.cardHalf]}
                onPress={() => router.push(`/prestataire/${p.id}`)}
              >
                <View style={s.avatar}>
                  {p.logo ? <Image source={{ uri: p.logo }} style={s.avatarImg} /> : <Text style={s.avatarText}>{initials(p.name)}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={s.name} numberOfLines={1}>{p.name}</Text>
                    {p.verified && <BadgeCheck size={16} color={colors.link} />}
                  </View>
                  <Text style={s.tagline} numberOfLines={1}>{p.tagline}</Text>
                  <View style={s.metaRow}>
                    <Star size={13} color={colors.star} fill={colors.star} />
                    <Text style={s.rating}>{p.rating.toFixed(1)}</Text>
                    <Text style={s.reviews}>({p.reviews})</Text>
                    <MapPin size={13} color={colors.faint} style={{ marginLeft: 6 }} />
                    <Text style={s.city} numberOfLines={1}>
                      {p.city}
                      {p.radiusKm ? ` · ${p.radiusKm} km` : ''}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.priceFrom}>dès</Text>
                  <Text style={s.price}>{Math.min(...p.services.map((x) => x.price))} €</Text>
                  <ChevronRight size={18} color={colors.faint} style={{ marginTop: 4 }} />
                </View>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, lineHeight: 21 },
  count: { fontFamily: font.semi, fontSize: 13, color: colors.muted, marginTop: 10 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cardHalf: { width: '48.5%' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 14,
  },
  avatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { fontFamily: font.display, fontSize: 17, color: colors.link },
  avatarImg: { width: '100%', height: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontFamily: font.semi, fontSize: 16, color: colors.ink, flexShrink: 1 },
  tagline: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  rating: { fontFamily: font.semi, fontSize: 12.5, color: colors.ink },
  reviews: { fontFamily: font.body, fontSize: 12.5, color: colors.muted },
  city: { fontFamily: font.body, fontSize: 12.5, color: colors.muted, flexShrink: 1 },
  priceFrom: { fontFamily: font.body, fontSize: 11, color: colors.muted },
  price: { fontFamily: font.display, fontSize: 17, color: colors.ink },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 18, color: colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
