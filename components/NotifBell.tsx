import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { colors, font } from '../theme/colors';
import { getUnreadCount } from '../lib/api';

export function NotifBell({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUnreadCount().then((c) => active && setCount(c));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={s.wrap} accessibilityLabel="Notifications" accessibilityRole="button">
      <Bell size={22} color={dark ? '#fff' : colors.ink} />
      {count > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#fff', fontFamily: font.bold, fontSize: 10 },
});
