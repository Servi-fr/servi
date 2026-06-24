import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessageCircle, ChevronRight } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { initials } from '../../lib/data';
import { getMyBookings, getProBookings, STATUS_LABEL, type BookingStatus } from '../../lib/api';

type Conv = { bookingId: string; name: string; service: string; status: BookingStatus };

export default function Messages() {
  const router = useRouter();
  const [convs, setConvs] = useState<Conv[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getMyBookings(), getProBookings()]).then(([mine, pro]) => {
        if (!active) return;
        const list: Conv[] = [
          ...mine.map((b) => ({ bookingId: b.id, name: b.prestataire?.name ?? 'Prestataire', service: b.service, status: b.status })),
          ...pro.map((b) => ({ bookingId: b.id, name: b.client?.name ?? 'Client', service: b.service, status: b.status })),
        ];
        setConvs(list);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.h1}>Messages</Text>
      </View>
      {convs === null ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.link} />
        </View>
      ) : convs.length === 0 ? (
        <View style={s.empty}>
          <View style={s.iconBox}>
            <MessageCircle size={26} color={colors.link} />
          </View>
          <Text style={s.title}>Aucune conversation</Text>
          <Text style={s.text}>
            Vos échanges avec les prestataires apparaîtront ici après votre première réservation.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {convs.map((c) => (
            <Pressable key={c.bookingId} style={s.row} onPress={() => router.push(`/chat/${c.bookingId}`)}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials(c.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{c.name}</Text>
                <Text style={s.sub} numberOfLines={1}>
                  {c.service} · {STATUS_LABEL[c.status]}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.faint} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.display, fontSize: 15, color: colors.link },
  name: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: font.displaySemi, fontSize: 19, color: colors.ink, marginBottom: 8 },
  text: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
