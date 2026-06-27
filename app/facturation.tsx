import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { getMyBillingDocs, formatShortDate, type BillingDocRow } from '../lib/api';
import { useBreakpoint, centeredContent } from '../lib/responsive';

export default function Facturation() {
  const { contentMaxWidth } = useBreakpoint();
  const [docs, setDocs] = useState<BillingDocRow[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyBillingDocs().then((d) => active && setDocs(d));
      return () => {
        active = false;
      };
    }, []),
  );

  const factures = docs?.filter((d) => d.type === 'facture') ?? [];
  const caTtc = factures.reduce((s, d) => s + (d.total ?? 0), 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Facturation" />
      <ScrollView contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]} showsVerticalScrollIndicator={false}>
        {docs === null ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.proInk} />
          </View>
        ) : docs.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <FileText size={26} color={colors.proInk} />
            </View>
            <Text style={s.emptyTitle}>Aucun document</Text>
            <Text style={s.emptyText}>Vos devis et factures (générés depuis une réservation) apparaîtront ici.</Text>
          </View>
        ) : (
          <>
            <View style={s.summary}>
              <Text style={s.summaryLabel}>Chiffre d'affaires facturé</Text>
              <Text style={s.summaryValue}>{caTtc.toLocaleString('fr-FR')} €</Text>
              <Text style={s.summarySub}>{factures.length} facture{factures.length > 1 ? 's' : ''}</Text>
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
              {docs.map((d) => (
                <View key={d.id} style={s.card}>
                  <View style={[s.badge, d.type === 'facture' ? s.badgeFact : s.badgeDev]}>
                    <Text style={[s.badgeText, d.type === 'facture' ? s.badgeTextFact : s.badgeTextDev]}>
                      {d.type === 'facture' ? 'Facture' : 'Devis'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.number}>{d.number}</Text>
                    <Text style={s.meta} numberOfLines={1}>
                      {d.clientName ?? 'Client'} · {d.service ?? '—'} · {formatShortDate(d.createdAt)}
                    </Text>
                  </View>
                  <Text style={s.total}>{d.total != null ? `${d.total.toFixed(0)} €` : '—'}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  loading: { paddingTop: 60, alignItems: 'center' },
  summary: { backgroundColor: colors.proInk, borderRadius: 20, padding: 22 },
  summaryLabel: { fontFamily: font.medium, fontSize: 13, color: '#aeb6c6' },
  summaryValue: { fontFamily: font.display, fontSize: 32, color: '#fff', letterSpacing: -1, marginTop: 6 },
  summarySub: { fontFamily: font.body, fontSize: 13, color: '#aeb6c6', marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  badgeFact: { backgroundColor: colors.okBg },
  badgeDev: { backgroundColor: colors.chip },
  badgeText: { fontFamily: font.semi, fontSize: 11 },
  badgeTextFact: { color: colors.okText },
  badgeTextDev: { color: colors.link },
  number: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  meta: { fontFamily: font.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  total: { fontFamily: font.display, fontSize: 17, color: colors.proInk },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 18, color: colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
