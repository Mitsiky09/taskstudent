# TaskStudent — port Flutter

Port de l'application Expo/React Native `Mitsiky09/taskstudent`, organisé en
deux paquets :

```
flutter/
├── packages/
│   ├── taskstudent_core/     # logique métier pure (Dart, zéro dépendance)
│   └── taskstudent_app/      # application Flutter (MVVM, Riverpod 3, Hive CE)
└── README.md
```

| Paquet | Rôle | Dépendances | Se teste avec |
| --- | --- | --- | --- |
| `taskstudent_core` | entités, dates, filtres, statistiques, migration, export | aucune | `dart test` |
| `taskstudent_app` | écrans, état, persistance | flutter, flutter_riverpod, hive_ce, path_provider | `flutter test` |

Cette séparation n'est pas décorative : elle garantit qu'aucune règle de gestion
ne peut se glisser dans un widget, et que le cœur de l'application se teste sans
émulateur ni système de fichiers.

## Architecture MVVM

```
┌──────────────────────── Vue ────────────────────────┐
│ presentation/screens/  ·  presentation/widgets/      │   widgets muets,
│ HomeScreen · TaskDetailScreen · StatsScreen · TaskTile│   aucun calcul
└───────────────────────────┬──────────────────────────┘
                            │ ref.watch / ref.read
┌────────────────────── ViewModel ─────────────────────┐
│ presentation/viewmodels/                             │   Notifier Riverpod 3
│ TasksNotifier · SettingsNotifier                     │   état immuable + ==
│ presentation/providers.dart  (point de composition)  │
└───────────────────────────┬──────────────────────────┘
                            │ TaskRepository (du noyau)
┌─────────────────────── Modèle ───────────────────────┐
│ taskstudent_core : entités et règles métier          │
│ data/hive/ : HiveKeyValueStore, HiveBootstrap        │   persistance
└──────────────────────────────────────────────────────┘
```

* **Modèle** — `taskstudent_core` (règles métier) + `data/hive/` (persistance).
  Hive n'apparaît que dans deux fichiers ; le noyau ne connaît que l'interface
  `KeyValueStore` (trois méthodes asynchrones).
* **ViewModel** — un `Notifier` Riverpod par domaine. Ils exposent un état
  immuable ([TasksState], [SettingsState]) et délèguent toute règle au noyau.
* **Vue** — des widgets qui reçoivent des données et des rappels. `TaskTile`,
  par exemple, ne connaît ni Riverpod ni Hive.

## Pourquoi ces paquets

**Riverpod 3** (`flutter_riverpod: ^3.0.0`). La série 3 unifie l'API :
`AutoDisposeNotifier` et `FamilyNotifier` disparaissent au profit d'un seul
`Notifier`, et `Ref` perd son paramètre générique. `StateProvider` et
`StateNotifierProvider` sont devenus « legacy » (import
`flutter_riverpod/legacy.dart`) : ce projet ne les utilise pas, tout passe par
`Notifier`. Autre point exploité ici : tous les providers filtrent désormais
leurs mises à jour avec `==`, d'où l'`operator ==` sur `Task`, `Settings`,
`TasksState` et `SettingsState` — sans lui, chaque reconstruction d'objet
redessinerait l'écran.

**Hive CE** (`hive_ce: ^2.19.0`). Le paquet `hive` d'origine n'est plus maintenu
par son auteur ; `hive_ce` (Community Edition) en est la continuation, avec la
même API. Les données sont stockées en JSON texte sous les clés
`@taskstudent/tasks` et `@taskstudent/settings` : le format reste identique à
celui de l'application Expo, un enregistrement écrit par l'une est lisible par
l'autre.

`^3.0.0` et `^2.19.0` laissent `pub get` choisir la dernière version compatible
(hive_ce 2.19.3 est la dernière publiée en février 2026).

## Lancer l'application

```bash
cd flutter/packages/taskstudent_app
flutter create .            # génère android/, ios/, web/… (une seule fois)
flutter pub get
flutter run
```

Les tests :

```bash
cd flutter/packages/taskstudent_core && dart pub get && dart test
cd flutter/packages/taskstudent_app  && flutter test
```

Le test du ViewModel (`test/tasks_viewmodel_test.dart`) remplace Hive par le
`MemoryStore` du noyau via `keyValueStoreProvider.overrideWithValue(...)` : il
vérifie le chemin complet Vue → ViewModel → noyau → stockage sans écrire sur le
disque.

## Ce qui est fait

| Écran / brique | État |
| --- | --- |
| Noyau métier complet + 101 cas de test | fait |
| Thème Material généré depuis les tokens du noyau | fait |
| Persistance Hive + injection dans Riverpod | fait |
| Accueil : sections par jour, filtres, report, création rapide | fait |
| Détail de tâche : sous-tâches, report, archive, suppression | fait |
| Statistiques : semaine, tendance 14 jours, répartition | fait |

## Ce qui reste à porter

* Écrans **Calendrier**, **À venir**, **Archives**, **Profil** et
  **authentification** (la logique qu'ils affichent existe déjà dans le noyau :
  `groupByDate`, `allUpcomingTasks`, `archivedThisMonth`, `LocalUser`).
* Navigation par onglets (`NavigationBar`) équivalente au bottom nav de
  l'application Expo.
* **Saisie rapide** (`lib/quickadd.ts`, ~530 lignes : dates relatives en
  français, heures, récurrences) — purement textuel, il rejoindra le noyau.
* **Notifications locales** : le noyau expose `task.reminders`, la
  programmation demande un plugin (`flutter_local_notifications`).
* Création/édition complète d'une tâche (le dialogue actuel couvre le cas
  simple : titre + catégorie + échéance du jour).

## État de la vérification

Aucun SDK Dart ni Flutter n'était disponible dans l'environnement d'écriture, et
pub.dev y est inaccessible : `flutter pub get`, `dart analyze` et les tests
**n'ont pas pu être exécutés**. À la place, un contrôle statique a été passé sur
les 29 fichiers `.dart` (équilibre des délimiteurs hors chaînes et commentaires,
résolution de chaque `import`, résolution de chaque fonction appelée et de
chaque `MaClasse.membre` vers une déclaration existante) : aucun problème. Ce
contrôle a été validé en y réinjectant des fautes — il signale bien un appel de
fonction inexistant comme un membre inexistant.

Il a déjà permis de corriger une erreur réelle : un chemin d'import faux dans
`constants.dart` du noyau.

**Reste à faire de ton côté**, dans l'ordre :

```bash
cd flutter/packages/taskstudent_core && dart pub get && dart test && dart analyze
cd ../taskstudent_app && flutter pub get && flutter test && flutter analyze
```
