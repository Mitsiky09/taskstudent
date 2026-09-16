# Journal des corrections

Ce document récapitule les problèmes identifiés lors de la relecture du projet,
la correction apportée et sa justification. Il peut servir de base au chapitre
« démarche qualité » du mémoire.

---

## 1. Lisibilité du code

**Problème.** L'ensemble des fichiers source était minifié sur une ou deux
lignes de plusieurs milliers de caractères, rendant le code illisible en
relecture comme en annexe de mémoire.

**Correction.** Mise en place de Prettier (`.prettierrc`, `.prettierignore`) et
d'ESLint (`eslint.config.js`, configuration plate d'Expo complétée par
`eslint-config-prettier`). Tout le code a été reformaté, commenté aux endroits
où une décision technique mérite d'être expliquée, et les scripts `npm run lint`
et `npm run format` ont été ajoutés.

---

## 2. Décalage de fuseau horaire dans le calendrier

**Problème.** La clé de jour était construite avec
`date.toISOString().slice(0, 10)`, qui convertit en UTC. Dans un fuseau positif
(UTC+3 à Antananarivo), une tâche due à 01 h 00 apparaissait la veille ; une
tâche due à 23 h 00 pouvait basculer au lendemain dans un fuseau négatif.

**Correction.** Création de `lib/date.ts` avec `toDateKey` et `fromDateKey`, qui
travaillent en heure locale via `getFullYear` / `getMonth` / `getDate`. Toutes
les comparaisons de jour de l'application passent par ces fonctions. Trois tests
de régression figent le comportement (`__tests__/date.test.ts`).

---

## 3. Écritures concurrentes sur l'état des tâches

**Problème.** Les mutations du contexte repartaient du tableau `tasks` capturé
dans la closure (`commit([...tasks])`). Deux actions rapprochées — cocher deux
tâches d'affilée — partaient du même état et la première modification était
perdue. Par ailleurs, la persistance était déclenchée dans chaque mutation, sans
protection contre une écriture antérieure à la fin du chargement.

**Correction.** Toutes les mutations utilisent `setTasks(previous => …)`. La
persistance devient un effet dérivé de l'état (`useEffect` sur `tasks`), gardé
par un drapeau `hydrated` afin que le premier rendu n'écrase pas les données
existantes avec un tableau vide.

---

## 4. Fonctionnalités visibles mais inertes

**Problème.** Plusieurs éléments d'interface ne produisaient aucun effet : le
filtre « Par matière » des archives, les interrupteurs Notifications /
Archivage automatique / Thème, le bouton « Partager », l'export JSON/CSV
(simple `Alert`), les rappels enregistrés mais jamais programmés, et l'écran
Statistiques accessible depuis aucune route.

**Correction.**

- Filtre « Par matière » : regroupement réel via `groupBySubject` et rendu en
  `SectionList` avec un en-tête par matière.
- Préférences : nouveau `SettingsContext` persisté dans AsyncStorage
  (`STORAGE_KEYS.settings`, jusqu'alors déclaré mais inutilisé).
- Archivage automatique : `applyAutoArchive` archive les tâches terminées depuis
  plus de sept jours, appliqué au démarrage lorsque l'option est active.
- Rappels : `lib/notifications.ts` programme une notification locale une heure
  avant l'échéance, avec demande de permission. Le module `expo-notifications`
  est chargé paresseusement afin que l'application continue de fonctionner s'il
  est absent de l'environnement.
- Partage et export : `lib/export.ts` s'appuie sur l'API `Share` de React
  Native ; la sérialisation JSON et CSV (échappement RFC 4180) est isolée dans
  `lib/serialize.ts` pour rester testable.
- Statistiques : écran enrichi (taux de complétion, retards, répartition par
  matière) et atteignable depuis l'accueil et le profil.
- Thème sombre : l'option, non implémentée, a été retirée de l'interface et
  déclarée comme limite connue plutôt que laissée en promesse non tenue.

---

## 5. Normalisation du modèle de données

**Problème.** Chaque tâche recopiait le _nom_ et la _couleur_ de sa matière.
Renommer une matière rompait le lien et laissait des couleurs orphelines.

**Correction.** `Task` ne conserve que `subjectId` ; `getSubject` résout nom et
couleur à l'affichage. `lib/migration.ts` convertit les enregistrements de
l'ancien format au chargement (correspondance par nom, repli sur une matière
« Autre »), valide les champs et écarte les entrées inexploitables.

---

## 6. Session non gardée et validation absente

**Problème.** L'écran de connexion acceptait n'importe quelle saisie et codait
en dur le prénom « Alex ». Aucune route n'était protégée : après déconnexion, un
redémarrage renvoyait directement vers les onglets, l'écran d'amorçage ne
testant que l'onboarding.

**Correction.** `SessionContext` centralise la session locale. L'écran
d'amorçage (`app/index.tsx`) arbitre entre onboarding, connexion et onglets
selon l'état réel. Les formulaires valident l'adresse e-mail et la longueur du
mot de passe et affichent des messages d'erreur. L'absence d'authentification
serveur est explicitée à l'utilisateur dans l'interface et documentée comme un
choix assumé.

---

## 7. Robustesse du stockage

**Problème.** Les appels `JSON.parse` n'étaient pas protégés (le seul `try/catch`
du projet se trouvait dans `useStorage.ts`, un hook jamais utilisé). Un stockage
corrompu faisait planter l'application au lancement.

**Correction.** `lib/storage.ts` expose `readJSON` / `writeJSON` / `remove`, avec
repli sur une valeur par défaut et journalisation en cas d'erreur. Le hook mort a
été supprimé.

---

## 8. Interface et accessibilité

**Problème.** Listes rendues par `ScrollView` + `map`, sélecteur date/heure
affiché en permanence (inadapté à Android), `minimumDate` empêchant de corriger
une échéance passée, édition incohérente dans le détail (titre et description
différés, priorité et matière immédiates), marge négative fragile dans la carte
d'archive, libellés d'accessibilité limités au bouton flottant.

**Correction.** `FlatList` et `SectionList` pour les listes longues ; composant
`DateTimeField` encapsulant la différence iOS / Android ; contrainte de date
minimale levée ; édition du détail entièrement en brouillon avec un bouton
d'enregistrement activé seulement en cas de modification ; carte d'archive
reconstruite sans décalage négatif ; `accessibilityRole`, `accessibilityLabel` et
`accessibilityState` ajoutés sur les cases à cocher, filtres, boutons et champs.

---

## 9. Dépendances

**Problème.** `zustand`, `uuid` et `expo-sharing` figuraient dans les
dépendances sans être utilisés — `zustand` en particulier contredisait le choix
du Context API annoncé dans le README.

**Correction.** Ces trois paquets ont été retirés. `expo-notifications` a été
ajouté pour les rappels. La génération d'identifiants passe par `lib/id.ts`, ce
qui évite le polyfill `crypto.getRandomValues` qu'exige `uuid` sur React Native.
`package-lock.json`, devenu incohérent, a été supprimé : `npm install` le
régénère.

---

## 10. Tests et documentation

**Problème.** Aucun test, aucun outil d'analyse statique, README de quinze
lignes.

**Correction.** 38 tests unitaires (Jest + ts-jest) couvrent les filtres, les
tris, la recherche, les sélections d'écran, le calcul des statistiques,
l'archivage automatique, la migration et l'export. La logique métier a été
volontairement isolée de React Native dans `lib/`, ce qui permet de tester en
environnement Node sans monter de rendu. README complet : problématique,
fonctionnalités, installation, arborescence, choix techniques justifiés,
décisions notables, limites connues et perspectives.

---

## 11. Unification du style de l'application

**Problème.** Deux chartes graphiques coexistaient. Une partie de l'application
(Accueil, Aujourd'hui, création de tâche) avait été refondue en indigo
`#4f46e5` avec une palette `slate`, des cartes blanches cerclées et des coins
très arrondis ; le reste (en-têtes, filtres, boutons, onboarding, cartes de
tâche, calendrier, profil, statistiques, authentification) utilisait encore le
rouge Todoist `#db4c3f`, la palette `gray` et des surfaces sans bordure. Le
détail d'une tâche introduisait même un troisième bleu (`#3B82F6`) et la famille
d'icônes Feather, alors que le reste de l'application utilise Ionicons. Une
trentaine de couleurs hexadécimales étaient écrites en dur, parfois plusieurs
fois dans un même fichier, et les feuilles modales, les champs de saisie et les
pastilles étaient recopiés écran par écran avec des variantes.

**Correction.** Mise en place d'un design system unique, documenté dans
`docs/DESIGN_SYSTEM.md` :

- **Tokens centralisés** dans `constants/theme.ts` (nuances, tokens sémantiques,
  rayons, ombres, typographies, surfaces, `withAlpha`). `tailwind.config.js`
  importe cette palette et expose les classes correspondantes (`bg-primary`,
  `bg-canvas`, `text-ink`, `text-faint`, `border-line-soft`…) : il n'y a plus
  qu'une définition de chaque couleur. L'ancien `COLORS.primary` (`#db4c3f`,
  rouge Todoist) disparaît au profit de `theme.colors.primary` (`#4f46e5`) :
  filtres, boutons, onboarding, calendrier, profil et case à cocher des tâches
  s'alignent d'un coup.
- **Composants partagés** dans `components/ui/` : `Screen`, `Card`, `Sheet`
  (+ `SheetOption`, `SheetAction`), `Chip`, `SegmentedControl`, `TextField`,
  `IconButton`, `SectionHeader`. Ils remplacent les blocs dupliqués (deux
  sélecteurs à segments recopiés dans les filtres, quatre feuilles modales
  recodées à la main, cinq variantes de champ de saisie).
- **Écrans repris** un par un : même fond `bg-canvas`, mêmes marges latérales
  (20 pt), mêmes cartes, mêmes en-têtes, mêmes couleurs d'état (retard =
  `danger`, reporté = `warning`, terminé = `success`).
- **Une seule famille d'icônes** : Ionicons partout, Feather retiré.
- **Barre d'onglets flottante inchangée** : sa structure, sa géométrie et ses
  animations sont conservées telles quelles ; seules ses couleurs pointent
  désormais sur les tokens (le bouton « + » passe de `#5f58ea` à la couleur de
  marque, seul écart visuel).

Au passage, deux défauts ont été corrigés : les sous-tâches créées depuis la
feuille d'ajout rapide étaient enregistrées sans identifiant ni état
(`as any` masquait l'erreur de type), et `app/task/[id].tsx` définissait ses
composants `Row` et `Divider` pendant le rendu (13 erreurs ESLint sur ce
fichier). L'analyse statique est désormais vierge sur l'ensemble du dépôt
(17 problèmes avant, 0 après).
