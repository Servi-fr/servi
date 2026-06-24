import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Clock, MapPin, Check, X, Inbox } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { proRequests, initials, type BookingRequest } from '../../lib/data';

type Status = 'pending' | 'accepted' | 'refused';

export default function ProDemandes() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const setStatus = (id: string, st: Status) => setStatuses((prev) => ({ ...prev, [id]: st }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.head}>
        <Text style={s.h1}>Demandes</Text>
        <Text style={s.lead}>Acceptez ou refusez les nouvelles réservations.</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {proRequests.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Inbox size={26} color={colors.proInk} />
            </View>
            <Text style={s.emptyTitle}>Aucune demande</Text>
            <Text style={s.emptyText}>Les nouvelles réservations apparaîtront ici.</Text>
          </View>
        ) : (
          proRequests.map((r) => <RequestCard key={r.id} req={r} status={statuses[r.id] ?? 'pending'} onSet={setStatus} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({
  req,
  status,
  onSet,
}: {
  req: BookingRequest;
  status: Status;
  onSet: (id: string, st: Status) => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials(req.client)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.client}>{req.client}</Text>
          <Text style={s.service}>{req.service}</Text>
        </View>
        <Text style={s.price}>{req.price} €</Text>
      </View>

      <View style={s.meta}>
        <View style={s.metaItem}>
          <CalendarDays size={14} color={colors.muted} />
          <Text style={s.metaText}>{req.date}</Text>
        </View>
        <View style={s.metaItem}>
          <Clock size={14} color={colors.muted} />
          <Text style={s.metaText}>{req.time}</Text>
        </View>
        <View style={s.metaItem}>
          <MapPin size={14} color={colors.muted} />
          <Text style={s.metaText}>{req.city}</Text>
        </View>
      </View>

      {status === 'pending' ? (
        <View style={s.actions}>
          <Pressable style={s.refuse} onPress={() => onSet(req.id, 'refused')}>
            <X size={17} color={colors.muted} />
            <Text style={s.refuseText}>Refuser</Text>
          </Pressable>
          <Pressable style={s.accept} onPress={() => onSet(req.id, 'accepted')}>
            <Check size={17} color="#fff" />
            <Text style={s.acceptText}>Accepter</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[s.badge, status === 'accepted' ? s.badgeOk : s.badgeNo]}>
          <Text style={[s.badgeText, status === 'accepted' ? s.badgeTextOk : s.badgeTextNo]}>
            {status === 'accepted' ? '✓ Acceptée — ajoutée au planning' : 'Demande refusée'}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 20, paddingTop: 8 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.proInk, letterSpacing: -0.5 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 6 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 12 },

  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.display, fontSize: 15, color: colors.proInk },
  client: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  service: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, marginTop: 1 },
  price: { fontFamily: font.display, fontSize: 18, color: colors.proInk },

  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14, marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: font.medium, fontSize: 13, color: colors.muted },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  refuse: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.line3 },
  refuseText: { fontFamily: font.semi, fontSize: 14.5, color: colors.muted },
  accept: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 13, backgroundColor: colors.proInk },
  acceptText: { fontFamily: font.semi, fontSize: 14.5, color: '#fff' },

  badge: { marginTop: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  badgeOk: { backgroundColor: colors.okBg },
  badgeNo: { backgroundColor: '#f3f4f6' },
  badgeText: { fontFamily: font.semi, fontSize: 13.5 },
  badgeTextOk: { color: colors.okText },
  badgeTextNo: { color: colors.muted },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 18, color: colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center' },
});
