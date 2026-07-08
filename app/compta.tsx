import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { commissionRate } from '../lib/data';
import { getProBookings, getMyManualJobs, getMyProfile, type BookingRow, type ManualJobRow } from '../lib/api';

// Comptabilité du mois : encaissé, à venir, commission, pourboires — SERVI + missions
// perso réunis. Export CSV (Excel/Numbers) pour le comptable.

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export default function Compta() {
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [jobs, setJobs] = useState<ManualJobRow[]>([]);
  const [plan, setPlan] = useState('FREE');
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });

  useEffect(() => {
    getProBookings().then(setBookings);
    getMyManualJobs().then(setJobs);
    getMyProfile().then((p) => p?.plan && setPlan(p.plan));
  }, []);

  const rate = commissionRate(plan);
  const inMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === month.y && d.getMonth() === month.m;
  };

  const stats = useMemo(() => {
    const bk = (bookings ?? []).filter((b) => inMonth(b.date));
    const jb = jobs.filter((j) => inMonth(j.date));
    const serviDone = bk.filter((b) => b.status === 'COMPLETED');
    const persoDone = jb.filter((j) => j.status === 'DONE');
    const brut = serviDone.reduce((s, b) => s + b.price, 0);
    const commission = Math.round(brut * rate * 100) / 100;
    const tips = serviDone.reduce((s, b) => s + (b.tipAmount ?? 0), 0);
    const encaisse = Math.round((brut - commission + tips + persoDone.reduce((s, j) => s + j.price, 0)) * 100) / 100;
    const avenir =
      bk.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').reduce((s, b) => s + b.price * (1 - rate), 0) +
      jb.filter((j) => j.status === 'PLANNED').reduce((s, j) => s + j.price, 0);
    return {
      encaisse,
      avenir: Math.round(avenir),
      commission,
      tips: Math.round(tips * 100) / 100,
      missions: serviDone.length + persoDone.length,
      persoPart: persoDone.reduce((s, j) => s + j.price, 0),
    };
  }, [bookings, jobs, month, rate]);

  async function exportCsv() {
    const rows: string[] = ['Date;Source;Client;Prestation;Statut;Montant (EUR);Commission (EUR);Net (EUR)'];
    const fmt = (n: number) => n.toFixed(2).replace('.', ',');
    (bookings ?? [])
      .filter((b) => inMonth(b.date) && b.status !== 'CANCELLED')
      .forEach((b) => {
        const com = b.status === 'COMPLETED' ? b.price * rate : 0;
        rows.push(
          `${new Date(b.date).toLocaleDateString('fr-FR')};SERVI;${(b.client?.name ?? 'Client').replace(/;/g, ',')};${b.service.replace(/;/g, ',')};${b.status};${fmt(b.price)};${fmt(com)};${fmt(b.price - com + (b.tipAmount ?? 0))}`,
        );
      });
    jobs
      .filter((j) => inMonth(j.date) && j.status !== 'CANCELLED')
      .forEach((j) => {
        rows.push(
          `${new Date(j.date).toLocaleDateString('fr-FR')};Perso;${j.clientName.replace(/;/g, ',')};${j.service.replace(/;/g, ',')};${j.status};${fmt(j.price)};0,00;${fmt(j.price)}`,
        );
      });
    const uri = `${FileSystem.cacheDirectory}servi-compta-${month.y}-${String(month.m + 1).padStart(2, '0')}.csv`;
    // BOM UTF-8 pour Excel
    await FileSystem.writeAsStringAsync(uri, '﻿' + rows.join('\n'));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export comptable' });
    } else {
      Alert.alert('Export', 'Partage indisponible sur cet appareil.');
    }
  }

  const prev = () => setMonth((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const next = () => setMonth((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Comptabilité" dark />
      {bookings === null ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.proInk} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Sélecteur de mois */}
          <View style={s.monthRow}>
            <Pressable onPress={prev} hitSlop={10} accessibilityRole="button" accessibilityLabel="Mois précédent">
              <ChevronLeft size={22} color={colors.proInk} />
            </Pressable>
            <Text style={s.month}>
              {MONTHS[month.m]} {month.y}
            </Text>
            <Pressable onPress={next} hitSlop={10} accessibilityRole="button" accessibilityLabel="Mois suivant">
              <ChevronRight size={22} color={colors.proInk} />
            </Pressable>
          </View>

          <View style={s.hero}>
            <Text style={s.heroLabel}>Encaissé (net) ce mois</Text>
            <Text style={s.heroValue}>{stats.encaisse.toLocaleString('fr-FR')} €</Text>
            <Text style={s.heroSub}>
              {stats.missions} mission{stats.missions > 1 ? 's' : ''} terminée{stats.missions > 1 ? 's' : ''}
              {stats.tips > 0 ? ` · dont ${stats.tips} € de pourboires` : ''}
            </Text>
          </View>

          <View style={s.grid}>
            <Cell label="À venir (planifié)" value={`${stats.avenir.toLocaleString('fr-FR')} €`} />
            <Cell label={`Commission SERVI (${Math.round(rate * 100)} %)`} value={`${stats.commission.toLocaleString('fr-FR')} €`} />
            <Cell label="Hors plateforme (0 %)" value={`${Math.round(stats.persoPart).toLocaleString('fr-FR')} €`} />
            <Cell label="Pourboires" value={`${stats.tips.toLocaleString('fr-FR')} €`} />
          </View>

          <Pressable style={s.exportBtn} onPress={exportCsv} accessibilityRole="button" accessibilityLabel="Exporter le mois en CSV">
            <Download size={17} color="#fff" />
            <Text style={s.exportText}>Exporter le mois (CSV pour le comptable)</Text>
          </Pressable>
          <Text style={s.note}>
            Net = prix − commission SERVI + pourboires. Les missions hors plateforme sont comptées à 100 %.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.cell}>
      <Text style={s.cellValue}>{value}</Text>
      <Text style={s.cellLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4 },
  month: { fontFamily: font.displaySemi, fontSize: 17, color: colors.proInk, textTransform: 'capitalize' },
  hero: { backgroundColor: colors.proInk, borderRadius: 20, padding: 22, marginTop: 6 },
  heroLabel: { fontFamily: font.medium, fontSize: 13, color: '#aeb6c6' },
  heroValue: { fontFamily: font.display, fontSize: 34, color: '#fff', letterSpacing: -1, marginTop: 6 },
  heroSub: { fontFamily: font.body, fontSize: 13, color: '#aeb6c6', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  cell: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  cellValue: { fontFamily: font.displaySemi, fontSize: 19, color: colors.proInk },
  cellLabel: { fontFamily: font.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.proInk, borderRadius: 14, paddingVertical: 15, marginTop: 18 },
  exportText: { fontFamily: font.semi, fontSize: 14.5, color: '#fff' },
  note: { fontFamily: font.body, fontSize: 12, color: colors.muted, marginTop: 12, lineHeight: 18, textAlign: 'center' },
});
