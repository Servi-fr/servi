import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme/colors';
import type { BookingEventRow, BookingRow } from '../lib/api';

// Timeline « façon Uber » : demande → acceptée → en route → en cours → terminée.
// Les horodatages viennent du journal d'événements (BookingEvent) quand il existe.

type StepKey = 'CREATED' | 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'STARTED' | 'COMPLETED';
const STEPS: { key: StepKey; label: string }[] = [
  { key: 'CREATED', label: 'Demande envoyée' },
  { key: 'ACCEPTED', label: 'Acceptée par le prestataire' },
  { key: 'EN_ROUTE', label: 'Prestataire en route' },
  { key: 'ARRIVED', label: 'Arrivé sur place' },
  { key: 'STARTED', label: 'Travaux en cours' },
  { key: 'COMPLETED', label: 'Terminée' },
];

function when(events: BookingEventRow[], key: StepKey): string | null {
  const e = events.find((ev) => ev.type === key);
  if (!e) return null;
  const d = new Date(e.createdAt);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ` · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function BookingTimeline({ booking, events }: { booking: BookingRow; events: BookingEventRow[] }) {
  if (booking.status === 'CANCELLED') {
    return (
      <View style={s.cancelBox}>
        <Text style={s.cancelText}>Réservation annulée</Text>
      </View>
    );
  }

  // Index de progression selon statut + phase.
  const reached =
    booking.status === 'COMPLETED' ? 5
    : booking.phase === 'IN_PROGRESS' ? 4
    : booking.phase === 'ARRIVED' ? 3
    : booking.phase === 'EN_ROUTE' ? 2
    : booking.status === 'CONFIRMED' ? 1
    : 0;

  return (
    <View style={s.box}>
      {STEPS.map((step, i) => {
        const done = i <= reached;
        const isCurrent = i === reached && booking.status !== 'COMPLETED';
        const ts = when(events, step.key);
        return (
          <View key={step.key} style={s.row}>
            <View style={s.rail}>
              <View style={[s.dot, done && s.dotOn, isCurrent && s.dotCurrent]} />
              {i < STEPS.length - 1 && <View style={[s.line, i < reached && s.lineOn]} />}
            </View>
            <View style={[s.content, i < STEPS.length - 1 && s.contentGap]}>
              <Text style={[s.label, done ? s.labelOn : null, isCurrent ? s.labelCurrent : null]}>
                {step.label}
                {isCurrent ? '…' : ''}
              </Text>
              {done && ts ? <Text style={s.time}>{ts}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row' },
  rail: { alignItems: 'center', width: 22 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.line3, marginTop: 3 },
  dotOn: { backgroundColor: colors.blue },
  dotCurrent: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.chip, backgroundColor: colors.blue, marginTop: 2 },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 3 },
  lineOn: { backgroundColor: colors.blue },
  content: { flex: 1, marginLeft: 10 },
  contentGap: { paddingBottom: 18 },
  label: { fontFamily: font.medium, fontSize: 14, color: colors.faint },
  labelOn: { color: colors.ink, fontFamily: font.semi },
  labelCurrent: { color: colors.blue },
  time: { fontFamily: font.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  cancelBox: { backgroundColor: '#f3f4f6', borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { fontFamily: font.semi, fontSize: 14, color: colors.muted },
});
