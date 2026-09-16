import '../constants.dart';
import '../models/task.dart';
import '../storage.dart';
import 'ids.dart';
import 'migration.dart';
import 'task_logic.dart';

/// Mutations de tâche, portées de `context/TasksContext.tsx`.
///
/// Deux niveaux :
///
/// * des **transformations pures** ([completeTask], [toggleTaskCompletion]…),
///   testables sans stockage ;
/// * [TaskRepository], qui les applique à une liste et la persiste.
///
/// Le fournisseur de contexte React et ses `useCallback` disparaissent : en
/// Dart, l'état vit dans le dépôt et l'interface s'y abonne. Les règles
/// métier, elles, sont reproduites à l'identique.
library;

/// Marque une tâche terminée à l'instant [now].
Task completeTask(Task task, DateTime now) => task.copyWith(
      status: TaskStatus.completed,
      completedAt: now.toUtc().toIso8601String(),
      clearArchivedAt: true,
    );

/// Remet une tâche terminée à l'état actif, sans date de complétion.
Task uncompleteTask(Task task) => task.copyWith(
      status: TaskStatus.active,
      clearCompletedAt: true,
    );

/// Coche ou décoche une tâche, règle de répétition comprise.
///
/// Ordre des cas, identique à la version React Native :
///
/// 1. une tâche déjà terminée redevient active (et perd sa date de
///    complétion) ;
/// 2. une tâche répétée n'est jamais « terminée » : elle avance d'un cycle,
///    redevient active et perd ses marques de report ;
/// 3. sinon elle passe à « terminée » avec l'horodatage courant.
Task toggleTaskCompletion(Task task, DateTime now) {
  if (task.status == TaskStatus.completed) return uncompleteTask(task);

  final next = nextOccurrence(task.due, task.repeat);
  if (next != null) {
    return task.copyWith(
      dueDate: next,
      status: TaskStatus.active,
      clearCompletedAt: true,
      clearReportedAt: true,
    );
  }
  return completeTask(task, now);
}

/// Archive une tâche à l'instant [now].
Task archiveTaskNow(Task task, DateTime now) => task.copyWith(
      status: TaskStatus.archived,
      archivedAt: now.toUtc().toIso8601String(),
    );

/// Sort une tâche des archives : elle redevient active et perd ses
/// horodatages de complétion et d'archivage.
Task restoreTaskToActive(Task task) => task.copyWith(
      status: TaskStatus.active,
      clearCompletedAt: true,
      clearArchivedAt: true,
    );

/// Repousse l'échéance d'une tâche et la marque « reportée ».
Task reportTaskTo(Task task, DateTime due, DateTime now) => task.copyWith(
      dueDate: due,
      reportedAt: now.toUtc().toIso8601String(),
    );

/// Inverse l'état d'une sous-tâche.
Task toggleSubtaskCompletion(Task task, String subtaskId) => task.copyWith(
      subtasks: task.subtasks
          .map((s) => s.id == subtaskId ? s.copyWith(isCompleted: !s.isCompleted) : s)
          .toList(growable: false),
    );

/// Ajoute une sous-tâche en fin de liste.
///
/// Le titre est trimé ; un titre vide ne doit pas créer de sous-tâche (le
/// dépôt filtre ce cas avant d'appeler cette fonction).
Task appendSubtask(Task task, String title, String subtaskId) => task.copyWith(
      subtasks: <Subtask>[
        ...task.subtasks,
        Subtask(id: subtaskId, title: title, isCompleted: false),
      ],
    );

/// Crée une tâche à partir des champs saisis.
///
/// C'est la seule fonction qui pose `createdAt` et l'identifiant : aucune
/// autre mutation ne doit y toucher.
Task buildTask(TaskInput input, DateTime now, [String? id]) => Task(
      id: id ?? createId(),
      title: input.title,
      description: input.description,
      dueDate: input.dueDate.toUtc().toIso8601String(),
      priority: input.priority,
      subjectId: input.subjectId,
      status: TaskStatus.active,
      subtasks: input.subtasks,
      reminders: input.reminders,
      reportedAt: input.reportedAt,
      durationMinutes: input.durationMinutes,
      note: input.note,
      repeat: input.repeat,
      createdAt: now.toUtc().toIso8601String(),
    );

/// Source de vérité des tâches : lecture, mutations, persistance.
///
/// Deux garde-fous hérités de la version React Native et conservés ici :
///
/// 1. **Toute mutation part de l'état courant du dépôt**, jamais d'une copie
///    capturée plus tôt : deux actions rapprochées (cocher deux tâches
///    d'affilée) ne peuvent pas s'écraser.
/// 2. **La persistance est explicite** ([save]) et n'a lieu qu'après
///    [load] : sans cela, le premier affichage écrirait une liste vide
///    par-dessus les données de l'utilisateur.
class TaskRepository {
  /// Crée un dépôt branché sur [store].
  ///
  /// [clock] est injectable pour rendre les tests déterministes.
  TaskRepository({required this.store, DateTime Function()? clock})
      : _clock = clock ?? DateTime.now;

  /// Stockage clé/valeur sous-jacent.
  final KeyValueStore store;

  final DateTime Function() _clock;
  final List<Task> _tasks = <Task>[];
  bool _loaded = false;

  /// Tâches connues, en lecture seule.
  ///
  /// La liste est recopiée à chaque accès pour qu'un appelant ne puisse pas
  /// contourner les mutations (et donc la persistance).
  List<Task> get tasks => List<Task>.unmodifiable(_tasks);

  /// `true` une fois [load] terminé.
  bool get isLoaded => _loaded;

  /// Charge les tâches depuis le stockage.
  ///
  /// Les enregistrements passent par [migrateTasks] : une donnée écrite par
  /// une version antérieure (nom de matière au lieu de `subjectId`) est
  /// convertie au chargement plutôt qu'à l'écriture.
  ///
  /// [autoArchive] archive les tâches terminées depuis plus de
  /// [kAutoArchiveDays] jours, comme le fait l'application quand la
  /// préférence correspondante est activée.
  Future<void> load({bool autoArchive = false}) async {
    final raw = await readJsonList(store, StorageKeys.tasks);
    var migrated = migrateTasks(raw);
    if (autoArchive) {
      migrated = applyAutoArchive(migrated, _clock());
    }
    _tasks
      ..clear()
      ..addAll(migrated);
    _loaded = true;
  }

  /// Écrit la liste courante dans le stockage.
  ///
  /// À n'appeler qu'après [load] : sinon une liste encore vide écraserait les
  /// données existantes.
  Future<void> save() async {
    if (!_loaded) return;
    await writeJson(
      store,
      StorageKeys.tasks,
      _tasks.map((task) => task.toJson()).toList(growable: false),
    );
  }

  /// Ajoute une tâche créée par [buildTask].
  ///
  /// La programmation des rappels (`task.reminders`) reste à la couche
  /// applicative : le noyau n'importe aucun plugin de notifications.
  Task createTask(TaskInput input, {String? id}) {
    final task = buildTask(input, _clock(), id);
    _tasks.add(task);
    return task;
  }

  /// Applique une modification ciblée à la tâche [id].
  ///
  /// Retourne la tâche modifiée, ou `null` si l'identifiant est inconnu.
  Task? updateTask(String id, Task Function(Task task) patch) {
    final index = _tasks.indexWhere((task) => task.id == id);
    if (index < 0) return null;
    final next = patch(_tasks[index]);
    _tasks[index] = next;
    return next;
  }

  /// Supprime définitivement une tâche.
  bool deleteTask(String id) {
    final before = _tasks.length;
    _tasks.removeWhere((task) => task.id == id);
    return _tasks.length != before;
  }

  /// Coche ou décoche une tâche (voir [toggleTaskCompletion]).
  Task? toggleTask(String id) => updateTask(id, (task) => toggleTaskCompletion(task, _clock()));

  /// Inverse l'état d'une sous-tâche.
  Task? toggleSubtask(String taskId, String subtaskId) =>
      updateTask(taskId, (task) => toggleSubtaskCompletion(task, subtaskId));

  /// Ajoute une sous-tâche ; un titre vide (ou uniquement des espaces) est
  /// ignoré.
  Task? addSubtask(String taskId, String title) {
    final trimmed = title.trim();
    if (trimmed.isEmpty) return null;
    return updateTask(
      taskId,
      (task) => appendSubtask(task, trimmed, createId('s')),
    );
  }

  /// Archive une tâche.
  Task? archiveTask(String id) => updateTask(id, (task) => archiveTaskNow(task, _clock()));

  /// Restaure une tâche archivée.
  Task? restoreTask(String id) => updateTask(id, restoreTaskToActive);

  /// Vide les archives.
  ///
  /// Retourne le nombre de tâches supprimées, pour permettre une confirmation
  /// chiffrée à l'écran.
  int clearArchives() {
    final before = _tasks.length;
    _tasks.removeWhere((task) => task.status == TaskStatus.archived);
    return before - _tasks.length;
  }

  /// Repousse l'échéance d'une tâche et la marque reportée.
  Task? reportTask(String id, DateTime due) =>
      updateTask(id, (task) => reportTaskTo(task, due, _clock()));

  /// Applique l'archivage automatique aux tâches chargées.
  ///
  /// Ne fait rien si la liste ne change pas (identité préservée par
  /// [applyAutoArchive]), ce qui évite une écriture inutile.
  bool applyAutoArchiveNow() {
    final next = applyAutoArchive(_tasks, _clock());
    if (identical(next, _tasks)) return false;
    _tasks
      ..clear()
      ..addAll(next);
    return true;
  }
}
