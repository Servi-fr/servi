import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme/colors';
import { STATUS_LABEL, type BookingStatus } from '../lib/api';

const STYLES: Record<BookingStatus, { bg: string; fg: string }> = {
  PENDING: { bg: colors.warnBg, fg: colors.warn },
  CONFIRMED: { bg: colors.chip, fg: colors.link },
  COMPLETED: { bg: colors.okBg, fg: colors.okText },
  CANCELLED: { bg: '#f3f4f6', fg: colors.muted },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const st = STYLES[status] ?? STYLES.PENDING;
  return (
    <View style={[s.badge, { backgroundColor: st.bg }]}>
      <Text style={[s.text, { color: st.fg }]}>{STATUS_LABEL[status] ?? status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontFamily: font.semi, fontSize: 12 },
});
