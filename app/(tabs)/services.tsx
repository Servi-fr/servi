import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Sparkles,
  Sprout,
  Wrench,
  Zap,
  Dumbbell,
  GraduationCap,
  Scissors,
  Hammer,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, font } from '../../theme/colors';

const services: { name: string; desc: string; Icon: LucideIcon; price: string }[] = [
  { name: 'Ménage', desc: 'Entretien, grand nettoyage, repassage', Icon: Sparkles, price: '25' },
  { name: 'Jardinage', desc: 'Tonte, taille, plantation', Icon: Sprout, price: '30' },
  { name: 'Plomberie', desc: 'Dépannage, installation', Icon: Wrench, price: '45' },
  { name: 'Électricité', desc: 'Mise aux normes, dépannage', Icon: Zap, price: '50' },
  { name: 'Coaching', desc: 'Sport, bien-être à domicile', Icon: Dumbbell, price: '40' },
  { name: 'Cours particuliers', desc: 'Soutien scolaire, langues', Icon: GraduationCap, price: '28' },
  { name: 'Beauté', desc: 'Coiffure, soins à domicile', Icon: Scissors, price: '35' },
  { name: 'Bricolage', desc: 'Montage, réparations', Icon: Hammer, price: '38' },
];

export default function Services() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.h1}>Nos services</Text>
        <Text style={s.lead}>Choisissez une catégorie pour trouver un prestataire vérifié.</Text>

        <View style={{ marginTop: 18, gap: 12 }}>
          {services.map(({ name, desc, Icon, price }) => (
            <Pressable key={name} style={s.row}>
              <View style={s.iconBox}>
                <Icon size={24} color={colors.link} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{name}</Text>
                <Text style={s.desc}>{desc}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.price}>dès {price} €</Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  h1: { fontFamily: font.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 6, lineHeight: 21 },
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
