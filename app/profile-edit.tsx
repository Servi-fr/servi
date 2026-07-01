import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, font } from '../theme/colors';
import { getMyProfile, updateMyProfile, uploadAvatar } from '../lib/api';

export default function ProfileEdit() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    getMyProfile().then((p) => {
      if (p) {
        setFirstName(p.firstName ?? '');
        setLastName(p.lastName ?? '');
        setPhone(p.phone ?? '');
        setAddress(p.address ?? '');
        setImage(p.image ?? null);
      }
      setLoading(false);
    });
  }, []);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', "Autorisez l'accès aux photos pour changer votre avatar.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setPicking(true);
    const up = await uploadAvatar(res.assets[0].uri);
    setPicking(false);
    if (!up.ok || !up.url) {
      Alert.alert('Erreur', "L'upload de la photo a échoué.");
      return;
    }
    setImage(up.url);
    await updateMyProfile({ image: up.url });
  }

  async function save() {
    if (!firstName.trim()) {
      Alert.alert('Prénom requis', 'Renseignez au moins votre prénom avant d\'enregistrer.');
      return;
    }
    setSaving(true);
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
    const r = await updateMyProfile({ firstName, lastName, phone, address, name, image });
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
            <View style={s.avatarWrap}>
              <Pressable onPress={pickPhoto} style={s.avatarBtn} accessibilityRole="button" accessibilityLabel="Changer la photo de profil">
                {image ? (
                  <Image source={{ uri: image }} style={s.avatarImg} />
                ) : (
                  <View style={s.avatarPlaceholder}>
                    <Camera size={26} color={colors.link} />
                  </View>
                )}
                {picking && (
                  <View style={s.avatarLoading}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
                <View style={s.avatarEdit}>
                  <Camera size={14} color="#fff" />
                </View>
              </Pressable>
              <Text style={s.avatarHint}>Changer la photo</Text>
            </View>

            <Field label="Prénom *" value={firstName} onChange={setFirstName} placeholder="Julien" />
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
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatarBtn: { width: 96, height: 96, borderRadius: 48 },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  avatarLoading: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatarEdit: { position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  avatarHint: { fontFamily: font.semi, fontSize: 13, color: colors.link, marginTop: 8 },
  label: { fontFamily: font.semi, fontSize: 13, color: '#414b5e', marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: font.body, fontSize: 15, color: colors.ink },
  btn: { backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
});
