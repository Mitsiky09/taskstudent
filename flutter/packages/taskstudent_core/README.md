# TaskStudent — noyau métier (Dart)

Port Dart de la logique de l'application **TaskStudent** (Expo / React Native,
dépôt `Mitsiky09/taskstudent`). Ce paquet ne contient **aucun widget** : il
regroupe les modèles, la logique pure, la migration des données et l'export, de
sorte que tout se teste avec `dart test`, sans SDK Flutter installé.

Ce paquet est la couche **Modèle** de l'application Flutter
(`../taskstudent_app`) : il ne dépend ni de Flutter ni d'aucun paquet pub.

```
packages/taskstudent_core/
├── pubspec.yaml              # paquet taskstudent_core, zéro dépendance d'exécution
├── analysis_options.yaml     # lints/recommended + strict-casts / strict-inference
├── lib/
│   ├── taskstudent.dart      # baril : un seul import pour tout consommer
│   └── src/
│       ├── constants.dart    # catégories, couleurs, libellés, clés de stockage
│       ├── theme.dart        # tokens du design system (couleurs en #rrggbb)
│       ├── storage.dart      # interface KeyValueStore + lectures JSON protégées
│       ├── models/task.dart  # Task, Subtask, Subject, Settings, LocalUser, TaskInput
│       └── logic/
│           ├── dates.dart           # clés de jour, périodes, formatage français
│           ├── task_logic.dart      # filtres, tris, stats, tendances, auto-archive
│           ├── task_repository.dart # mutations (toggle, report, sous-tâches) + persistance
│           ├── migration.dart       # conversion des données de l'ancien modèle
│           ├── serialize.dart       # export CSV (RFC 4180) et JSON
│           └── ids.dart             # identifiants locaux
└── test/                     # 4 suites / 101 cas, miroir des suites Jest d'origine
```

## Vérifier

```bash
cd flutter/packages/taskstudent_core
dart pub get
dart test
```

`dart test` ne nécessite pas Flutter : le paquet n'importe que `dart:core`,
`dart:convert` et `dart:math`.

## Correspondance avec l'application d'origine

| React Native | Dart |
| --- | --- |
| `types/index.ts` | `lib/src/models/task.dart` |
| `lib/date.ts` | `lib/src/logic/dates.dart` |
| `lib/tasks.ts` | `lib/src/logic/task_logic.dart` |
| `context/TasksContext.tsx` | `lib/src/logic/task_repository.dart` |
| `lib/migration.ts` | `lib/src/logic/migration.dart` |
| `lib/serialize.ts` | `lib/src/logic/serialize.dart` |
| `lib/id.ts` | `lib/src/logic/ids.dart` |
| `lib/storage.ts` | `lib/src/storage.dart` |
| `constants/index.ts` | `lib/src/constants.dart` |
| `constants/theme.ts` | `lib/src/theme.dart` |
| `__tests__/*.test.ts` | `test/*_test.dart` |

## Choix de portage

1. **Format de persistance identique.** Mêmes noms de champs, mêmes valeurs
   (`'active'`, `'medium'`, `'weekly'`), dates en ISO 8601. Un export JSON
   produit par l'application Expo se recharge tel quel, et inversement. Les
   tests `migration_test.dart` le vérifient par un aller-retour complet.
2. **Aucune dépendance d'exécution.** Le formatage français des dates est porté
   à la main (`janv.`, `févr.`, `mardi 10 mars`) plutôt que délégué à `intl`, ce
   qui supprime l'initialisation de locale et ses risques d'exception au
   démarrage. Les libellés sont couverts par `date_test.dart`.
3. **Dates stockées en UTC, comparées en heure locale.** `Task.due` renvoie
   toujours une date locale ; toute clé de jour passe par `toDateKey`. C'est la
   règle du projet d'origine (un bug d'affichage en dépendait) et elle est
   ré-testée ici.
4. **Le stockage est une interface.** `KeyValueStore` définit trois méthodes ;
   l'implémentation `shared_preferences` appartient à la couche applicative.
   `MemoryStore` sert aux tests.
5. **Les tokens de design restent des chaînes `#rrggbb`.** Une `Color`
   demanderait `dart:ui`, donc Flutter. La couche applicative convertit
   (`Color(int.parse(hex.substring(1), radix: 16) | 0xFF000000)`).
6. **Les mutations sont des fonctions pures**, appliquées par `TaskRepository`.
   Les règles métier du fournisseur de contexte React sont reproduites à
   l'identique, y compris le cas des tâches répétées : cocher une tâche
   quotidienne ne la termine pas, elle avance d'un jour.

## Ce qui n'est pas encore porté

- **L'analyseur de saisie rapide** (`lib/quickadd.ts`, ~530 lignes : dates
  relatives en français, heures, récurrences). C'est le plus gros morceau
  restant ; il est purement textuel et se portera sans dépendance.
- **Les notifications locales** (`lib/notifications.ts`) : elles exigent un
  plugin. Le noyau expose `task.reminders` et laisse la programmation à la
  couche applicative.
- **L'interface** : écrans, navigation, thème Material. Les tokens et la logique
  sont prêts à être branchés.

## Comment l'application le consomme

`packages/taskstudent_app` déclare ce paquet en dépendance locale :

```yaml
dependencies:
  taskstudent_core:
    path: ../taskstudent_core
```

Le seul point de contact est l'interface [KeyValueStore], que l'application
implémente avec Hive (`HiveKeyValueStore`). Le noyau ignore donc totalement où
sont rangées les données :

```dart
import 'package:taskstudent_core/taskstudent.dart';

final repository = TaskRepository(store: HiveKeyValueStore(box));
await repository.load(autoArchive: true);

final enRetard = filterTasks(repository.tasks, TaskFilter.overdue);
final stats = computeStats(repository.tasks);
```

## État de la vérification

Ce paquet a été écrit dans un environnement **sans SDK Dart ni accès à
pub.dev** : `dart analyze` et `dart test` n'ont donc pas pu y être exécutés.
Les contrôles suivants ont été menés à la place, sur les 16 fichiers `.dart` :
équilibre des délimiteurs hors chaînes et commentaires, résolution de tous les
`import`/`export`, et résolution de chaque nom appelé ou préfixé
(`Classe.membre`) vers une déclaration existante. Ces contrôles ont détecté et
fait corriger une erreur réelle (mauvais chemin d'import dans
`constants.dart`).

**Reste à faire côté utilisateur :** `dart pub get && dart test`, puis
`dart analyze`. Les suites de test sont écrites pour `package:test` et couvrent
les mêmes cas que les suites Jest d'origine, augmentées de l'aller-retour de
stockage et des mutations du dépôt.
