import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { colors, font } from '../../theme/colors';
import { getProviders } from '../../lib/api';
import { geocode } from '../../lib/geo';
import { categories, getCategory, type Provider } from '../../lib/data';

type Pin = { provider: Provider; lat: number; lng: number };
const PARIS: Region = { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.3, longitudeDelta: 0.3 };

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string | null>(null); // null = tous les métiers

  useEffect(() => {
    let active = true;
    (async () => {
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
        /* localisation refusée : on garde Paris */
      }

      const providers = await getProviders();
      const cache: Record<string, { lat: number; lng: number } | null> = {};
      const result: Pin[] = [];
      for (const p of providers) {
        if (!p.city) continue;
        if (!(p.city in cache)) cache[p.city] = await geocode(p.city);
        const c = cache[p.city];
        if (!c) continue;
        const seed = (parseInt(p.id.replace(/\D/g, '').slice(-3) || '0', 10) % 18) - 9;
        const jitter = seed / 800;
        result.push({ provider: p, lat: c.lat + jitter, lng: c.lng - jitter });
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

  const visible = cat ? pins.filter((p) => p.provider.category === cat) : pins;

  return (
    <View style={s.container}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={PARIS} showsUserLocation showsMyLocationButton>
        {visible.map((pin) => {
          const Icon = getCategory(pin.provider.category)?.Icon;
          return (
            <Marker
              key={pin.provider.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => router.push(`/prestataire/${pin.provider.id}`)}
            >
              <View style={s.pin}>
                <View style={s.pinCircle}>{Icon ? <Icon size={18} color="#fff" /> : null}</View>
                <View style={s.pinTip} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={s.overlay} edges={['top']} pointerEvents="box-none">
        {/* Filtre par corps de métier */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
          keyboardShouldPersistTaps="handled"
        >
          <Chip label="Tous" active={!cat} onPress={() => setCat(null)} />
          {categories.map((c) => (
            <Chip key={c.slug} label={c.name} active={cat === c.slug} onPress={() => setCat(c.slug)} />
          ))}
        </ScrollView>

        <View style={s.countWrap} pointerEvents="none">
          <Text style={s.count}>
            {loading
              ? 'Recherche des prestataires…'
              : `${visible.length} prestataire${visible.length > 1 ? 's' : ''}${cat ? ` · ${getCategory(cat)?.name}` : ''}`}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[s.chip, active && s.chipOn]} onPress={onPress}>
      <Text style={[s.chipText, active && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  chips: { paddingHorizontal: 14, paddingTop: 10, gap: 8, alignItems: 'center' },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line3,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
    shadowColor: '#1e2f8f',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontFamily: font.semi, fontSize: 13.5, color: colors.ink },
  chipTextOn: { color: '#fff' },
  countWrap: { alignSelf: 'center', backgroundColor: 'rgba(13,18,32,0.82)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  count: { fontFamily: font.semi, fontSize: 12.5, color: '#fff' },
  pin: { alignItems: 'center' },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  pinTip: { width: 3, height: 7, backgroundColor: colors.blue, marginTop: -1 },
});
