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
│ TasksNotifier · SettingsNotifier · SessionNotifier   │   état immuable + ==
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

| Brique | Détail |
| --- | --- |
| Noyau métier | complet, 101 cas de test |
| Thème | Material 3 généré depuis les tokens du noyau, aucune couleur en dur |
| Persistance | Hive CE derrière `KeyValueStore`, injectée par `ProviderScope.overrides` |
| Garde de navigation | `AuthGate` : introduction → connexion → onglets (port de `app/index.tsx`) |
| Introduction | 3 écrans, titres et emojis repris de l'application d'origine |
| Connexion / création de compte | locales, plus mode invité (port de `SessionContext`) |
| Coque à onglets | `NavigationBar` : Accueil, Aujourd'hui, Agenda, Profil + bouton d'ajout |
| Accueil | sections par jour, filtres, report par appui long |
| Aujourd'hui | retard / jour même / 3 prochaines échéances, compteurs |
| Agenda | grille mensuelle maison, pastilles par jour, détail du jour choisi |
| Toutes les tâches | recherche, filtres, bascule de tri |
| Archives | restauration à l'unité, vidage avec confirmation |
| Détail de tâche | sous-tâches, report, archivage, suppression |
| Création / édition | formulaire complet : description, durée, répétition, remarque |
| Profil | préférences, catégories (ajout, renommage, suppression), export JSON/CSV au presse-papiers, déconnexion |
| Statistiques | semaine, tendance 14 jours, répartition par catégorie |
| Saisie rapide | `quick_add.dart` dans le noyau (dates en français, heures, récurrences, `#catégorie`, `p1`…`p4`, description) + barre de saisie à pastilles sur l'accueil |

## Ce qui reste à porter

* **Notifications locales** : le noyau expose `task.reminders` et le profil
  expose le réglage, mais la programmation demande un plugin
  (`flutter_local_notifications`).
* Sous-tâches : renommage, suppression et réordonnancement (absents de
  l'application d'origine également).
* Saisie rapide : panneau d'options (échéance manuelle, priorité, catégorie)
  comme dans `components/QuickAdd.tsx` ; seule la phrase est gérée ici.
* Thème sombre (les tokens s'y prêtent, aucune couleur n'est en dur).

## État de la vérification

Aucun SDK Dart ni Flutter n'était disponible dans l'environnement d'écriture, et
pub.dev y est inaccessible : `flutter pub get`, `dart analyze` et les tests
**n'ont pas pu être exécutés**. À la place, un contrôle statique a été passé sur
les 45 fichiers `.dart` (équilibre des délimiteurs hors chaînes et commentaires,
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
