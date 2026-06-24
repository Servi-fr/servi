import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, MapPin, BadgeCheck, Check, Award } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { getProvider as seedProvider, getCategory, sampleReviews, initials, type Provider } from '../../lib/data';
import { getProviderById, getReviewsForProvider } from '../../lib/api';

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<Provider | undefined>(() => seedProvider(id));
  const [loading, setLoading] = useState(!p);
  const [reviews, setReviews] = useState(sampleReviews);
  const [hasRealReviews, setHasRealReviews] = useState(false);
  useEffect(() => {
    let active = true;
    getProviderById(id).then((r) => {
      if (!active) return;
      if (r) setP(r);
      setLoading(false);
    });
    getReviewsForProvider(id).then((rv) => {
      if (active && rv.length > 0) {
        setReviews(rv);
        setHasRealReviews(true);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading && !p) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title="Prestataire" />
        <View style={s.notFound}>
          <ActivityIndicator color={colors.link} />
        </View>
      </SafeAreaView>
    );
  }

  if (!p) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title="Prestataire" />
        <View style={s.notFound}>
          <Text style={s.nfText}>Ce prestataire est introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = getCategory(p.category);
  const minPrice = Math.min(...p.services.map((x) => x.price));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={category?.name ?? 'Prestataire'} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* En-tête profil */}
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(p.name)}</Text>
          </View>
          <View style={s.nameRow}>
            <Text style={s.name}>{p.name}</Text>
            {p.verified && <BadgeCheck size={20} color={colors.link} />}
          </View>
          <Text style={s.tagline}>{p.tagline}</Text>
          <View style={s.metaRow}>
            <Star size={15} color={colors.star} fill={colors.star} />
            <Text style={s.rating}>{p.rating.toFixed(1)}</Text>
            <Text style={s.reviews}>· {p.reviews} avis</Text>
            <MapPin size={14} color={colors.faint} style={{ marginLeft: 8 }} />
            <Text style={s.city}>
              {p.city}
              {p.radiusKm ? ` · ${p.radiusKm} km` : ''}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          <Stat value={`${p.jobs}+`} label="Missions" />
          <View style={s.statDivider} />
          <Stat value={p.rating.toFixed(1)} label="Note moyenne" />
          <View style={s.statDivider} />
          <Stat value={p.verified ? 'Vérifié' : 'En cours'} label="Identité" />
        </View>

        {/* À propos */}
        <Text style={s.section}>À propos</Text>
        <Text style={s.bio}>{p.bio}</Text>

        {/* Prestations */}
        <Text style={s.section}>Prestations</Text>
        <View style={s.box}>
          {p.services.map((svc, i) => (
            <View key={svc.label} style={[s.svcRow, i > 0 && s.svcBorder]}>
              <View style={s.svcCheck}>
                <Check size={14} color={colors.link} />
              </View>
              <Text style={s.svcLabel}>{svc.label}</Text>
              <Text style={s.svcPrice}>
                {svc.price} € <Text style={s.svcUnit}>{svc.unit}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Diplômes & certifications */}
        {p.certifications && p.certifications.length > 0 && (
          <>
            <Text style={s.section}>Diplômes & certifications</Text>
            <View style={s.certWrap}>
              {p.certifications.map((c, i) => (
                <View key={c + i} style={s.certChip}>
                  <Award size={14} color={colors.link} />
                  <Text style={s.certText}>{c}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Zone d'intervention */}
        <Text style={s.section}>Zone d'intervention</Text>
        <View style={s.zoneCard}>
          <View style={s.svcCheck}>
            <MapPin size={14} color={colors.link} />
          </View>
          <Text style={s.zoneText}>
            {p.city || 'Zone non précisée'}
            {p.radiusKm ? ` — intervient dans un rayon de ${p.radiusKm} km` : ''}
          </Text>
        </View>

        {/* Avis */}
        <View style={s.reviewHead}>
          <Text style={s.section}>Avis ({hasRealReviews ? reviews.length : p.reviews})</Text>
          <View style={s.reviewScore}>
            <Star size={14} color={colors.star} fill={colors.star} />
            <Text style={s.reviewScoreText}>{p.rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={{ gap: 10 }}>
          {reviews.map((r, ri) => (
            <View key={r.author + ri} style={s.reviewCard}>
              <View style={s.reviewTop}>
                <View style={s.reviewAvatar}>
                  <Text style={s.reviewInitials}>{initials(r.author)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewAuthor}>{r.author}</Text>
                  <Text style={s.reviewDate}>{r.date}</Text>
                </View>
                <View style={s.reviewStars}>
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} color={colors.star} fill={colors.star} />
                  ))}
                </View>
              </View>
              <Text style={s.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Barre CTA fixe */}
      <View style={s.ctaBar}>
        <View>
          <Text style={s.ctaFrom}>À partir de</Text>
          <Text style={s.ctaPrice}>{minPrice} €</Text>
        </View>
        <Pressable style={s.ctaBtn} onPress={() => router.push(`/reservation/${p.id}`)}>
          <Text style={s.ctaBtnText}>Réserver</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nfText: { fontFamily: font.body, fontSize: 15, color: colors.muted },

  hero: { alignItems: 'center', paddingTop: 6, paddingBottom: 18 },
  avatar: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontFamily: font.display, fontSize: 28, color: colors.link },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: font.display, fontSize: 24, color: colors.ink, letterSpacing: -0.5 },
  tagline: { fontFamily: font.body, fontSize: 14.5, color: colors.muted, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 10 },
  rating: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  reviews: { fontFamily: font.body, fontSize: 13.5, color: colors.muted },
  city: { fontFamily: font.body, fontSize: 13.5, color: colors.faint },

  stats: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValueRow: { flexDirection: 'row', alignItems: 'center' },
  statValue: { fontFamily: font.displaySemi, fontSize: 18, color: colors.ink },
  statLabel: { fontFamily: font.body, fontSize: 12, color: colors.faint, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: colors.line, marginVertical: 6 },

  section: { fontFamily: font.display, fontSize: 18, color: colors.ink, letterSpacing: -0.4, marginTop: 24, marginBottom: 10 },
  bio: { fontFamily: font.body, fontSize: 14.5, color: colors.muted, lineHeight: 23 },

  box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 16 },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  svcBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  svcCheck: { width: 26, height: 26, borderRadius: 9, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  svcLabel: { flex: 1, fontFamily: font.medium, fontSize: 15, color: colors.ink },
  svcPrice: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  svcUnit: { fontFamily: font.body, fontSize: 12.5, color: colors.faint },

  certWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  certChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  certText: { fontFamily: font.medium, fontSize: 13, color: colors.ink },
  zoneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16 },
  zoneText: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.ink, lineHeight: 20 },

  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewScore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14 },
  reviewScoreText: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  reviewCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  reviewAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  reviewInitials: { fontFamily: font.semi, fontSize: 13, color: colors.muted },
  reviewAuthor: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  reviewDate: { fontFamily: font.body, fontSize: 12, color: colors.faint, marginTop: 1 },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewText: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, lineHeight: 21 },

  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line3,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
  },
  ctaFrom: { fontFamily: font.body, fontSize: 12, color: colors.faint },
  ctaPrice: { fontFamily: font.display, fontSize: 22, color: colors.ink },
  ctaBtn: { backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40 },
  ctaBtnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
});
