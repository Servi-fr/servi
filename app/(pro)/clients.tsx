import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { Pressable } from '../../components/motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Users, Phone, ChevronRight } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { initials } from '../../lib/data';
import { getProBookings, getMyManualJobs } from '../../lib/api';

// Carnet clients : TOUS les clients du prestataire (SERVI + hors plateforme),
// agrégés depuis les réservations et les missions perso. CRM léger.

type ClientAgg = {
  name: string;
  phone: string | null;
  missions: number;
  lastDate: Date | null;
  total: number; // montant total des missions terminées
  viaServi: boolean;
};

export default function ProClients() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientAgg[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [bookings, jobs] = await Promise.all([getProBookings(), getMyManualJobs()]);
        if (!active) return;
        const map = new Map<string, ClientAgg>();
        const upsert = (name: string, phone: string | null, date: Date, done: boolean, amount: number, viaServi: boolean) => {
          const key = name.trim().toLowerCase();
          if (!key) return;
          const cur = map.get(key) ?? { name: name.trim(), phone: null, missions: 0, lastDate: null, total: 0, viaServi: false };
          cur.missions += 1;
          if (!cur.lastDate || date > cur.lastDate) cur.lastDate = date;
          if (done) cur.total += amount;
          if (phone) cur.phone = phone;
          if (viaServi) cur.viaServi = true;
          map.set(key, cur);
        };
        bookings
          .filter((b) => b.status !== 'CANCELLED')
          .forEach((b) => upsert(b.client?.name ?? 'Client', null, new Date(b.date), b.status === 'COMPLETED', b.price, true));
        jobs
          .filter((j) => j.status !== 'CANCELLED')
          .forEach((j) => upsert(j.clientName, j.clientPhone ?? null, new Date(j.date), j.status === 'DONE', j.price, false));
        setClients(
          Array.from(map.values()).sort((a, b) => +(b.lastDate ?? 0) - +(a.lastDate ?? 0)),
        );
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  function openClient(c: ClientAgg) {
    const buttons: any[] = [{ text: 'Fermer', style: 'cancel' }];
    if (c.phone) buttons.push({ text: `Appeler ${c.name.split(' ')[0]}`, onPress: () => Linking.openURL(`tel:${c.phone}`) });
    buttons.push({
      text: 'Nouvelle mission',
      onPress: () => router.push({ pathname: '/mission-new', params: { clientName: c.name, clientPhone: c.phone ?? '' } }),
    });
    buttons.push({
      text: 'Nouveau devis / facture',
      onPress: () => router.push({ pathname: '/facture-new', params: { clientName: c.name, clientPhone: c.phone ?? '' } }),
    });
    Alert.alert(c.name, `${c.missions} mission${c.missions > 1 ? 's' : ''} · ${Math.round(c.total)} € facturés`, buttons);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.head}>
        <Text style={s.h1}>Clients</Text>
        <Text style={s.lead}>Tous vos clients — SERVI et hors plateforme.</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {clients === null ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.proInk} />
          </View>
        ) : clients.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Users size={26} color={colors.proInk} />
            </View>
            <Text style={s.emptyTitle}>Aucun client pour l'instant</Text>
            <Text style={s.emptyText}>
              Vos clients apparaîtront ici automatiquement — via vos réservations SERVI ou vos missions perso.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {clients.map((c) => (
              <Pressable key={c.name.toLowerCase()} style={s.card} onPress={() => openClient(c)}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initials(c.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={s.name} numberOfLines={1}>{c.name}</Text>
                    {c.viaServi && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>SERVI</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.meta}>
                    {c.missions} mission{c.missions > 1 ? 's' : ''}
                    {c.total > 0 ? ` · ${Math.round(c.total)} €` : ''}
                    {c.lastDate ? ` · ${c.lastDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                  </Text>
                </View>
                {c.phone ? <Phone size={17} color={colors.muted} /> : null}
                <ChevronRight size={18} color={colors.faint} />
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
  head: { paddingHorizontal: 20, paddingTop: 8 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.proInk, letterSpacing: -0.5 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 6 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  loading: { paddingTop: 60, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 18, color: colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.display, fontSize: 14, color: colors.proInk },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: font.semi, fontSize: 15, color: colors.ink, flexShrink: 1 },
  badge: { backgroundColor: colors.chip, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: font.semi, fontSize: 9.5, color: colors.link },
  meta: { fontFamily: font.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
});
