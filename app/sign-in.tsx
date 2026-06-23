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

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError('Email ou mot de passe incorrect.');
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
            <Text style={s.title}>Connexion à SERVI</Text>
            <Text style={s.sub}>Accédez à votre espace personnel</Text>
          </View>

          <View style={s.card}>
            <Text style={s.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="vous@email.com"
              placeholderTextColor={colors.faint}
              style={s.input}
            />
            <Text style={[s.label, { marginTop: 16 }]}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.faint}
              style={s.input}
            />

            {error && <Text style={s.error}>{error}</Text>}

            <Pressable onPress={handleLogin} disabled={loading} style={[s.btn, loading && { opacity: 0.6 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Se connecter</Text>}
            </Pressable>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Nouveau sur SERVI ? </Text>
            <Link href="/sign-up" asChild>
              <Pressable>
                <Text style={s.linkText}>Créer un compte</Text>
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
  btn: {
    backgroundColor: colors.blue,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: { color: '#fff', fontFamily: font.semi, fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { fontFamily: font.body, fontSize: 14, color: colors.muted },
  linkText: { fontFamily: font.semi, fontSize: 14, color: colors.link },
});
