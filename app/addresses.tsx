import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Trash2, Check, Home, Plus } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { getMyAddresses, addMyAddress, deleteMyAddress, type SavedAddress } from '../lib/api';
import { searchAddresses, type AddressSuggestion } from '../lib/geo';
import { useBreakpoint, centeredContent } from '../lib/responsive';

export default function Addresses() {
  const { contentMaxWidth } = useBreakpoint();
  const [list, setList] = useState<SavedAddress[] | null>(null);
  const [label, setLabel] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => getMyAddresses().then(setList);
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selected) return;
    const q = query.trim();
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
  }, [query, selected]);

  async function save() {
    if (!selected || !label.trim() || saving) return;
    setSaving(true);
    const r = await addMyAddress({ label: label.trim(), address: selected.label, lat: selected.lat, lng: selected.lng });
    setSaving(false);
    if (!r.ok) {
      Alert.alert('Erreur', "L'adresse n'a pas pu être enregistrée.");
      return;
    }
    setLabel('');
    setQuery('');
    setSelected(null);
    setSuggestions([]);
    load();
  }

  function remove(a: SavedAddress) {
    Alert.alert('Supprimer', `Supprimer « ${a.label} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteMyAddress(a.id);
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Mes adresses" />
      <ScrollView
        contentContainerStyle={[s.scroll, centeredContent(contentMaxWidth)]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.lead}>Enregistrez vos adresses d'intervention pour réserver plus vite.</Text>

        {/* Liste */}
        {list === null ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.link} />
          </View>
        ) : list.length === 0 ? (
          <Text style={s.empty}>Aucune adresse enregistrée pour le moment.</Text>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {list.map((a) => (
              <View key={a.id} style={s.card}>
                <View style={s.cardIcon}>
                  <Home size={18} color={colors.link} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardLabel}>{a.label}</Text>
                  <Text style={s.cardAddr} numberOfLines={1}>
                    {a.address}
                  </Text>
                </View>
                <Pressable onPress={() => remove(a)} hitSlop={8}>
                  <Trash2 size={18} color={colors.faint} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Ajout */}
        <Text style={s.section}>Ajouter une adresse</Text>
        <Text style={s.fieldLabel}>Nom</Text>
        <View style={s.inputWrap}>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Domicile, Bureau, Maman…"
            placeholderTextColor={colors.faint}
            style={s.input}
          />
        </View>

        <Text style={s.fieldLabel}>Adresse</Text>
        <View style={[s.inputWrap, selected && s.inputWrapOk]}>
          <MapPin size={18} color={selected ? colors.okText : colors.faint} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSelected(null);
            }}
            placeholder="Commencez à taper…"
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
                  setQuery(a.label);
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

        <Pressable
          style={[s.cta, (!selected || !label.trim() || saving) && s.ctaOff]}
          disabled={!selected || !label.trim() || saving}
          onPress={save}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Plus size={18} color="#fff" />
              <Text style={s.ctaText}>Enregistrer cette adresse</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  lead: { fontFamily: font.body, fontSize: 14, color: colors.muted, lineHeight: 21 },
  loading: { paddingTop: 40, alignItems: 'center' },
  empty: { fontFamily: font.body, fontSize: 14, color: colors.faint, marginTop: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  cardIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
  cardAddr: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 1 },
  section: { fontFamily: font.display, fontSize: 18, color: colors.ink, letterSpacing: -0.3, marginTop: 28, marginBottom: 6 },
  fieldLabel: { fontFamily: font.semi, fontSize: 13.5, color: colors.ink, marginTop: 14, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, paddingHorizontal: 14 },
  inputWrapOk: { borderColor: colors.okText, backgroundColor: colors.okBg },
  input: { flex: 1, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  suggestBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, marginTop: 8, overflow: 'hidden' },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14 },
  suggestBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  suggestText: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.ink },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  ctaOff: { backgroundColor: colors.faint },
  ctaText: { color: '#fff', fontFamily: font.semi, fontSize: 15.5 },
});
