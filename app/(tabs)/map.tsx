import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { colors, font } from '../../theme/colors';
import { getProviders } from '../../lib/api';
import { geocode } from '../../lib/geo';
import type { Provider } from '../../lib/data';

type Pin = { provider: Provider; lat: number; lng: number; price: number };
const PARIS: Region = { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.3, longitudeDelta: 0.3 };

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // 1) Centre sur la position de l'utilisateur si autorisé.
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (active) {
            mapRef.current?.animateToRegion(
              { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.2, longitudeDelta: 0.2 },
              700,
            );
          }
        }
      } catch {
        /* localisation refusée : on garde Paris par défaut */
      }

      // 2) Géolocalise les prestataires (par ville, avec cache).
      const providers = await getProviders();
      const cache: Record<string, { lat: number; lng: number } | null> = {};
      const result: Pin[] = [];
      for (const p of providers) {
        if (!p.city) continue;
        if (!(p.city in cache)) cache[p.city] = await geocode(p.city);
        const c = cache[p.city];
        if (!c) continue;
        // léger décalage déterministe pour éviter la superposition des pins
        const seed = (parseInt(p.id.replace(/\D/g, '').slice(-3) || '0', 10) % 18) - 9;
        const jitter = seed / 800;
        result.push({
          provider: p,
          lat: c.lat + jitter,
          lng: c.lng - jitter,
          price: Math.min(...p.services.map((s) => s.price)),
        });
      }
      if (active) {
        setPins(result);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={PARIS}
        showsUserLocation
        showsMyLocationButton
      >
        {pins.map((pin) => (
          <Marker
            key={pin.provider.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            onPress={() => router.push(`/prestataire/${pin.provider.id}`)}
          >
            <View style={s.pin}>
              <Text style={s.pinText}>{pin.price} €</Text>
              <View style={s.pinTip} />
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={s.overlay} edges={['top']} pointerEvents="box-none">
        <View style={s.banner}>
          <Text style={s.bannerText}>
            {loading ? 'Recherche des prestataires…' : `${pins.length} prestataire${pins.length > 1 ? 's' : ''} autour de vous`}
          </Text>
          {loading && <ActivityIndicator color={colors.link} size="small" />}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 6 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line3,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 8,
    shadowColor: '#1e2f8f',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  bannerText: { fontFamily: font.semi, fontSize: 14, color: colors.ink },
  pin: { alignItems: 'center' },
  pinText: { backgroundColor: colors.blue, color: '#fff', fontFamily: font.bold, fontSize: 13, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  pinTip: { width: 2, height: 8, backgroundColor: colors.blue },
});
