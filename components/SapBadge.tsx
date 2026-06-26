import { Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Percent } from 'lucide-react-native';
import { colors, font } from '../theme/colors';

// Pastille "crédit d'impôt −50 %" → ouvre l'écran d'explication.
export function SapBadge({ compact }: { compact?: boolean }) {
  const router = useRouter();
  return (
    <Pressable style={s.badge} onPress={() => router.push('/credit-impot')} hitSlop={6}>
      <Percent size={12} color={colors.okText} />
      <Text style={s.text}>{compact ? '−50 % impôts' : "Crédit d'impôt −50 %"}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.okBg,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: font.semi, fontSize: 12, color: colors.okText },
});
