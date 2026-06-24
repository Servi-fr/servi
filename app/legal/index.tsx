import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, FileText } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { legalDocs } from '../../lib/legal';

export default function LegalIndex() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Légal & confidentialité" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.menu}>
          {legalDocs.map((d, i) => (
            <Pressable key={d.slug} style={[s.row, i > 0 && s.border]} onPress={() => router.push(`/legal/${d.slug}`)}>
              <View style={s.icon}>
                <FileText size={18} color={colors.link} />
              </View>
              <Text style={s.label}>{d.title}</Text>
              <ChevronRight size={18} color={colors.faint} />
            </Pressable>
          ))}
        </View>
        <Text style={s.note}>
          SERVI est édité par Whales Records. Pour toute question : hello@whalesrecords.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  menu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  icon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: font.semi, fontSize: 15, color: colors.ink },
  note: { fontFamily: font.body, fontSize: 12.5, color: colors.faint, textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
