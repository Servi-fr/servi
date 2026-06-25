# Notifications & photos de profil — mise en place

## ✅ Ce qui marche tout de suite (in-app)
Après l'étape 1 ci-dessous, dès qu'un client envoie une demande, le prestataire voit une
**notification in-app** (cloche avec badge rouge → écran Notifications). Idem pour le client
quand sa réservation est acceptée/refusée/terminée. **Aucun rebuild requis** pour l'in-app.

### Étape 1 — SQL (obligatoire)
Supabase → SQL Editor → exécute [`supabase/notifications-storage.sql`](../supabase/notifications-storage.sql). Il crée :
- les **triggers** (nouvelle résa → notif prestataire ; changement de statut → notif client),
- la **RLS** sur `Notification` (chacun voit les siennes),
- le **bucket Storage `avatars`** (photos de profil) + sa colonne `User.pushToken`.

## 🔔 Push device (app fermée) — nécessite un rebuild + 1 déploiement
Les modules natifs (`expo-notifications`, `expo-image-picker`) sont déjà ajoutés → il faut
**rebuilder** (`eas build`) pour les embarquer. L'app enregistre alors automatiquement le
token push de chaque utilisateur connecté.

### Étape 2 — Edge Function d'envoi
```bash
supabase functions deploy send-push --no-verify-jwt
```

### Étape 3 — Database Webhook
Supabase → **Database → Webhooks → Create** :
- Table : **`Notification`** · Événement : **INSERT**
- Type : **Supabase Edge Function** → **`send-push`**
→ à chaque notification créée, le push part vers le bon appareil (via l'API Expo Push).

## 📸 Photos de profil
- **Paramètres → Mon profil → « Changer la photo »** → choisit une image → upload dans le
  bucket `avatars` → l'URL est enregistrée dans `User.image` et affichée sur le profil.
- Nécessite le **rebuild** (sélecteur natif) + l'étape 1 (bucket).

## Récap
| Action | Rebuild ? | Déploiement ? |
|---|---|---|
| Notifications in-app | non | SQL (étape 1) |
| Push device | **oui** | SQL + Edge Function + Webhook |
| Photos de profil | **oui** | SQL (bucket) |
