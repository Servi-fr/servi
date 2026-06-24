import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, CalendarDays, Clock, User } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';

export default function ReservationSuccess() {
  const router = useRouter();
  const { provider, service, date, time, total } = useLocalSearchParams<{
    provider: string;
    service: string;
    date: string;
    time: string;
    total: string;
  }>();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.badge}>
          <Check size={40} color="#fff" strokeWidth={3} />
        </View>
        <Text style={s.title}>Réservation confirmée</Text>
        <Text style={s.sub}>
          Votre demande a été envoyée à {provider}. Vous recevrez une confirmation dès qu'elle l'accepte.
        </Text>

        <View style={s.card}>
          <Line Icon={User} label="Prestataire" value={String(provider ?? '')} />
          <View style={s.divider} />
          <Line Icon={Check} label="Prestation" value={String(service ?? '')} />
          <View style={s.divider} />
          <Line Icon={CalendarDays} label="Date" value={String(date ?? '')} />
          <View style={s.divider} />
          <Line Icon={Clock} label="Créneau" value={String(time ?? '')} />
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{total} €</Text>
          </View>
        </View>
      </View>

      <View style={s.footer}>
        <Pressable style={s.primary} onPress={() => router.replace('/(tabs)')}>
          <Text style={s.primaryText}>Retour à l'accueil</Text>
        </Pressable>
        <Pressable style={s.secondary} onPress={() => router.replace('/(tabs)/messages')}>
          <Text style={s.secondaryText}>Voir mes messages</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Line({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={s.line}>
      <View style={s.lineIcon}>
        <Icon size={16} color={colors.link} />
      </View>
      <Text style={s.lineLabel}>{label}</Text>
      <Text style={s.lineValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  badge: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.ok, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { fontFamily: font.display, fontSize: 26, color: colors.ink, letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontFamily: font.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  card: { alignSelf: 'stretch', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18, marginTop: 26 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  lineIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  lineLabel: { fontFamily: font.body, fontSize: 13.5, color: colors.muted },
  lineValue: { flex: 1, textAlign: 'right', fontFamily: font.semi, fontSize: 14, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  totalLabel: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  totalValue: { fontFamily: font.display, fontSize: 20, color: colors.ink },
  footer: { paddingHorizontal: 20, paddingBottom: 28, gap: 10 },
  primary: { backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
  secondary: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: colors.link, fontFamily: font.semi, fontSize: 15 },
});
