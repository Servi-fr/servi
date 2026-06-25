import { Tabs } from 'expo-router';
import { House, Map, User } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.link,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Carte', tabBarIcon: ({ color }) => <Map color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
