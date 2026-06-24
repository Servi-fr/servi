import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { getMyProfile, updateMyProfile } from '../lib/api';

export default function ProfileEdit() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    getMyProfile().then((p) => {
      if (p) {
        setFirstName(p.firstName ?? '');
        setLastName(p.lastName ?? '');
        setPhone(p.phone ?? '');
        setAddress(p.address ?? '');
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
    const r = await updateMyProfile({ firstName, lastName, phone, address, name });
    setSaving(false);
    if (!r.ok) {
      Alert.alert('Erreur', 'La mise à jour a échoué. Réessayez.');
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader title="Mon profil" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.link} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Field label="Prénom" value={firstName} onChange={setFirstName} placeholder="Julien" />
            <Field label="Nom" value={lastName} onChange={setLastName} placeholder="Marchal" />
            <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="06 12 34 56 78" keyboardType="phone-pad" />
            <Field label="Adresse" value={address} onChange={setAddress} placeholder="12 rue de la République, Paris" />

            <Pressable style={[s.btn, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Enregistrer</Text>}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={keyboardType ?? 'default'}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: font.semi, fontSize: 13, color: '#414b5e', marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  btn: { backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
});
