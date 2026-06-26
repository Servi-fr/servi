import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { categories } from '../lib/data';
import { getMyProviderProfile, upsertMyProviderProfile, uploadProviderLogo } from '../lib/api';
import { searchCompany, type CompanyResult } from '../lib/company';

export default function DevenirPrestataire() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [service, setService] = useState(categories[0].name);
  const [rate, setRate] = useState('');
  const [zone, setZone] = useState('');
  const [radius, setRadius] = useState(10);
  const [certifications, setCertifications] = useState('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [siret, setSiret] = useState('');
  const [coResults, setCoResults] = useState<CompanyResult[]>([]);
  const [searchingCo, setSearchingCo] = useState(false);
  const [logo, setLogo] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    getMyProviderProfile().then((p) => {
      if (p) {
        setEditing(true);
        setService(p.service);
        setRate(String(p.hourlyRate ?? ''));
        setZone(p.zone ?? '');
        setRadius(p.radiusKm ?? 10);
        setCertifications(p.certifications ?? '');
        setDescription(p.description ?? '');
        if (p.siret) setSiret(p.siret);
        if (p.logo) setLogo(p.logo);
      }
      setLoading(false);
    });
  }, []);

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', "Autorisez l'accès aux photos pour ajouter un logo.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setUploadingLogo(true);
    const up = await uploadProviderLogo(res.assets[0].uri);
    setUploadingLogo(false);
    if (up.ok && up.url) setLogo(up.url);
    else Alert.alert('Erreur', "Le logo n'a pas pu être envoyé.");
  }

  // Recherche d'entreprise (SIRET ou nom) via l'API gouv → auto-remplit.
  useEffect(() => {
    if (siret) return;
    const q = company.trim();
    if (q.length < 3) {
      setCoResults([]);
      return;
    }
    setSearchingCo(true);
    const t = setTimeout(async () => {
      setCoResults(await searchCompany(q));
      setSearchingCo(false);
    }, 400);
    return () => clearTimeout(t);
  }, [company, siret]);

  function pickCompany(c: CompanyResult) {
    setSiret(c.siret);
    setCompany(c.name);
    setCoResults([]);
    if (c.city && zone.trim().length < 2) setZone(c.city);
  }

  const rateNum = parseInt(rate, 10);
  const ready = service.length > 0 && rateNum > 0 && zone.trim().length > 1;

  async function save() {
    if (!ready) return;
    setSaving(true);
    const r = await upsertMyProviderProfile({
      service,
      hourlyRate: rateNum,
      description,
      zone: zone.trim(),
      radiusKm: radius,
      certifications: certifications.trim(),
      siret: siret || undefined,
      logo: logo || undefined,
    });
    setSaving(false);
    if (!r.ok) {
      Alert.alert('Erreur', "Impossible d'enregistrer le profil prestataire.");
      return;
    }
    router.replace('/(pro)/dashboard');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title={editing ? 'Mon activité' : 'Devenir prestataire'} dark />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.proInk} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {!editing && (
              <Text style={s.intro}>
                Proposez vos services sur SERVI : définissez votre métier, votre tarif et votre zone. Vous
                recevrez ensuite des demandes de réservation.
              </Text>
            )}

            <Text style={s.label}>Logo / photo de l'entreprise</Text>
            <Pressable style={s.logoPick} onPress={pickLogo} disabled={uploadingLogo}>
              {uploadingLogo ? (
                <ActivityIndicator color={colors.proInk} />
              ) : logo ? (
                <Image source={{ uri: logo }} style={s.logoImg} />
              ) : (
                <View style={s.logoPlaceholder}>
                  <ImagePlus size={24} color={colors.faint} />
                  <Text style={s.logoHint}>Ajouter</Text>
                </View>
              )}
            </Pressable>
            {!!logo && (
              <Pressable onPress={pickLogo}>
                <Text style={s.logoChange}>Changer le logo</Text>
              </Pressable>
            )}

            <Text style={s.label}>Votre entreprise (SIRET ou nom)</Text>
            <TextInput
              value={company}
              onChangeText={(t) => {
                setCompany(t);
                setSiret('');
              }}
              placeholder="N° SIRET ou nom de l'entreprise"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              autoCorrect={false}
              style={s.input}
            />
            {searchingCo && <Text style={s.coHint}>Recherche…</Text>}
            {!siret && coResults.length > 0 && (
              <View style={s.coBox}>
                {coResults.map((c, i) => (
                  <Pressable key={c.siret + i} style={[s.coRow, i > 0 && s.coBorder]} onPress={() => pickCompany(c)}>
                    <Text style={s.coName} numberOfLines={1}>{c.name}</Text>
                    <Text style={s.coMeta} numberOfLines={1}>
                      {c.siret}
                      {c.city ? ` · ${c.city}` : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {!!siret && <Text style={s.siretOk}>✓ SIRET {siret} enregistré</Text>}

            <Text style={s.label}>Métier</Text>
            <View style={s.chips}>
              {categories.map((c) => {
                const active = c.name === service;
                return (
                  <Pressable key={c.slug} style={[s.chip, active && s.chipOn]} onPress={() => setService(c.name)}>
                    <Text style={[s.chipText, active && s.chipTextOn]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.label}>Tarif horaire (€)</Text>
            <TextInput
              value={rate}
              onChangeText={setRate}
              keyboardType="number-pad"
              placeholder="40"
              placeholderTextColor={colors.faint}
              style={s.input}
            />

            <Text style={s.label}>Ville d'intervention</Text>
            <TextInput
              value={zone}
              onChangeText={setZone}
              placeholder="Paris 11e"
              placeholderTextColor={colors.faint}
              style={s.input}
            />

            <Text style={s.label}>Rayon d'intervention</Text>
            <View style={s.chips}>
              {[5, 10, 15, 25, 50].map((km) => {
                const active = km === radius;
                return (
                  <Pressable key={km} style={[s.chip, active && s.chipOn]} onPress={() => setRadius(km)}>
                    <Text style={[s.chipText, active && s.chipTextOn]}>{km} km</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.label}>Diplômes & certifications</Text>
            <TextInput
              value={certifications}
              onChangeText={setCertifications}
              placeholder={'Un par ligne, ex. :\nCAP Électricité\nHabilitation B1V\nCertifié Qualifelec'}
              placeholderTextColor={colors.faint}
              multiline
              style={s.textarea}
            />

            <Text style={s.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Présentez votre expérience, vos prestations…"
              placeholderTextColor={colors.faint}
              multiline
              style={s.textarea}
            />

            <Pressable style={[s.btn, (!ready || saving) && s.btnOff]} disabled={!ready || saving} onPress={save}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>{editing ? 'Enregistrer' : 'Publier mon profil'}</Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { fontFamily: font.body, fontSize: 14.5, color: colors.muted, lineHeight: 22, marginBottom: 20 },
  label: { fontFamily: font.semi, fontSize: 14, color: colors.ink, marginTop: 18, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3 },
  chipOn: { backgroundColor: colors.proInk, borderColor: colors.proInk },
  chipText: { fontFamily: font.medium, fontSize: 13.5, color: colors.muted },
  chipTextOn: { color: '#fff' },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  logoPick: { width: 110, height: 110, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%' },
  logoPlaceholder: { alignItems: 'center', gap: 6 },
  logoHint: { fontFamily: font.medium, fontSize: 12, color: colors.faint },
  logoChange: { fontFamily: font.semi, fontSize: 13, color: colors.link, marginTop: 8 },
  coHint: { fontFamily: font.body, fontSize: 12.5, color: colors.faint, marginTop: 6 },
  coBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  coRow: { paddingVertical: 11, paddingHorizontal: 14 },
  coBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  coName: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  coMeta: { fontFamily: font.body, fontSize: 12, color: colors.faint, marginTop: 1 },
  siretOk: { fontFamily: font.semi, fontSize: 13, color: colors.okText, marginTop: 8 },
  textarea: { minHeight: 96, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, padding: 14, fontFamily: font.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  btn: { backgroundColor: colors.proInk, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnOff: { backgroundColor: colors.faint },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
});
