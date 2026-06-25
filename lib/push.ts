import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { savePushToken } from './api';

// Affiche les notifications même quand l'app est au premier plan.
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) as any,
});

// Demande la permission, récupère le token Expo et l'enregistre côté serveur.
export async function registerForPush(): Promise<void> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications SERVI',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      (Constants?.expoConfig?.extra as any)?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (token?.data) await savePushToken(token.data);
  } catch {
    /* push indisponible (ex. simulateur) — on ignore */
  }
}
