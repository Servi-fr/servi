import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Alert, Modal, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CalendarDays, CalendarPlus, User, Check, X, MessageCircle, Star, Briefcase, MapPin, FileText, Truck, Hammer, ImagePlus, Navigation, Flag } from 'lucide-react-native';
import { addToCalendar } from '../../lib/calendar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { BookingTimeline } from '../../components/BookingTimeline';
import { SignaturePad, SignatureView } from '../../components/SignaturePad';
import { colors, font } from '../../theme/colors';
import {
  getBookingById,
  getBookingTimeline,
  getUid,
  updateBookingStatus,
  setBookingPhase,
  completeBookingWithProof,
  uploadProofPhoto,
  createReview,
  getUserRating,
  createBillingDoc,
  getMyProfile,
  getMyProviderProfile,
  formatDate,
  type BookingRow,
  type BookingStatus,
  type BookingEventRow,
} from '../../lib/api';
import { generateBillingPdf } from '../../lib/invoice';
import { payTip } from '../../lib/payments';
import { config } from '../../lib/config';

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

  // Timeline + fin de mission (photos + signature)
  const [events, setEvents] = useState<BookingEventRow[]>([]);
  const [finishOpen, setFinishOpen] = useState(false);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [tipping, setTipping] = useState(false);

  async function load() {
    const [bk, u, ev] = await Promise.all([getBookingById(id), getUid(), getBookingTimeline(id)]);
    setB(bk);
    setUid(u);
    setEvents(ev);
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
  const total = b.price;

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
    const total = b.price;
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
      bookingId: b.id, // → génération serveur PDF/A-3 (repli local si indisponible)
      date: formatDate(b.date),
      issueDateISO: b.date,
      prestataireName: prof?.name ?? 'Prestataire',
      prestataireSiret: prov?.siret ?? null,
      prestataireEmail: prof?.email ?? null,
      prestatairePhone: prof?.phone ?? null,
      prestataireAddress: prof?.address ?? prov?.zone ?? null,
      clientName,
      clientEmail: b.client?.email ?? null,
      clientPhone: b.client?.phone ?? null,
      clientAddress: b.client?.address ?? null,
      interventionAddress: b.address ?? null,
      service: b.service,
      total,
    });
    setBusy(false);
    if (!r.ok) {
      Alert.alert('Document', "La génération du PDF a échoué.");
    } else if (type === 'facture') {
      const detail = r.pdfa
        ? '\n\nPDF/A-3 + Factur-X (EN 16931) — généré par le serveur SERVI.'
        : r.facturx
          ? '\n\nFormat Factur-X inclus (version provisoire générée sur l\'appareil).'
          : '';
      Alert.alert('Facture', `Facture ${rec.number} générée ✓${detail}`);
    } else {
      Alert.alert('Devis', `Devis ${rec.number} généré ✓${r.pdfa ? '\n\nPDF/A-3 — généré par le serveur SERVI.' : ''}`);
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

  // Ouvre le GPS du téléphone avec l'itinéraire vers le lieu d'intervention.
  function openGps() {
    const addr = b?.address;
    if (!addr) {
      Alert.alert('GPS', "Aucune adresse d'intervention n'est renseignée sur cette réservation.");
      return;
    }
    const dest = encodeURIComponent(addr);
    const url = Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${dest}&dirflg=d` : `google.navigation:q=${dest}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`).catch(() => {
        Alert.alert('GPS', "Impossible d'ouvrir l'application de navigation.");
      });
    });
  }

  // Avancement de mission (prestataire) : en route → arrivé → travaux en cours.
  // Le trigger en base journalise l'événement et prévient le client (notif + push).
  async function advancePhase(phase: 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS') {
    if (!b) return;
    setBusy(true);
    const r = await setBookingPhase(b.id, phase);
    setBusy(false);
    if (!r.ok) {
      Alert.alert(
        'Action impossible',
        r.error === 'session-expiree'
          ? 'Votre session a expiré : déconnectez-vous puis reconnectez-vous, et réessayez.'
          : `Le statut n'a pas pu être mis à jour.\n\n(${r.error ?? 'erreur inconnue'})`,
      );
      return;
    }
    await load();
    // En route + adresse connue → on propose de lancer la navigation.
    if (phase === 'EN_ROUTE' && b.address) {
      Alert.alert('En route', 'Le client a été prévenu. Lancer le GPS vers le lieu d\'intervention ?', [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Lancer le GPS', onPress: openGps },
      ]);
    }
  }

  async function addProofPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', "Autorisez l'accès aux photos pour ajouter une preuve.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (res.canceled || !res.assets?.[0] || !b) return;
    setAddingPhoto(true);
    const up = await uploadProofPhoto(res.assets[0].uri, b.id);
    setAddingPhoto(false);
    if (up.ok && up.url) setProofPhotos((cur) => [...cur, up.url!]);
    else Alert.alert('Photo', "La photo n'a pas pu être envoyée.");
  }

  // Pourboire (client, après mission) : 100 % pour le prestataire.
  async function sendTip(amount: number) {
    if (!b || tipping) return;
    setTipping(true);
    const r = await payTip(b.id, amount);
    setTipping(false);
    if (!r.ok) {
      if (r.error) Alert.alert('Pourboire', `Le paiement n'a pas abouti.\n\n(${r.error})`);
      return; // annulation utilisateur : silencieux
    }
    Alert.alert('Merci', `Votre pourboire de ${amount} € a été envoyé — il revient à 100 % à ${otherName?.split(' ')[0] ?? 'votre prestataire'}.`);
    // Le webhook Stripe enregistre le pourboire côté serveur → petit délai avant refresh.
    setTimeout(() => load(), 4000);
  }

  async function finishMission() {
    if (!b || busy) return;
    const doFinish = async () => {
      setBusy(true);
      const r = await completeBookingWithProof({ id: b.id, photos: proofPhotos, signature });
      setBusy(false);
      if (!r.ok) {
        Alert.alert(
          'Fin de mission',
          r.error === 'session-expiree'
            ? 'Votre session a expiré : déconnectez-vous puis reconnectez-vous, et réessayez.'
            : `La clôture a échoué.\n\n(${r.error ?? 'erreur inconnue'})`,
        );
        return;
      }
      setFinishOpen(false);
      Alert.alert('Mission terminée', 'Le client a été prévenu. Vous pouvez générer la facture depuis cette page.');
      await load();
    };
    if (!signature) {
      Alert.alert('Sans signature ?', 'Le client n\'a pas signé. Terminer quand même ?', [
        { text: 'Retour', style: 'cancel' },
        { text: 'Terminer sans signature', onPress: doFinish },
      ]);
      return;
    }
    await doFinish();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Réservation" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <Text style={s.service}>{b.service}</Text>
          <StatusBadge status={b.status} />
        </View>

        {/* Suivi de mission (façon Uber) */}
        <View style={{ marginBottom: 14 }}>
          <BookingTimeline booking={b} events={events} />
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
        {/* Avancement de mission (prestataire) : en route → en cours → fin avec preuves */}
        {amPro && b.status === 'CONFIRMED' && !b.phase && (
          <>
            <Pressable style={s.btnDarkFull} disabled={busy} onPress={() => advancePhase('EN_ROUTE')}>
              <Truck size={17} color="#fff" />
              <Text style={s.btnDarkText}>Je suis en route</Text>
            </Pressable>
            <Pressable onPress={() => setFinishOpen(true)} hitSlop={8}>
              <Text style={s.skipLink}>Passer directement à la fin de mission</Text>
            </Pressable>
          </>
        )}
        {amPro && b.status === 'CONFIRMED' && b.phase === 'EN_ROUTE' && (
          <>
            <Pressable style={s.secondary} onPress={openGps}>
              <Navigation size={18} color={colors.link} />
              <Text style={s.secondaryText}>Lancer le GPS</Text>
            </Pressable>
            <Pressable style={s.btnDarkFull} disabled={busy} onPress={() => advancePhase('ARRIVED')}>
              <Flag size={17} color="#fff" />
              <Text style={s.btnDarkText}>Je suis arrivé</Text>
            </Pressable>
          </>
        )}
        {amPro && b.status === 'CONFIRMED' && b.phase === 'ARRIVED' && (
          <Pressable style={s.btnDarkFull} disabled={busy} onPress={() => advancePhase('IN_PROGRESS')}>
            <Hammer size={17} color="#fff" />
            <Text style={s.btnDarkText}>Commencer les travaux</Text>
          </Pressable>
        )}
        {amPro && b.status === 'CONFIRMED' && b.phase === 'IN_PROGRESS' && (
          <Pressable style={s.btnDarkFull} disabled={busy} onPress={() => setFinishOpen(true)}>
            <Check size={17} color="#fff" />
            <Text style={s.btnDarkText}>Terminer la prestation</Text>
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

        {/* Preuves de fin de mission (photos + signature) */}
        {b.status === 'COMPLETED' && ((b.proofPhotos?.length ?? 0) > 0 || !!b.signature) && (
          <View style={s.proofBox}>
            <Text style={s.proofTitle}>Fin de mission</Text>
            {(b.proofPhotos?.length ?? 0) > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.proofRow}>
                {b.proofPhotos!.map((url) => (
                  <Image key={url} source={{ uri: url }} style={s.proofImg} accessibilityLabel="Photo de fin de mission" />
                ))}
              </ScrollView>
            )}
            {!!b.signature && (
              <>
                <Text style={s.proofLabel}>
                  Signé par le client{b.signedAt ? ` le ${formatDate(b.signedAt)}` : ''}
                </Text>
                <SignatureView json={b.signature} height={110} />
              </>
            )}
          </View>
        )}

        {/* Pourboire (client) — optionnel, jamais culpabilisant, 100 % prestataire */}
        {amClient && b.status === 'COMPLETED' && config.paymentsEnabled && !b.tipAmount && (
          <View style={s.tipBox}>
            <Text style={s.tipTitle}>Un pourboire, si jamais ?</Text>
            <Text style={s.tipSub}>
              Optionnel — il revient à 100 % à {otherName?.split(' ')[0] ?? 'votre prestataire'}, sans commission.
            </Text>
            <View style={s.tipRow}>
              {[2, 5, 10].map((amount) => (
                <Pressable
                  key={amount}
                  style={[s.tipChip, tipping && { opacity: 0.5 }]}
                  disabled={tipping}
                  onPress={() => sendTip(amount)}
                  accessibilityRole="button"
                  accessibilityLabel={`Donner ${amount} euros de pourboire`}
                >
                  <Text style={s.tipChipText}>{amount} €</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {b.status === 'COMPLETED' && !!b.tipAmount && (
          <View style={s.tipDone}>
            <Text style={s.tipDoneText}>
              {amClient ? `Pourboire envoyé : ${b.tipAmount} €` : `Pourboire reçu : ${b.tipAmount} €`}
            </Text>
          </View>
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

      {/* Fin de mission : photos + signature du client, sur l'appareil du prestataire */}
      <Modal visible={finishOpen} animationType="slide" transparent onRequestClose={() => setFinishOpen(false)}>
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Fin de mission</Text>
            <Text style={s.modalSub}>Ajoutez des photos du travail réalisé (optionnel), puis faites signer votre client.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.proofRow}>
              {proofPhotos.map((url) => (
                <Image key={url} source={{ uri: url }} style={s.proofImg} />
              ))}
              <Pressable
                style={s.proofAdd}
                onPress={addProofPhoto}
                disabled={addingPhoto}
                accessibilityRole="button"
                accessibilityLabel="Ajouter une photo de fin de mission"
              >
                {addingPhoto ? <ActivityIndicator color={colors.link} /> : <ImagePlus size={22} color={colors.faint} />}
              </Pressable>
            </ScrollView>

            <Text style={s.proofLabel}>Signature du client</Text>
            <SignaturePad onChange={setSignature} />

            <Pressable style={[s.btnDarkFull, busy && { opacity: 0.6 }]} disabled={busy} onPress={finishMission}>
              {busy ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Check size={17} color="#fff" />
                  <Text style={s.btnDarkText}>Valider la fin de mission</Text>
                </>
              )}
            </Pressable>
            <Pressable onPress={() => setFinishOpen(false)} hitSlop={8}>
              <Text style={s.modalBack}>Retour</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

  skipLink: { fontFamily: font.medium, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },

  proofBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, marginTop: 16 },
  proofTitle: { fontFamily: font.displaySemi, fontSize: 16, color: colors.ink, marginBottom: 10 },
  proofLabel: { fontFamily: font.semi, fontSize: 13, color: colors.muted, marginTop: 10, marginBottom: 8 },
  proofRow: { gap: 10, paddingVertical: 2 },
  proofImg: { width: 84, height: 84, borderRadius: 12, backgroundColor: colors.bg },
  proofAdd: { width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: colors.line3, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },

  tipBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginTop: 16 },
  tipTitle: { fontFamily: font.displaySemi, fontSize: 16, color: colors.ink },
  tipSub: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
  tipRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tipChip: { flex: 1, paddingVertical: 13, borderRadius: 13, backgroundColor: colors.chip, alignItems: 'center' },
  tipChipText: { fontFamily: font.semi, fontSize: 15, color: colors.link },
  tipDone: { backgroundColor: colors.okBg, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  tipDoneText: { fontFamily: font.semi, fontSize: 14, color: colors.okText },

  modalWrap: { flex: 1, backgroundColor: 'rgba(13,18,32,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  modalTitle: { fontFamily: font.display, fontSize: 21, color: colors.ink, letterSpacing: -0.4 },
  modalSub: { fontFamily: font.body, fontSize: 13.5, color: colors.muted, marginTop: 6, marginBottom: 14, lineHeight: 19 },
  modalBack: { fontFamily: font.semi, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 14 },
});
