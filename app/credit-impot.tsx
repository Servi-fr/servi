import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Info } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { useBreakpoint, centeredContent } from '../lib/responsive';

const ELIGIBLES = ['Ménage / entretien de la maison', 'Petit jardinage (plafond 5 000 €/an)', 'Cours & soutien scolaire à domicile', 'Petit bricolage (plafond 500 €/an, ≤ 2 h)'];

export default function CreditImpot() {
  const { contentMaxWidth } = useBreakpoint();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Crédit d'impôt" />
      <ScrollView contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.heroBig}>50 %</Text>
          <Text style={s.heroSub}>de crédit d'impôt sur les services éligibles à domicile</Text>
        </View>

        <Text style={s.h2}>Comment ça marche</Text>
        <Text style={s.p}>
          Pour les services à la personne rendus à votre domicile, l'État vous rembourse <Text style={s.b}>50 %</Text> des
          sommes versées, sous forme de <Text style={s.b}>crédit d'impôt</Text>.
        </Text>

        <Text style={s.h2}>Plafonds</Text>
        <View style={s.card}>
          <Row label="Plafond de dépenses" value="12 000 €/an" />
          <Div />
          <Row label="→ crédit maximum" value="6 000 €/an" />
          <Div />
          <Row label="Majoration / enfant à charge" value="+1 500 €" />
          <Div />
          <Row label="Petit jardinage" value="5 000 €/an" />
          <Div />
          <Row label="Petit bricolage (≤ 2 h)" value="500 €/an" />
        </View>

        <Text style={s.h2}>Services SERVI éligibles</Text>
        <View style={s.card}>
          {ELIGIBLES.map((e, i) => (
            <View key={e} style={[s.elig, i > 0 && s.eligBorder]}>
              <Check size={16} color={colors.okText} />
              <Text style={s.eligText}>{e}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Les conditions</Text>
        <View style={s.card}>
          <Bullet text="La prestation est réalisée à votre domicile (résidence principale ou secondaire en France)." />
          <Bullet text="Le prestataire est un organisme « services à la personne » déclaré." />
          <Bullet text="Plomberie, électricité et beauté ne sont pas éligibles (ce ne sont pas des services à la personne)." />
        </View>

        <Text style={s.h2}>Deux façons d'en profiter</Text>
        <View style={s.card}>
          <Text style={s.way}>1. Attestation annuelle</Text>
          <Text style={s.wayP}>SERVI vous fournit une attestation récapitulant vos dépenses ; vous la reportez en case 7DB de votre déclaration et récupérez 50 % l'année suivante.</Text>
          <Div />
          <Text style={s.way}>2. Avance immédiate <Text style={s.soon}>bientôt</Text></Text>
          <Text style={s.wayP}>Vous ne payez que 50 % tout de suite, l'autre moitié est avancée par l'État (service URSSAF). En cours de mise en place.</Text>
        </View>

        <View style={s.note}>
          <Info size={15} color={colors.muted} />
          <Text style={s.noteText}>
            Estimation à titre indicatif. Le droit au crédit d'impôt dépend de votre situation et du statut déclaré du
            prestataire. Renseignez-vous sur service-public.fr.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}
function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bullet}>
      <View style={s.dot} />
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}
const Div = () => <View style={s.divider} />;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  hero: { backgroundColor: colors.okBg, borderRadius: 20, padding: 22, alignItems: 'center', marginTop: 4 },
  heroBig: { fontFamily: font.display, fontSize: 46, color: colors.okText, letterSpacing: -1 },
  heroSub: { fontFamily: font.medium, fontSize: 14, color: colors.okText, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  h2: { fontFamily: font.display, fontSize: 19, color: colors.ink, letterSpacing: -0.3, marginTop: 26, marginBottom: 12 },
  p: { fontFamily: font.body, fontSize: 15, color: colors.muted, lineHeight: 22 },
  b: { fontFamily: font.semi, color: colors.ink },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  rowLabel: { fontFamily: font.body, fontSize: 14, color: colors.muted, flex: 1 },
  rowValue: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 6 },
  elig: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  eligBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  eligText: { fontFamily: font.medium, fontSize: 14.5, color: colors.ink, flex: 1 },
  bullet: { flexDirection: 'row', gap: 10, paddingVertical: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.link, marginTop: 7 },
  bulletText: { fontFamily: font.body, fontSize: 14, color: colors.muted, flex: 1, lineHeight: 21 },
  way: { fontFamily: font.semi, fontSize: 15, color: colors.ink, marginBottom: 4 },
  wayP: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, lineHeight: 20 },
  soon: { fontFamily: font.semi, fontSize: 11, color: colors.link },
  note: { flexDirection: 'row', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, marginTop: 22 },
  noteText: { fontFamily: font.body, fontSize: 12.5, color: colors.muted, flex: 1, lineHeight: 19 },
});
