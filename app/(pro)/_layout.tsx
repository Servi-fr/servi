import { Tabs } from 'expo-router';
import { LayoutDashboard, Inbox, CalendarDays, User } from 'lucide-react-native';
import { colors, font } from '../../theme/colors';

// Espace prestataire — identité Noir & Blanc (distincte du bleu client).
export default function ProLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#7b8494',
        tabBarStyle: { backgroundColor: colors.proSidebar, borderTopColor: '#1b2230' },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Tableau', tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} /> }} />
      <Tabs.Screen name="demandes" options={{ title: 'Demandes', tabBarIcon: ({ color }) => <Inbox color={color} size={22} /> }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarIcon: ({ color }) => <CalendarDays color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
