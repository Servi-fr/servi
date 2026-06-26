import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Check, BadgeCheck } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { getMyProfile } from '../lib/api';
import { config } from '../lib/config';
import { startSubscription } from '../lib/payments';
import { useBreakpoint, centeredContent } from '../lib/responsive';

const PRO_PERKS = [
  'Devis & factures conformes (PDF)',
  'Comptabilité : encaissements & export FEC',
  'Mise en avant dans les résultats & la carte',
  'Photos illimitées sur votre fiche',
  'Statistiques avancées',
  'Commission réduite',
];
const PREMIUM_PERKS = [
  'Navigation sans publicité',
  'Assistant crédit d\'impôt + attestation annuelle',
  'Réservation anticipée des créneaux',
  'Support prioritaire',
  'Favoris illimités',
];

export default function Premium() {
  const { contentMaxWidth } = useBreakpoint();
  const [role, setRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('FREE');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMyProfile().then((p) => {
      if (p) {
        setRole(p.role);
        setPlan(p.plan ?? 'FREE');
      }
      setLoading(false);
    });
  }, []);

  const isPro = role === 'PRESTATAIRE';
  const targetPlan: 'PRO' | 'PREMIUM' = isPro ? 'PRO' : 'PREMIUM';
  const title = isPro ? 'SERVI Pro' : 'SERVI Premium';
  const price = isPro ? '19,99 €' : '9,99 €';
  const perks = isPro ? PRO_PERKS : PREMIUM_PERKS;
  const alreadySubscribed = plan === 'PRO' || plan === 'PREMIUM';

  async function subscribe() {
    if (!config.paymentsEnabled) {
      Alert.alert('Bientôt disponible', "L'abonnement arrive très prochainement. Merci de votre intérêt !");
      return;
    }
    setBusy(true);
    const r = await startSubscription(targetPlan);
    setBusy(false);
    if (!r.ok) Alert.alert('Abonnement', "Le paiement n'a pas abouti. Réessayez.");
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={title} />
      <ScrollView contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.link} />
          </View>
        ) : (
          <>
            <View style={s.hero}>
              <View style={s.crown}>
                <Crown size={26} color="#fff" />
              </View>
              <Text style={s.heroTitle}>{title}</Text>
              <Text style={s.heroPrice}>
                {price}
                <Text style={s.heroPer}> / mois</Text>
              </Text>
              <Text style={s.heroSub}>
                {isPro ? 'Gérez votre activité comme un pro.' : 'Plus de confort, et vos impôts en moins.'}
              </Text>
            </View>

            <View style={s.card}>
              {perks.map((p, i) => (
                <View key={p} style={[s.perk, i > 0 && s.perkBorder]}>
                  <View style={s.tick}>
                    <Check size={14} color={colors.okText} />
                  </View>
                  <Text style={s.perkText}>{p}</Text>
                </View>
              ))}
            </View>

            {alreadySubscribed ? (
              <View style={s.activeBox}>
                <BadgeCheck size={18} color={colors.okText} />
                <Text style={s.activeText}>Vous êtes déjà {isPro ? 'Pro' : 'Premium'} — merci !</Text>
              </View>
            ) : (
              <Pressable style={[s.cta, busy && s.ctaOff]} disabled={busy} onPress={subscribe}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.ctaText}>Passer {isPro ? 'Pro' : 'Premium'}</Text>}
              </Pressable>
            )}

            <Text style={s.legal}>Sans engagement, résiliable à tout moment. Paiement sécurisé Stripe.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  loading: { paddingTop: 70, alignItems: 'center' },
  hero: { backgroundColor: colors.proInk, borderRadius: 22, padding: 26, alignItems: 'center', marginTop: 4 },
  crown: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontFamily: font.display, fontSize: 26, color: '#fff', letterSpacing: -0.5 },
  heroPrice: { fontFamily: font.display, fontSize: 34, color: '#fff', letterSpacing: -1, marginTop: 8 },
  heroPer: { fontFamily: font.medium, fontSize: 15, color: '#aeb6c6' },
  heroSub: { fontFamily: font.body, fontSize: 14, color: '#aeb6c6', textAlign: 'center', marginTop: 8 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, marginTop: 18 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  perkBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  tick: { width: 26, height: 26, borderRadius: 9, backgroundColor: colors.okBg, alignItems: 'center', justifyContent: 'center' },
  perkText: { fontFamily: font.medium, fontSize: 15, color: colors.ink, flex: 1 },
  cta: { backgroundColor: colors.blue, borderRadius: 15, paddingVertical: 17, alignItems: 'center', marginTop: 20 },
  ctaOff: { backgroundColor: colors.faint },
  ctaText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
  activeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.okBg, borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  activeText: { fontFamily: font.semi, fontSize: 15, color: colors.okText },
  legal: { fontFamily: font.body, fontSize: 12, color: colors.faint, textAlign: 'center', marginTop: 14, lineHeight: 18 },
});
