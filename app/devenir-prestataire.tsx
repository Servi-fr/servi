import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { categories } from '../lib/data';
import { getMyProviderProfile, upsertMyProviderProfile } from '../lib/api';

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
      }
      setLoading(false);
    });
  }, []);

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
  textarea: { minHeight: 96, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, padding: 14, fontFamily: font.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  btn: { backgroundColor: colors.proInk, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnOff: { backgroundColor: colors.faint },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
});
