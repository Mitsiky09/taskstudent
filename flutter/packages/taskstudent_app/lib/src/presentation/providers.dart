import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

/// Point de composition de l'architecture MVVM.
///
/// * **Modèle** : `taskstudent_core` (entités et règles métier) + Hive
///   (`data/hive/`), branchés ici.
/// * **ViewModel** : les `Notifier` de `presentation/viewmodels/`.
/// * **Vue** : les widgets de `presentation/screens/` et `widgets/`, qui ne
///   connaissent que les ViewModel.
///
/// Riverpod 3 : `Ref` n'a plus de paramètre générique, les variantes
/// `AutoDispose*` et `Family*` ont disparu au profit d'un `Notifier` unique, et
/// tous les providers filtrent leurs mises à jour avec `==`. C'est pour cela
/// que [Task] et [Settings] implémentent `operator ==` : sans ça, chaque
/// reconstruction d'objet redessinerait l'écran.

/// Stockage clé/valeur utilisé par toute l'application.
///
/// Volontairement non implémenté ici : il est **surchargé** au démarrage
/// (`main.dart` fournit [HiveKeyValueStore]) et dans les tests (qui fournissent
/// `MemoryStore`). Aucun ViewModel ni aucun écran ne dépend donc de Hive, ce
/// qui permet de tester la couche présentation sans système de fichiers.
final Provider<KeyValueStore> keyValueStoreProvider = Provider<KeyValueStore>(
  (ref) => throw StateError(
    'keyValueStoreProvider doit être surchargé dans ProviderScope : '
    'HiveKeyValueStore en production, MemoryStore dans les tests.',
  ),
);

/// Source de vérité des tâches.
///
/// Le dépôt vient du noyau : il applique déjà les règles métier (tâches
/// répétées, archivage automatique, garde-fou d'écrasement avant chargement).
final Provider<TaskRepository> taskRepositoryProvider = Provider<TaskRepository>(
  (ref) => TaskRepository(store: ref.watch(keyValueStoreProvider)),
);

/// Catégories disponibles, lues depuis les préférences.
///
/// Le noyau fournit les catégories par défaut ; l'utilisateur peut les
/// renommer ou en ajouter sans migration, puisque les tâches ne référencent
/// qu'un identifiant.
final Provider<List<Subject>> categoriesProvider = Provider<List<Subject>>(
  (ref) => ref.watch(settingsProvider).settings.categories,
);

/// Nom d'une catégorie, pour la recherche plein texte.
String subjectNameOf(Task task, List<Subject> categories) =>
    getCategory(categories, task.subjectId).name;
