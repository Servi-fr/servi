import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';
import { families, familyCategories } from '../../lib/data';

export default function Services() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.h1}>Nos services</Text>
        <Text style={s.lead}>Parcourez par famille et trouvez un prestataire vérifié.</Text>

        {families.map((f) => (
          <View key={f.slug} style={{ marginTop: 22 }}>
            <View style={s.familyHead}>
              <View style={s.familyIcon}>
                <f.Icon size={17} color={colors.link} />
              </View>
              <Text style={s.familyName}>{f.name}</Text>
            </View>
            <View style={{ gap: 12 }}>
              {familyCategories(f.slug).map((c) => (
                <Pressable key={c.slug} style={s.row} onPress={() => router.push(`/category/${c.slug}`)}>
                  <View style={s.iconBox}>
                    <c.Icon size={24} color={colors.link} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{c.name}</Text>
                    <Text style={s.desc}>{c.desc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.price}>dès {c.price} €</Text>
                    <ChevronRight size={18} color={colors.faint} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 21 },
  familyHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  familyIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  familyName: { fontFamily: font.display, fontSize: 18, color: colors.ink, letterSpacing: -0.3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
  },
  iconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  desc: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontFamily: font.semi, fontSize: 13, color: colors.ink, marginBottom: 4 },
});
