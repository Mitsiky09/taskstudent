import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../providers.dart';

/// État exposé par le ViewModel des tâches.
///
/// Immuable et comparable champ à champ : Riverpod 3 filtre les notifications
/// avec `==`, donc deux états identiques ne redessinent pas l'écran.
class TasksState {
  /// État de la liste de tâches.
  const TasksState({
    this.isLoading = true,
    this.tasks = const <Task>[],
    this.filter = TaskFilter.all,
    this.sort = TaskSort.date,
    this.query = '',
  });

  /// `true` tant que le stockage n'a pas été lu.
  final bool isLoading;

  /// Toutes les tâches connues, archives comprises.
  final List<Task> tasks;

  /// Filtre de liste actif.
  final TaskFilter filter;

  /// Tri actif.
  final TaskSort sort;

  /// Recherche plein texte.
  final String query;

  /// Copie en remplaçant certains champs.
  TasksState copyWith({
    bool? isLoading,
    List<Task>? tasks,
    TaskFilter? filter,
    TaskSort? sort,
    String? query,
  }) =>
      TasksState(
        isLoading: isLoading ?? this.isLoading,
        tasks: tasks ?? this.tasks,
        filter: filter ?? this.filter,
        sort: sort ?? this.sort,
        query: query ?? this.query,
      );

  /// Tâches à afficher : visibles, filtrées, cherchées, triées.
  List<Task> visible(List<Subject> categories) => sortTasks(
        searchTasks(
          filterTasks(visibleTasks(tasks), filter),
          query,
          (task) => subjectNameOf(task, categories),
        ),
        sort,
      );

  /// Regroupement par jour d'échéance, pour les listes à sections.
  List<DateSection> sections(List<Subject> categories) => groupByDate(visible(categories));

  /// Archives, plus récentes d'abord.
  List<Task> get archived => archivedTasks(tasks).reversed.toList(growable: false);

  /// Statistiques globales.
  TaskStats get stats => computeStats(tasks);

  @override
  bool operator ==(Object other) =>
      other is TasksState &&
      other.isLoading == isLoading &&
      other.filter == filter &&
      other.sort == sort &&
      other.query == query &&
      _sameTasks(other.tasks, tasks);

  @override
  int get hashCode => Object.hash(isLoading, tasks.length, filter, sort, query);
}

bool _sameTasks(List<Task> a, List<Task> b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

/// ViewModel des tâches.
///
/// Toutes les règles métier sont dans le noyau ([TaskRepository]) : ce
/// ViewModel se contente de charger, d'exposer un état de vue et de demander la
/// persistance. C'est la séparation attendue d'un ViewModel — aucune règle de
/// gestion ne doit apparaître ici.
class TasksNotifier extends Notifier<TasksState> {
  late TaskRepository _repository;

  @override
  TasksState build() {
    _repository = ref.read(taskRepositoryProvider);
    // Le chargement est asynchrone ; l'état initial affiche un indicateur.
    unawaited(load());
    return const TasksState();
  }

  /// Lit le stockage. [autoArchive] archive les tâches terminées depuis plus
  /// d'une semaine, comme le fait l'application quand la préférence est active.
  Future<void> load({bool autoArchive = false}) async {
    await _repository.load(autoArchive: autoArchive);
    if (!ref.mounted) return;
    state = state.copyWith(isLoading: false, tasks: _repository.tasks);
  }

  /// Recharge et répercute l'archivage automatique.
  Future<void> refresh() async {
    await _repository.save();
    await load();
  }

  /// Change le filtre de liste.
  void setFilter(TaskFilter filter) => state = state.copyWith(filter: filter);

  /// Change le tri.
  void setSort(TaskSort sort) => state = state.copyWith(sort: sort);

  /// Change la recherche.
  void setQuery(String query) => state = state.copyWith(query: query);

  /// Crée une tâche et la persiste.
  Future<Task> create(TaskInput input) async {
    final task = _repository.createTask(input);
    await _persist();
    return task;
  }

  /// Modifie une tâche existante (écran de détail).
  Future<void> update(String id, Task Function(Task task) patch) async {
    _repository.updateTask(id, patch);
    await _persist();
  }

  /// Coche ou décoche. Une tâche répétée avance d'un cycle au lieu d'être
  /// terminée — règle du noyau.
  Future<void> toggle(String id) async {
    _repository.toggleTask(id);
    await _persist();
  }

  /// Repousse l'échéance et marque la tâche « reportée ».
  Future<void> report(String id, DateTime due) async {
    _repository.reportTask(id, due);
    await _persist();
  }

  /// Archive une tâche.
  Future<void> archive(String id) async {
    _repository.archiveTask(id);
    await _persist();
  }

  /// Restaure une tâche archivée.
  Future<void> restore(String id) async {
    _repository.restoreTask(id);
    await _persist();
  }

  /// Supprime définitivement.
  Future<void> delete(String id) async {
    _repository.deleteTask(id);
    await _persist();
  }

  /// Vide les archives ; renvoie le nombre de tâches supprimées.
  Future<int> clearArchives() async {
    final removed = _repository.clearArchives();
    await _persist();
    return removed;
  }

  /// Ajoute une sous-tâche ; un titre vide est ignoré.
  Future<void> addSubtask(String taskId, String title) async {
    _repository.addSubtask(taskId, title);
    await _persist();
  }

  /// Inverse l'état d'une sous-tâche.
  Future<void> toggleSubtask(String taskId, String subtaskId) async {
    _repository.toggleSubtask(taskId, subtaskId);
    await _persist();
  }

  /// Applique l'archivage automatique sans recharger le stockage.
  Future<void> applyAutoArchive() async {
    if (_repository.applyAutoArchiveNow()) {
      await _persist();
    }
  }

  /// Répercute l'état du dépôt sur la vue, puis persiste.
  ///
  /// `ref.mounted` est vérifié avant de toucher à `state` : depuis Riverpod 3,
  /// utiliser un `Ref` disposé lève une exception.
  Future<void> _persist() async {
    if (!ref.mounted) return;
    state = state.copyWith(tasks: _repository.tasks);
    await _repository.save();
  }
}

/// ViewModel des tâches, exposé aux écrans.
final NotifierProvider<TasksNotifier, TasksState> tasksProvider =
    NotifierProvider<TasksNotifier, TasksState>(TasksNotifier.new);
