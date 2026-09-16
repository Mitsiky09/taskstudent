# TaskStudent

Application mobile de gestion des devoirs pour étudiants, développée avec Expo et
React Native. Elle fonctionne **entièrement hors ligne** : toutes les données
restent sur l'appareil, aucune requête réseau n'est effectuée.

## Problématique

Les étudiants jonglent entre agendas papier, notes dans le téléphone et
plateformes pédagogiques hétérogènes. TaskStudent vise un usage unique et
rapide : saisir un devoir en quelques secondes, voir d'un coup d'œil ce qui est
dû aujourd'hui, ce qui est en retard, et conserver une trace des travaux rendus.

## Fonctionnalités

- **Tâches** : création, consultation, modification, suppression, sous-tâches,
  priorité (basse / moyenne / haute) et matière.
- **Accueil** : mise en avant des tâches en retard, des échéances du jour et des
  trois prochaines échéances.
- **Liste complète** : recherche plein texte, filtres (toutes, en cours, en
  retard, cette semaine) et tri par échéance ou par priorité.
- **Calendrier** : mois marqué par matière (pastilles multicolores) et détail du
  jour sélectionné.
- **Archivage** : archivage manuel des tâches terminées, restauration,
  suppression définitive, recherche, regroupement par matière, archivage
  automatique optionnel après 7 jours.
- **Statistiques** : taux de complétion, retards, répartition par matière.
- **Rappels locaux** : notification programmée une heure avant l'échéance.
- **Export** : partage des tâches au format JSON ou CSV via la feuille de
  partage du système.
- **Session locale** et onboarding en trois étapes.

## Installation

```bash
npm install
npx expo start
```

Puis scanner le QR code avec Expo Go, ou lancer `npm run android` / `npm run ios`.

> Les rappels locaux nécessitent `expo-notifications`. En cas d'écart de version
> avec le SDK Expo installé, exécuter `npx expo install --fix`.

## Scripts

| Commande            | Rôle                                      |
| ------------------- | ----------------------------------------- |
| `npm start`         | Démarre le serveur de développement Expo  |
| `npm test`          | Lance la suite de tests unitaires (Jest)  |
| `npm run typecheck` | Vérifie le typage TypeScript sans émettre |
| `npm run lint`      | Analyse statique (ESLint)                 |
| `npm run format`    | Formate le code (Prettier)                |

## Architecture

```
app/              Routes (Expo Router, navigation par fichiers)
  (tabs)/         Accueil, Tâches, Calendrier, Archives, Profil
  auth/           Connexion et inscription locales
  onboarding/     Trois écrans d'introduction
  task/           Création et détail d'une tâche
components/       Composants d'interface réutilisables
context/          Contextes React : tâches, session, préférences
hooks/            Accès typés aux contextes et vues dérivées
lib/              Logique métier pure et adaptateurs techniques
constants/        Matières, clés de stockage, palette
types/            Types métier partagés
__tests__/        Tests unitaires de la logique métier
```

Le principe directeur est la séparation entre **logique métier pure**
(`lib/tasks.ts`, `lib/date.ts`, `lib/serialize.ts`, `lib/migration.ts`, sans
aucune dépendance à React) et **couche d'interface** (composants et écrans).
C'est ce qui rend la logique testable sans monter de rendu.

## Choix techniques

**Expo Router** plutôt qu'une configuration manuelle de React Navigation : la
navigation par fichiers rend l'arborescence des écrans lisible directement dans
le dépôt, et les routes typées sont activées (`experiments.typedRoutes`).

**Context API** plutôt qu'un store externe : l'application manipule un seul
agrégat (les tâches), stocké localement et de volume modeste. Introduire Redux
ou Zustand aurait ajouté une dépendance sans bénéfice mesurable ici.

**AsyncStorage** comme unique persistance, conformément au choix hors ligne. Les
tâches sont sérialisées en JSON, les dates en ISO 8601.

**NativeWind** pour styliser avec les classes utilitaires Tailwind, ce qui évite
la dispersion des `StyleSheet.create` et garde la charte cohérente.

### Décisions notables

- **Dates comparées en heure locale.** `Date.toISOString()` convertit en UTC :
  s'en servir pour construire une clé de jour décale les échéances du soir d'une
  journée dans les fuseaux non nuls (UTC+3 à Antananarivo). Toutes les clés
  passent par `toDateKey` (`lib/date.ts`), couverte par un test de régression.
- **Mutations par mise à jour fonctionnelle.** `setTasks(previous => …)` évite
  les écritures concurrentes : deux actions rapprochées ne repartent plus du même
  état capturé. La persistance est un effet dérivé de l'état, déclenché
  uniquement après hydratation pour ne pas écraser le stockage au premier rendu.
- **Matière normalisée.** Une tâche ne stocke que `subjectId` ; le nom et la
  couleur sont résolus à l'affichage. Les données de l'ancien modèle (nom
  recopié dans chaque tâche) sont converties au chargement par `lib/migration.ts`.
- **Lectures de stockage défensives.** Un JSON corrompu renvoie la valeur par
  défaut au lieu de faire planter l'application au lancement.
- **Session locale assumée.** Il n'y a ni serveur ni vérification de mot de
  passe : l'écran de connexion sert à personnaliser l'application et à garder
  l'entrée. Ce point est indiqué à l'utilisateur dans l'interface et constitue
  une limite explicite, pas un oubli.

## Tests

```bash
npm test
```

38 tests unitaires couvrent les filtres, les tris, la recherche, le calcul des
statistiques, l'archivage automatique, la migration des données et l'export
CSV/JSON, dont un test de régression sur le décalage de fuseau horaire.

Jest utilise sa propre configuration TypeScript (`tsconfig.jest.json`) : les
modules testés ne dépendent pas de React Native, donc aucun environnement de
rendu n'est nécessaire.

## Limites connues et perspectives

- Pas de synchronisation multi-appareils ni de compte distant : l'ajout d'une API
  et d'une file de synchronisation est la suite logique.
- Les matières sont figées dans `constants/index.ts` ; leur gestion par
  l'utilisateur (création, renommage, couleur) est préparée par la normalisation
  du modèle mais non implémentée.
- Thème sombre non pris en charge ; l'application est forcée en thème clair.
- Les rappels sont reprogrammés à la création de la tâche uniquement : modifier
  l'échéance d'une tâche existante ne décale pas encore la notification.
- Les pièces jointes, présentes dans une première maquette, ont été retirées du
  modèle faute d'implémentation.
