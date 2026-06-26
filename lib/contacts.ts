import * as Contacts from 'expo-contacts';

// Ajoute une fiche au carnet d'adresses de l'appareil (synchronisé avec Google Contacts
// si le compte Google est ajouté dans les réglages).
export async function addToContacts(opts: {
  name: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') return { ok: false, error: 'permission' };
    await Contacts.addContactAsync({
      name: opts.name,
      firstName: opts.name,
      company: 'SERVI',
      note: opts.note,
      contactType: Contacts.ContactTypes.Person,
    } as any);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unknown' };
  }
}
