import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Check, Search } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { categories } from '../lib/data';
import { createServiceRequest } from '../lib/api';
import { searchAddresses, type AddressSuggestion } from '../lib/geo';
import { useBreakpoint, centeredContent } from '../lib/responsive';

const FREQ = ['Ponctuel', 'Hebdomadaire', 'Mensuel'];

export default function Besoin() {
  const router = useRouter();
  const { cat } = useLocalSearchParams<{ cat?: string }>();
  const { contentMaxWidth } = useBreakpoint();

  const [category, setCategory] = useState<string>(cat ?? '');
  const [frequency, setFrequency] = useState('');
  const [details, setDetails] = useState('');
  const [addr, setAddr] = useState('');
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selected) return;
    const q = addr.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      setSuggestions(await searchAddresses(q));
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [addr, selected]);

  const ready = category.length > 0;

  async function submit() {
    if (!ready || submitting) return;
    setSubmitting(true);
    const result = await createServiceRequest({
      category,
      frequency: frequency || undefined,
      details: details.trim() || undefined,
      address: selected?.label,
      lat: selected?.lat,
      lng: selected?.lng,
    });
    setSubmitting(false);
    // Échec → on le dit (plus de faux « succès »).
    if (!result.ok) {
      Alert.alert('Envoi impossible', "Votre besoin n'a pas pu être envoyé. Vérifiez votre connexion et réessayez.");
      return;
    }
    router.replace(`/category/${category}`);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Votre besoin" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.lead}>Dites-nous ce dont vous avez besoin, on vous met en relation avec les bons prestataires près de chez vous.</Text>

          <Text style={s.label}>Quel service ?</Text>
          <View style={s.chips}>
            {categories.map((c) => {
              const active = c.slug === category;
              return (
                <Pressable key={c.slug} style={[s.chip, active && s.chipOn]} onPress={() => setCategory(c.slug)}>
                  <Text style={[s.chipText, active && s.chipTextOn]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>À quelle fréquence ?</Text>
          <View style={s.chips}>
            {FREQ.map((f) => {
              const active = f === frequency;
              return (
                <Pressable key={f} style={[s.chip, active && s.chipOn]} onPress={() => setFrequency(active ? '' : f)}>
                  <Text style={[s.chipText, active && s.chipTextOn]}>{f}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>Précisez votre besoin</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Ex. tonte + taille de haie, tous les 15 jours…"
            placeholderTextColor={colors.faint}
            multiline
            style={s.textarea}
          />

          <Text style={s.label}>Où ? (optionnel)</Text>
          <View style={[s.inputWrap, selected && s.inputWrapOk]}>
            <MapPin size={18} color={selected ? colors.okText : colors.faint} />
            <TextInput
              value={addr}
              onChangeText={(t) => {
                setAddr(t);
                setSelected(null);
              }}
              placeholder="Votre adresse"
              placeholderTextColor={colors.faint}
              style={s.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching ? <ActivityIndicator size="small" color={colors.faint} /> : selected ? <Check size={18} color={colors.okText} /> : null}
          </View>
          {!selected && suggestions.length > 0 && (
            <View style={s.suggestBox}>
              {suggestions.map((a, i) => (
                <Pressable
                  key={a.label + i}
                  style={[s.suggestRow, i > 0 && s.suggestBorder]}
                  onPress={() => {
                    setSelected(a);
                    setAddr(a.label);
                    setSuggestions([]);
                  }}
                >
                  <MapPin size={15} color={colors.faint} />
                  <Text style={s.suggestText} numberOfLines={1}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {!selected && !searching && suggestions.length === 0 && addr.trim().length >= 3 && (
            <Text style={s.addrHint}>Aucune adresse trouvée — vérifiez l'orthographe.</Text>
          )}
        </ScrollView>

        <View style={s.ctaBar}>
          <Pressable style={[s.cta, (!ready || submitting) && s.ctaOff]} disabled={!ready || submitting} onPress={submit}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Search size={18} color="#fff" />
                <Text style={s.ctaText}>{ready ? 'Voir les prestataires' : "Choisissez d'abord un service"}</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  lead: { fontFamily: font.body, fontSize: 14.5, color: colors.muted, lineHeight: 22 },
  label: { fontFamily: font.semi, fontSize: 14, color: colors.ink, marginTop: 22, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3 },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontFamily: font.medium, fontSize: 13.5, color: colors.muted },
  chipTextOn: { color: '#fff' },
  textarea: { minHeight: 84, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, padding: 14, fontFamily: font.body, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, paddingHorizontal: 14 },
  inputWrapOk: { borderColor: colors.okText, backgroundColor: colors.okBg },
  input: { flex: 1, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  suggestBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, marginTop: 8, overflow: 'hidden' },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14 },
  suggestBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  suggestText: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.ink },
  addrHint: { fontFamily: font.body, fontSize: 12.5, color: colors.faint, marginTop: 8 },
  ctaBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line3, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 16 },
  ctaOff: { backgroundColor: colors.faint },
  ctaText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
});
