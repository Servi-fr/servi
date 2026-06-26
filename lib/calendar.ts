import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

// Ajoute un événement à l'agenda de l'appareil (Apple Calendar → synchronisé avec Google
// si le compte Google est ajouté dans les réglages iOS/macOS).
export async function addToCalendar(opts: {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return { ok: false, error: 'permission' };

    let calendarId: string | undefined;
    if (Platform.OS === 'ios') {
      const def = await Calendar.getDefaultCalendarAsync();
      calendarId = def?.id;
    }
    if (!calendarId) {
      const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      calendarId = cals.find((c) => c.allowsModifications)?.id ?? cals[0]?.id;
    }
    if (!calendarId) return { ok: false, error: 'no-calendar' };

    await Calendar.createEventAsync(calendarId, {
      title: opts.title,
      startDate: opts.start,
      endDate: opts.end,
      location: opts.location,
      notes: opts.notes,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}
