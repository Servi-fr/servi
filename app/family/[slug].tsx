import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, font } from '../../theme/colors';
import { getFamily, familyCategories } from '../../lib/data';

export default function FamilyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const family = getFamily(slug);
  const cats = familyCategories(slug);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={family?.name ?? 'Famille'} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.lead}>{family?.tagline ?? 'Choisissez un service.'}</Text>

        <View style={{ gap: 12, marginTop: 16 }}>
          {cats.map((c) => (
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
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16 },
  iconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: font.semi, fontSize: 16, color: colors.ink },
  desc: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontFamily: font.semi, fontSize: 13, color: colors.ink, marginBottom: 4 },
});
