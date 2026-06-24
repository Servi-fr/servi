import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, font } from '../theme/colors';
import { signInWithGoogle } from '../lib/oauth';

export function GoogleButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    const r = await signInWithGoogle();
    setLoading(false);
    if (r.ok) {
      router.replace('/(tabs)');
    } else if (r.error && r.error !== 'cancelled') {
      Alert.alert('Google', "La connexion Google n'est pas encore disponible (provider à activer côté Supabase).");
    }
  }

  return (
    <View>
      <View style={s.divRow}>
        <View style={s.line} />
        <Text style={s.or}>ou</Text>
        <View style={s.line} />
      </View>
      <Pressable style={s.btn} onPress={go} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <View style={s.g}>
              <Text style={s.gText}>G</Text>
            </View>
            <Text style={s.label}>Continuer avec Google</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.line3 },
  or: { fontFamily: font.medium, fontSize: 13, color: colors.faint },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line3, borderRadius: 13, paddingVertical: 14 },
  g: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line3, alignItems: 'center', justifyContent: 'center' },
  gText: { fontFamily: font.bold, fontSize: 14, color: '#4285F4' },
  label: { fontFamily: font.semi, fontSize: 15, color: colors.ink },
});
