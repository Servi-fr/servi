import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors, font } from '../theme/colors';
import { Logo } from '../components/Logo';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      setDone(true);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <View style={s.container}>
          <View style={s.head}>
            <Logo size={26} />
            <Text style={s.title}>Rejoindre SERVI</Text>
            <Text style={s.sub}>Créez votre compte gratuitement</Text>
          </View>

          <View style={s.card}>
            {done ? (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={s.doneTitle}>Vérifiez votre email</Text>
                <Text style={s.doneText}>
                  Nous avons envoyé un lien de confirmation à {email}. Cliquez dessus pour activer votre compte.
                </Text>
                <Link href="/sign-in" asChild>
                  <Pressable style={s.btn}>
                    <Text style={s.btnText}>Aller à la connexion</Text>
                  </Pressable>
                </Link>
              </View>
            ) : (
              <>
                <Text style={s.label}>Nom</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Votre nom" placeholderTextColor={colors.faint} style={s.input} />
                <Text style={[s.label, { marginTop: 16 }]}>Email</Text>
                <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@email.com" placeholderTextColor={colors.faint} style={s.input} />
                <Text style={[s.label, { marginTop: 16 }]}>Mot de passe</Text>
                <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="8 caractères minimum" placeholderTextColor={colors.faint} style={s.input} />

                {error && <Text style={s.error}>{error}</Text>}

                <Pressable onPress={handleSignUp} disabled={loading} style={[s.btn, loading && { opacity: 0.6 }]}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Créer mon compte</Text>}
                </Pressable>
              </>
            )}
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Déjà membre ? </Text>
            <Link href="/sign-in" asChild>
              <Pressable>
                <Text style={s.linkText}>Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  head: { alignItems: 'center', marginBottom: 28 },
  title: { fontFamily: font.display, fontSize: 26, color: colors.ink, marginTop: 18 },
  sub: { fontFamily: font.body, fontSize: 15, color: colors.muted, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#1e2f8f',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  label: { fontFamily: font.semi, fontSize: 13, color: '#414b5e', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line3,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
  },
  error: { color: '#dc2626', fontFamily: font.medium, fontSize: 13, marginTop: 12 },
  btn: { backgroundColor: colors.blue, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 20, alignSelf: 'stretch' },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
  doneTitle: { fontFamily: font.displaySemi, fontSize: 19, color: colors.ink, marginBottom: 8 },
  doneText: { fontFamily: font.body, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { fontFamily: font.body, fontSize: 14, color: colors.muted },
  linkText: { fontFamily: font.semi, fontSize: 14, color: colors.link },
});
