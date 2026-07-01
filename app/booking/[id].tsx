import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, CalendarPlus, User, Check, X, MessageCircle, Star, Briefcase, MapPin, FileText } from 'lucide-react-native';
import { addToCalendar } from '../../lib/calendar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { colors, font } from '../../theme/colors';
import {
  getBookingById,
  getUid,
  updateBookingStatus,
  createReview,
  getUserRating,
  createBillingDoc,
  getMyProfile,
  getMyProviderProfile,
  formatDate,
  type BookingRow,
  type BookingStatus,
} from '../../lib/api';
import { generateBillingPdf } from '../../lib/invoice';

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [b, setB] = useState<BookingRow | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Avis
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSent, setReviewSent] = useState(false);
  const [otherRating, setOtherRating] = useState<{ avg: number; count: number } | null>(null);

  async function load() {
    const [bk, u] = await Promise.all([getBookingById(id), getUid()]);
    setB(bk);
    setUid(u);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [id]);
  useEffect(() => {
    if (!b || !uid) return;
    const otherId = b.clientId === uid ? b.prestataireId : b.clientId;
    getUserRating(otherId).then(setOtherRating);
  }, [b, uid]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title="Réservation" />
        <View style={s.center}>
          <ActivityIndicator color={colors.link} />
        </View>
      </SafeAreaView>
    );
  }
  if (!b) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScreenHeader title="Réservation" />
        <View style={s.center}>
          <Text style={s.muted}>Réservation introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const amClient = b.clientId === uid;
  const amPro = b.prestataireId === uid;
  const otherName = amClient ? b.prestataire?.name : b.client?.name;
  const total = b.price + b.commission;

  async function setStatus(status: BookingStatus) {
    if (!b) return;
    setBusy(true);
    const r = await updateBookingStatus(b.id, status);
    setBusy(false);
    if (!r.ok) {
      Alert.alert('Erreur', "L'action a échoué. Réessayez.");
      return;
    }
    setB({ ...b, status });
  }

  // Confirmation avant une action irréversible (règle 8 : confirmer avant l'irréversible).
  function confirmStatus(status: BookingStatus, title: string, message: string, actionLabel: string, destructive = true) {
    Alert.alert(title, message, [
      { text: 'Retour', style: 'cancel' },
      { text: actionLabel, style: destructive ? 'destructive' : 'default', onPress: () => setStatus(status) },
    ]);
  }

  async function genDoc(type: 'devis' | 'facture') {
    if (!b) return;
    setBusy(true);
    const [prof, prov] = await Promise.all([getMyProfile(), getMyProviderProfile()]);
    const total = b.price + b.commission;
    const clientName = b.client?.name ?? otherName ?? 'Client';
    const rec = await createBillingDoc({ type, bookingId: b.id, clientName, service: b.service, total });
    if (!rec.ok || !rec.number) {
      setBusy(false);
      Alert.alert('Document', 'Création impossible. Réessayez.');
      return;
    }
    const r = await generateBillingPdf({
      type,
      number: rec.number,
      date: formatDate(b.date),
      issueDateISO: b.date,
      prestataireName: prof?.name ?? 'Prestataire',
      prestataireSiret: prov?.siret ?? null,
      clientName,
      service: b.service,
      total,
    });
    setBusy(false);
    if (!r.ok) {
      Alert.alert('Document', "La génération du PDF a échoué.");
    } else if (type === 'facture') {
      Alert.alert('Facture', `Facture ${rec.number} générée ✓${r.facturx ? '\n\nFormat Factur-X inclus (facture électronique EN 16931).' : ''}`);
    } else {
      Alert.alert('Devis', `Devis ${rec.number} généré ✓`);
    }
  }

  async function addAgenda() {
    if (!b) return;
    const start = new Date(b.date);
    const end = new Date(start.getTime() + (b.duration || 60) * 60000);
    const r = await addToCalendar({
      title: `SERVI · ${b.service}`,
      start,
      end,
      location: b.address ?? undefined,
      notes: otherName ? `Avec ${otherName}` : undefined,
    });
    if (r.ok) Alert.alert('Agenda', 'Réservation ajoutée à votre agenda ✓');
    else if (r.error === 'permission') Alert.alert('Agenda', "Autorisez l'accès au calendrier dans les réglages.");
    else Alert.alert('Agenda', "Impossible d'ajouter à l'agenda.");
  }

  async function submitReview() {
    if (!b) return;
    setBusy(true);
    const r = await createReview({ bookingId: b.id, toUserId: amClient ? b.prestataireId : b.clientId, rating, comment: comment.trim() });
    setBusy(false);
    if (!r.ok) {
      Alert.alert('Erreur', "L'avis n'a pas pu être envoyé.");
      return;
    }
    setReviewSent(true);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Réservation" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <Text style={s.service}>{b.service}</Text>
          <StatusBadge status={b.status} />
        </View>

        <View style={s.card}>
          <Row
            Icon={amClient ? Briefcase : User}
            label={amClient ? 'Prestataire' : 'Client'}
            value={(otherName ?? '—') + (otherRating ? `   ★ ${otherRating.avg} (${otherRating.count})` : '')}
          />
          <View style={s.divider} />
          <Row Icon={CalendarDays} label="Date" value={formatDate(b.date)} />
          <View style={s.divider} />
          <Row Icon={Briefcase} label="Durée" value={`${b.duration} min`} />
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{total} €</Text>
          </View>
        </View>

        {/* Lieu d'intervention + précisions */}
        {!!b.address && (
          <View style={s.infoBlock}>
            <View style={s.infoHead}>
              <MapPin size={15} color={colors.link} />
              <Text style={s.infoLabel}>Lieu d'intervention</Text>
            </View>
            <Text style={s.infoText}>{b.address}</Text>
          </View>
        )}
        {!!b.notes && (
          <View style={s.infoBlock}>
            <View style={s.infoHead}>
              <MessageCircle size={15} color={colors.link} />
              <Text style={s.infoLabel}>Précisions du client</Text>
            </View>
            <Text style={s.infoText}>{b.notes}</Text>
          </View>
        )}

        {/* Contacter */}
        <Pressable style={s.secondary} onPress={() => router.push(`/chat/${b.id}`)}>
          <MessageCircle size={18} color={colors.link} />
          <Text style={s.secondaryText}>Contacter {otherName?.split(' ')[0] ?? ''}</Text>
        </Pressable>

        {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
          <Pressable style={s.secondary} onPress={addAgenda}>
            <CalendarPlus size={18} color={colors.link} />
            <Text style={s.secondaryText}>Ajouter à mon agenda</Text>
          </Pressable>
        )}

        {amPro && (
          <Pressable style={s.secondary} disabled={busy} onPress={() => genDoc(b.status === 'COMPLETED' ? 'facture' : 'devis')}>
            <FileText size={18} color={colors.link} />
            <Text style={s.secondaryText}>{b.status === 'COMPLETED' ? 'Générer la facture (PDF)' : 'Générer un devis (PDF)'}</Text>
          </Pressable>
        )}

        {/* Actions prestataire */}
        {amPro && b.status === 'PENDING' && (
          <View style={s.actions}>
            <Pressable
              style={[s.btnGhost]}
              disabled={busy}
              onPress={() => confirmStatus('CANCELLED', 'Refuser la demande ?', 'Le client sera informé du refus.', 'Refuser')}
            >
              <X size={17} color={colors.muted} />
              <Text style={s.btnGhostText}>Refuser</Text>
            </Pressable>
            <Pressable style={[s.btnDark]} disabled={busy} onPress={() => setStatus('CONFIRMED')}>
              <Check size={17} color="#fff" />
              <Text style={s.btnDarkText}>Accepter</Text>
            </Pressable>
          </View>
        )}
        {amPro && b.status === 'CONFIRMED' && (
          <Pressable
            style={s.btnDarkFull}
            disabled={busy}
            onPress={() => confirmStatus('COMPLETED', 'Marquer comme terminée ?', 'Cette action confirme que la prestation a bien eu lieu.', 'Terminer', false)}
          >
            <Check size={17} color="#fff" />
            <Text style={s.btnDarkText}>Marquer comme terminée</Text>
          </Pressable>
        )}

        {/* Annulation client */}
        {amClient && (b.status === 'PENDING' || b.status === 'CONFIRMED') && (
          <Pressable
            style={s.cancel}
            disabled={busy}
            onPress={() => confirmStatus('CANCELLED', 'Annuler la réservation ?', 'Cette réservation sera annulée. Cette action est définitive.', 'Annuler la résa')}
          >
            <Text style={s.cancelText}>Annuler la réservation</Text>
          </Pressable>
        )}

        {/* Avis client après prestation terminée */}
        {(amClient || amPro) && b.status === 'COMPLETED' && !reviewSent && (
          <View style={s.reviewBox}>
            <Text style={s.reviewTitle}>{amClient ? 'Votre avis sur le prestataire' : 'Votre avis sur le client'}</Text>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setRating(n)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Noter ${n} étoile${n > 1 ? 's' : ''}`}
                >
                  <Star size={30} color={colors.star} fill={n <= rating ? colors.star : 'transparent'} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Partagez votre expérience…"
              placeholderTextColor={colors.faint}
              multiline
              style={s.textarea}
            />
            <Pressable style={s.btnPrimary} disabled={busy} onPress={submitReview}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>Publier mon avis</Text>}
            </Pressable>
          </View>
        )}
        {reviewSent && (
          <View style={s.thanks}>
            <Check size={18} color={colors.okText} />
            <Text style={s.thanksText}>Merci pour votre avis !</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Icon size={16} color={colors.link} />
      </View>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  muted: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 },
  service: { fontFamily: font.display, fontSize: 24, color: colors.ink, letterSpacing: -0.5, flex: 1 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  rowIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: font.body, fontSize: 13.5, color: colors.muted },
  rowValue: { flex: 1, textAlign: 'right', fontFamily: font.semi, fontSize: 14, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  totalLabel: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  totalValue: { fontFamily: font.display, fontSize: 20, color: colors.ink },

  infoBlock: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginTop: 12 },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  infoLabel: { fontFamily: font.semi, fontSize: 13, color: colors.muted },
  infoText: { fontFamily: font.body, fontSize: 15, color: colors.ink, lineHeight: 21 },

  secondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line3, backgroundColor: colors.surface },
  secondaryText: { fontFamily: font.semi, fontSize: 15, color: colors.link },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnGhost: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 13, borderWidth: 1, borderColor: colors.line3 },
  btnGhostText: { fontFamily: font.semi, fontSize: 14.5, color: colors.muted },
  btnDark: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 13, backgroundColor: colors.proInk },
  btnDarkFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15, borderRadius: 14, backgroundColor: colors.proInk, marginTop: 12 },
  btnDarkText: { fontFamily: font.semi, fontSize: 14.5, color: '#fff' },

  cancel: { marginTop: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontFamily: font.semi, fontSize: 15, color: '#dc2626' },

  reviewBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18, marginTop: 16 },
  reviewTitle: { fontFamily: font.displaySemi, fontSize: 17, color: colors.ink, marginBottom: 12 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  textarea: { minHeight: 80, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, padding: 14, fontFamily: font.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top', marginBottom: 14 },
  btnPrimary: { backgroundColor: colors.blue, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontFamily: font.semi, fontSize: 15 },

  thanks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.okBg },
  thanksText: { fontFamily: font.semi, fontSize: 15, color: colors.okText },
});
