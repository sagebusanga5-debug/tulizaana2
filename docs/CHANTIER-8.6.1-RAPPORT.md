# Chantier 8.6.1 — Intégration Recherche & Profil dans la navigation

## Audit initial

- L'application ne possède pas de routeur URL : `App.tsx` navigue avec l'état
  `activeUserTab` (`feed`, `communities`, `campaigns`, `messages`, `profile`, …).
- Navigation desktop : `UserNavbar.tsx` (bandeau supérieur) et
  `UserSidebar.tsx` (barre latérale à partir de `md`).
- Navigation mobile : `MobileBottomNav.tsx`, avec Accueil, Communautés,
  Publier, Campagnes et Chats.
- Aucun écran de recherche globale n'existait. Les recherches présentes étaient
  locales aux vues concernées.
- Le profil existant est `ProfileView`. `handleOpenMyProfile()` dans `App.tsx`
  fixe l'identifiant de l'utilisateur courant puis ouvre l'onglet `profile`.
- L'identité courante est gardée dans `currentUser`, puis synchronisée avec
  `api.auth.me()` ; aucun profil n'est reconstruit depuis le stockage navigateur.
- Les icônes existantes proviennent de `lucide-react`; les nouveaux accès
  réutilisent `Search` et `User`.

## Modifications

- `src/components/user/GlobalSearchView.tsx` : nouvel écran minimal de
  recherche globale. Il appelle exclusivement `api.search(query, { limit: 20 })`.
- `src/App.tsx` : ajoute l'onglet `search`, relie les actions de navigation à
  l'écran, et réutilise `handleOpenMyProfile()` pour le profil mobile.
- `src/components/user/UserNavbar.tsx` : ajoute Recherche dans le bandeau
  desktop, avec état actif.
- `src/components/user/MobileBottomNav.tsx` : ajoute Recherche et Profil sans
  retirer Accueil, Communautés, Publier, Campagnes ni Chats. Les sept actions
  ont des espacements réduits et des labels de 9–10 px pour tenir à partir de
  375 px, sans défilement horizontal.

## Recherche

- Desktop : bouton Recherche dans `UserNavbar`, affiché à partir de `md`.
- Mobile : bouton Recherche entre Communautés et Publier, avec icône `Search`.
- UX : état initial, validation locale du minimum de deux caractères, chargement,
  erreur générique, absence de résultat et résultats regroupés par les cinq
  types exposés par l'API.
- Chaque résultat déclenche la navigation existante correspondante : profil
  membre, modal organisation, ou onglet Communautés/Campagnes/Accueil.
- Aucune requête n'est envoyée avant deux caractères ; aucune dépendance de
  debounce n'a été ajoutée puisque l'appel se fait explicitement au submit.

## Profil mobile

- Mobile : bouton Profil avec l'icône `User`, à droite de Chats.
- Action : `handleOpenMyProfile()`, qui sélectionne `currentUser.id` puis rend
  le `ProfileView` existant. Aucun composant de profil n'a été recréé.

## Responsive

- Desktop : Recherche apparaît dans le bandeau à partir de `md`; son libellé
  complet apparaît à partir de `lg` afin de préserver l'espace intermédiaire.
- Mobile : la barre conserve les cinq entrées existantes et ajoute les deux
  raccourcis requis dans un conteneur `max-w-md`, avec des boutons compacts.
- Tablet : les breakpoints Tailwind déjà employés (`md`, `lg`) ont été réutilisés.
  Aucun breakpoint personnalisé n'a été introduit.

## Sécurité

- Aucun endpoint, service, migration, schéma ou règle backend n'a été modifié.
- Aucun accès direct à Supabase, PostgreSQL ou `/rest/v1` n'a été ajouté.
- Aucun token, secret ou donnée utilisateur n'est écrit dans le stockage local.
- Le frontend traite l'API de recherche comme source d'autorité et affiche une
  erreur générique, sans détail serveur.

## Tests

- `npm.cmd run typecheck` : passe.
- `npm.cmd run test:global-search` : passe.
- `npm.cmd run test:auth-cookie-security` : 28/28 passent.
- `npm.cmd run test:storage-security` : 13/13 passent.
- `npm.cmd run build` : build de production exécuté après génération Prisma ;
  les artefacts `dist` ont été régénérés.

## Verdict

**VALIDÉ**
