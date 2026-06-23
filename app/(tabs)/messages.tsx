import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';

export default function Messages() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.h1}>Messages</Text>
      </View>
      <View style={s.empty}>
        <View style={s.iconBox}>
          <MessageCircle size={26} color={colors.link} />
        </View>
        <Text style={s.title}>Aucune conversation</Text>
        <Text style={s.text}>
          Vos échanges avec les prestataires apparaîtront ici après votre première réservation.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: font.displaySemi, fontSize: 19, color: colors.ink, marginBottom: 8 },
  text: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
