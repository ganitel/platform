# FE-PROFILE-001 — Page profil utilisateur et gestion du compte

## Priorité
P2

## Délai estimé
1.5d

## Dépendances
- FE-AUTH-002 (session auth + données utilisateur)
- FE-GUARD-001 (route protégée)

## Contexte (Audit)
La page `Profile.tsx` est actuellement un **placeholder** qui affiche uniquement des boutons "Connexion" / "Inscription" avec du texte en français. Elle ne montre aucune information utilisateur et n'appelle aucune API.

Le backend expose :
- `GET /users/me` → `UserResponse` (email, phone, bio, profile_picture, country, city, language, currency, etc.)
- `PUT /users/me` → mise à jour du profil
- `POST /users/me/change-password` → changement de mot de passe
- `GET /users/me/bookings` → liste des réservations de l'utilisateur
- `POST /upload/image` → upload de photo de profil

## Tâches

### 1. Affichage du profil
- [ ] Quand l'utilisateur est authentifié :
  - Afficher : photo de profil (ou avatar par défaut), nom, email, téléphone
  - Afficher : pays, ville, langue, devise
  - Bouton "Modifier le profil"
  - Section "Mes réservations" (lien vers `/my-bookings`)
  - Section "Préférences" (langue, devise, notifications)
  - Bouton "Déconnexion"
- [ ] Quand non authentifié : redirect vers `/sign-in` (via ProtectedRoute)

### 2. Modification du profil
- [ ] Formulaire d'édition : nom, téléphone, bio, pays, ville
- [ ] Upload de photo de profil via `POST /upload/image`
- [ ] Appeler `PUT /users/me` avec les données modifiées
- [ ] Feedback visuel : loading, succès (toast), erreur

### 3. Support et aide
- [ ] Lien vers la création de support request (`POST /support-requests`)
- [ ] Lien vers les politiques (`GET /policies`) : CGU, politique de confidentialité

### 4. Hooks et service
- [ ] Créer `client/hooks/useProfile.ts` avec :
  - `useProfile()` → `GET /users/me`
  - `useUpdateProfile()` → `PUT /users/me`
  - `useUploadAvatar()` → `POST /upload/image`

## Critères d'acceptation
- [ ] Le profil affiche les données réelles de l'utilisateur authentifié
- [ ] La modification du profil fonctionne (nom, téléphone, photo)
- [ ] Déconnexion vide la session et redirige vers `/`
- [ ] Responsive mobile et desktop

## Fichiers impactés
- `client/pages/Profile.tsx` (refonte complète)
- `client/hooks/useProfile.ts` (nouveau)
- `client/services/users.service.ts` (nouveau)
