import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { getLegalDoc } from '../../lib/legal';

export default function LegalDocScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = getLegalDoc(doc);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={d?.title ?? 'Légal'} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {!d ? (
          <Text style={s.para}>Document introuvable.</Text>
        ) : (
          <>
            <Text style={s.updated}>Mis à jour : {d.updated}</Text>
            {d.body.split('\n\n').map((para, i) => (
              <Text key={i} style={s.para}>
                {para}
              </Text>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 36 },
  updated: { fontFamily: font.medium, fontSize: 12.5, color: colors.muted, marginBottom: 16 },
  para: { fontFamily: font.body, fontSize: 14.5, color: colors.ink, lineHeight: 22, marginBottom: 14 },
});
