import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, font } from '../theme/colors';

// En-tête avec bouton retour, réutilisé sur les écrans empilés (Stack).
export function ScreenHeader({ title, dark = false }: { title?: string; dark?: boolean }) {
  const router = useRouter();
  const fg = dark ? '#fff' : colors.ink;
  return (
    <View style={s.row}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityLabel="Retour"
        accessibilityRole="button"
        style={[
          s.btn,
          {
            backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.surface,
            borderColor: dark ? 'rgba(255,255,255,0.14)' : colors.line3,
          },
        ]}
      >
        <ChevronLeft size={22} color={fg} />
      </Pressable>
      {title ? (
        <Text style={[s.title, { color: fg }]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View />
      )}
      <View style={{ width: 40 }} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontFamily: font.displaySemi, fontSize: 17, marginHorizontal: 8 },
});
