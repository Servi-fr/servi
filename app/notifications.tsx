import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { getNotifications, markAllNotificationsRead, formatDate, type Notif } from '../lib/api';

export default function Notifications() {
  const router = useRouter();
  const [list, setList] = useState<Notif[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getNotifications().then((n) => active && setList(n));
      markAllNotificationsRead();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Notifications" />
      {list === null ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.link} />
        </View>
      ) : list.length === 0 ? (
        <View style={s.empty}>
          <View style={s.iconBox}>
            <Bell size={26} color={colors.link} />
          </View>
          <Text style={s.emptyTitle}>Aucune notification</Text>
          <Text style={s.emptyText}>Les nouvelles demandes et mises à jour de réservation apparaîtront ici.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {list.map((n) => (
            <Pressable key={n.id} style={[s.card, !n.read && s.unread]} onPress={() => n.link && router.push(n.link)}>
              <View style={s.dotCol}>{!n.read && <View style={s.dot} />}</View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{n.title}</Text>
                {n.message ? <Text style={s.msg}>{n.message}</Text> : null}
                <Text style={s.time}>{formatDate(n.createdAt)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, gap: 10 },
  card: { flexDirection: 'row', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 },
  unread: { borderColor: colors.line3, backgroundColor: '#fbfcff' },
  dotCol: { width: 10, alignItems: 'center', paddingTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue },
  title: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  msg: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, marginTop: 3, lineHeight: 19 },
  time: { fontFamily: font.medium, fontSize: 12, color: colors.faint, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 19, color: colors.ink, marginBottom: 8 },
  emptyText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
