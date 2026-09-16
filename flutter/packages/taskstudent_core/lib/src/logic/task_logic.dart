import '../constants.dart';
import '../models/task.dart';
import 'dates.dart';

/// Logique métier pure, portée de `lib/tasks.ts`.
///
/// Aucune dépendance à Flutter : ces fonctions se testent avec `dart test`
/// (voir `test/task_logic_test.dart`), comme l'étaient leurs équivalents avec
/// Jest côté React Native.
library;

/// Filtres de liste de tâches.
enum TaskFilter {
  all('all', 'Toutes'),
  active('active', 'En cours'),
  overdue('overdue', 'En retard'),
  reported('reported', 'Reportées'),
  week('week', 'Cette semaine');

  const TaskFilter(this.wire, this.label);

  /// Valeur technique, utilisée dans les paramètres de route.
  final String wire;

  /// Libellé affiché.
  final String label;

  /// Résout un filtre depuis sa valeur technique ; retombe sur [all].
  static TaskFilter fromWire(Object? value) =>
      TaskFilter.values.firstWhere((f) => f.wire == value, orElse: () => TaskFilter.all);
}

/// Tris disponibles.
enum TaskSort {
  date('date'),
  priority('priority');

  const TaskSort(this.wire);

  /// Valeur technique.
  final String wire;
}

const Map<Priority, int> _priorityRank = <Priority, int>{
  Priority.high: 0,
  Priority.medium: 1,
  Priority.low: 2,
};

/// Tâche active dont l'échéance est passée.
bool isOverdue(Task task, [DateTime? now]) =>
    task.status == TaskStatus.active && task.due.isBefore(now ?? DateTime.now());

/// Tâche dont l'échéance tombe aujourd'hui (terminée ou non).
bool isDueToday(Task task, [DateTime? now]) => isSameDay(task.due, now ?? DateTime.now());

/// Tâche active qui a été « reportée » (échéance repoussée manuellement).
bool isReported(Task task) => task.status == TaskStatus.active && task.reportedAt != null;

/// Prochaine occurrence d'une tâche répétée, à partir de son échéance
/// actuelle ; `null` si la règle est « aucune ».
DateTime? nextOccurrence(DateTime due, RepeatRule rule) {
  switch (rule) {
    case RepeatRule.daily:
      return addDays(due, 1);
    case RepeatRule.weekly:
      return addDays(due, 7);
    case RepeatRule.monthly:
      return DateTime(due.year, due.month + 1, due.day, due.hour, due.minute);
    case RepeatRule.none:
      return null;
  }
}

/// Libellé français d'une règle de répétition, tel qu'affiché dans le résumé
/// d'une tâche (voir [kRepeatDisplayLabels]).
String repeatLabel(RepeatRule rule) =>
    kRepeatDisplayLabels[rule] ?? kRepeatDisplayLabels[RepeatRule.none]!;

/// Tâches visibles au quotidien : tout sauf les archives.
List<Task> visibleTasks(List<Task> tasks) =>
    tasks.where((t) => t.status != TaskStatus.archived).toList(growable: false);

/// Tâches archivées.
List<Task> archivedTasks(List<Task> tasks) =>
    tasks.where((t) => t.status == TaskStatus.archived).toList(growable: false);

/// Applique un filtre de liste.
List<Task> filterTasks(List<Task> tasks, TaskFilter filter, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  final weekEnd = addDays(reference, 7);
  switch (filter) {
    case TaskFilter.active:
      return tasks.where((t) => t.status == TaskStatus.active).toList(growable: false);
    case TaskFilter.overdue:
      return tasks.where((t) => isOverdue(t, reference)).toList(growable: false);
    case TaskFilter.reported:
      return tasks.where(isReported).toList(growable: false);
    case TaskFilter.week:
      return tasks
          .where((t) => !t.due.isBefore(reference) && !t.due.isAfter(weekEnd))
          .toList(growable: false);
    case TaskFilter.all:
      return List<Task>.of(tasks);
  }
}

/// Trie par échéance ou par priorité (puis échéance à priorité égale).
///
/// Renvoie toujours une nouvelle liste : l'entrée n'est jamais modifiée.
List<Task> sortTasks(List<Task> tasks, TaskSort sort) {
  final copy = List<Task>.of(tasks);
  if (sort == TaskSort.priority) {
    copy.sort((a, b) {
      final rank = (_priorityRank[a.priority] ?? 1) - (_priorityRank[b.priority] ?? 1);
      if (rank != 0) return rank;
      return a.due.compareTo(b.due);
    });
    return copy;
  }
  copy.sort((a, b) => a.due.compareTo(b.due));
  return copy;
}

/// Recherche plein texte sur le titre, la description et le nom de catégorie.
///
/// [subjectName] est injecté pour rester indépendant des préférences
/// utilisateur (comme dans la version React Native).
List<Task> searchTasks(
  List<Task> tasks,
  String query,
  String Function(Task task) subjectName,
) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return List<Task>.of(tasks);
  return tasks
      .where((t) =>
          '${t.title} ${t.description} ${subjectName(t)}'.toLowerCase().contains(q))
      .toList(growable: false);
}

/// Tâches visibles dont l'échéance tombe le jour de [dateKey].
List<Task> tasksDueOn(List<Task> tasks, String dateKey) =>
    visibleTasks(tasks).where((t) => toDateKey(t.due) == dateKey).toList(growable: false);

/// Prochaines échéances après aujourd'hui, triées et bornées.
List<Task> upcomingTasks(List<Task> tasks, [DateTime? now, int limit = 3]) {
  final reference = now ?? DateTime.now();
  final upcoming = visibleTasks(tasks)
      .where((t) => t.due.isAfter(reference) && !isSameDay(t.due, reference))
      .toList(growable: false);
  final sorted = sortTasks(upcoming, TaskSort.date);
  return sorted.length <= limit ? sorted : sorted.sublist(0, limit);
}

/// Tâches actives à priorité haute (P1), hors retard.
List<Task> importantTasks(List<Task> tasks, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  return sortTasks(
    visibleTasks(tasks)
        .where((t) =>
            t.status == TaskStatus.active &&
            t.priority == Priority.high &&
            !isOverdue(t, reference))
        .toList(growable: false),
    TaskSort.date,
  );
}

/// Toutes les tâches visibles à partir d'aujourd'hui, triées par échéance.
List<Task> allUpcomingTasks(List<Task> tasks, [DateTime? now]) {
  final todayStart = startOfDay(now ?? DateTime.now());
  return sortTasks(
    visibleTasks(tasks).where((t) => !t.due.isBefore(todayStart)).toList(growable: false),
    TaskSort.date,
  );
}

/// Groupe de tâches partageant la même journée d'échéance.
class DateSection {
  /// Section d'un jour.
  const DateSection({required this.dateKey, required this.label, required this.tasks});

  /// Clé `AAAA-MM-JJ`.
  final String dateKey;

  /// Libellé affiché (« Aujourd'hui », « Demain », sinon la date longue).
  final String label;

  /// Tâches du jour, triées par échéance.
  final List<Task> tasks;
}

String _daySectionLabel(DateTime date, DateTime now) {
  if (isSameDay(date, now)) return "Aujourd'hui";
  if (isSameDay(date, addDays(now, 1))) return 'Demain';
  return formatDay(date);
}

/// Regroupe des tâches par jour d'échéance (clé locale), trié par date.
List<DateSection> groupByDate(List<Task> tasks, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  final groups = <String, List<Task>>{};
  for (final task in tasks) {
    groups.putIfAbsent(toDateKey(task.due), () => <Task>[]).add(task);
  }
  final keys = groups.keys.toList()..sort();
  return keys
      .map((dateKey) => DateSection(
            dateKey: dateKey,
            label: _daySectionLabel(fromDateKey(dateKey), reference),
            tasks: sortTasks(groups[dateKey]!, TaskSort.date),
          ))
      .toList(growable: false);
}

/// Tâches archivées durant le mois courant.
List<Task> archivedThisMonth(List<Task> tasks, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  return archivedTasks(tasks).where((t) {
    final archivedAt = t.archivedAtDate;
    return archivedAt != null && isSameMonth(archivedAt, reference);
  }).toList(growable: false);
}

/// Regroupe des tâches par catégorie, en conservant l'ordre d'apparition.
Map<String, List<Task>> groupBySubject(List<Task> tasks) {
  final grouped = <String, List<Task>>{};
  for (final task in tasks) {
    grouped.putIfAbsent(task.subjectId, () => <Task>[]).add(task);
  }
  return grouped;
}

/// Répartition par catégorie.
class SubjectCount {
  /// Compte pour une catégorie.
  const SubjectCount({required this.subjectId, required this.total, required this.completed});

  /// Identifiant de catégorie.
  final String subjectId;

  /// Nombre de tâches.
  final int total;

  /// Nombre de tâches terminées.
  final int completed;
}

/// Statistiques globales.
class TaskStats {
  /// Statistiques d'un ensemble de tâches.
  const TaskStats({
    required this.total,
    required this.completed,
    required this.active,
    required this.overdue,
    required this.archived,
    required this.completionRate,
    required this.bySubject,
  });

  /// Nombre total de tâches.
  final int total;

  /// Tâches terminées au moins une fois.
  final int completed;

  /// Tâches en cours.
  final int active;

  /// Tâches en retard.
  final int overdue;

  /// Tâches archivées.
  final int archived;

  /// Taux de complétion en pourcentage arrondi.
  final int completionRate;

  /// Répartition par catégorie.
  final List<SubjectCount> bySubject;
}

/// Statistiques globales d'une liste de tâches.
TaskStats computeStats(List<Task> tasks, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  final completed = tasks.where((t) => t.completedAt != null).length;
  final grouped = groupBySubject(tasks);
  return TaskStats(
    total: tasks.length,
    completed: completed,
    active: tasks.where((t) => t.status == TaskStatus.active).length,
    overdue: tasks.where((t) => isOverdue(t, reference)).length,
    archived: archivedTasks(tasks).length,
    completionRate: tasks.isEmpty ? 0 : (completed / tasks.length * 100).round(),
    bySubject: grouped.entries
        .map((entry) => SubjectCount(
              subjectId: entry.key,
              total: entry.value.length,
              completed: entry.value.where((t) => t.completedAt != null).length,
            ))
        .toList(growable: false),
  );
}

/// Archive les tâches terminées depuis plus de [kAutoArchiveDays] jours.
///
/// Retourne **la même liste** (identité préservée) s'il n'y a rien à archiver,
/// ce qui évite une écriture inutile en stockage au démarrage — le même contrat
/// que la version React Native, où l'identité évitait un `setState` inutile.
List<Task> applyAutoArchive(List<Task> tasks, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  var changed = false;
  final next = tasks.map((task) {
    final completedAt = task.completedAtDate;
    if (task.status == TaskStatus.completed &&
        completedAt != null &&
        daysBetween(completedAt, reference) >= kAutoArchiveDays) {
      changed = true;
      return task.copyWith(
        status: TaskStatus.archived,
        archivedAt: reference.toUtc().toIso8601String(),
      );
    }
    return task;
  }).toList(growable: false);
  return changed ? next : tasks;
}

/// Nombre de tâches terminées pour un jour.
class DailyCount {
  /// Point d'une série temporelle.
  const DailyCount({required this.dateKey, required this.label, required this.count});

  /// Clé `AAAA-MM-JJ`.
  final String dateKey;

  /// Étiquette d'axe.
  final String label;

  /// Nombre de tâches.
  final int count;
}

/// Statistiques d'une période bornée.
class RangeStats {
  /// Statistiques de période.
  const RangeStats({
    required this.totalDue,
    required this.completed,
    required this.active,
    required this.overdue,
    required this.completionRate,
    required this.bySubject,
  });

  /// Tâches (hors archives) dont l'échéance tombe dans la période.
  final int totalDue;

  /// Parmi celles-ci, combien sont terminées.
  final int completed;

  /// Parmi celles-ci, combien restent en cours.
  final int active;

  /// Parmi celles-ci, combien sont dépassées.
  final int overdue;

  /// Taux de complétion en pourcentage arrondi.
  final int completionRate;

  /// Répartition par catégorie.
  final List<SubjectCount> bySubject;
}

/// Statistiques d'une période bornée `[start, end]`, fondées sur l'échéance
/// plutôt que sur la date de création, ce qui colle à la vision
/// « tâches à faire » des écrans.
RangeStats statsForRange(List<Task> tasks, DateTime start, DateTime end, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  final from = startOfDay(start);
  final to = endOfDay(end);
  final due = visibleTasks(tasks)
      .where((t) => !t.due.isBefore(from) && !t.due.isAfter(to))
      .toList(growable: false);
  final completed = due.where((t) => t.status == TaskStatus.completed).toList(growable: false);
  final bySubject = groupBySubject(due).entries
      .map((entry) => SubjectCount(
            subjectId: entry.key,
            total: entry.value.length,
            completed: entry.value.where((t) => t.status == TaskStatus.completed).length,
          ))
      .toList(growable: false);
  return RangeStats(
    totalDue: due.length,
    completed: completed.length,
    active: due.where((t) => t.status == TaskStatus.active).length,
    overdue: due.where((t) => t.status == TaskStatus.active && t.due.isBefore(reference)).length,
    completionRate: due.isEmpty ? 0 : (completed.length / due.length * 100).round(),
    bySubject: bySubject,
  );
}

/// Nombre de tâches terminées par jour dans la période.
///
/// S'appuie sur `completedAt`, en heure locale (règle du projet, voir
/// `dates.dart`).
List<DailyCount> completedPerDay(List<Task> tasks, DateTime start, DateTime end) {
  final from = startOfDay(start);
  final to = endOfDay(end);
  final counts = <String, int>{};
  for (final task in tasks) {
    final completedAt = task.completedAtDate;
    if (completedAt == null) continue;
    if (completedAt.isBefore(from) || completedAt.isAfter(to)) continue;
    final key = toDateKey(completedAt);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return eachDay(start, end)
      .map((day) => DailyCount(
            dateKey: toDateKey(day),
            label: formatShortDay(day),
            count: counts[toDateKey(day)] ?? 0,
          ))
      .toList(growable: false);
}

/// Séries pour un graphique : un point par jour tant que la période reste
/// lisible (≤ 42 jours), sinon un point par semaine s'appuyant sur la clé du
/// lundi. Évite un graphique illisible sur de longues périodes.
List<DailyCount> buildTrend(List<Task> tasks, DateTime start, DateTime end) {
  final daily = completedPerDay(tasks, start, end);
  if (daily.length <= 42) return daily;

  final buckets = <DailyCount>[];
  String? currentKey;
  for (final day in daily) {
    final weekStart = startOfWeek(fromDateKey(day.dateKey));
    final weekKey = toDateKey(weekStart);
    if (currentKey != weekKey) {
      currentKey = weekKey;
      buckets.add(DailyCount(dateKey: weekKey, label: formatShortDate(weekStart), count: 0));
    }
    final last = buckets.removeLast();
    buckets.add(DailyCount(
      dateKey: last.dateKey,
      label: last.label,
      count: last.count + day.count,
    ));
  }
  return buckets;
}
