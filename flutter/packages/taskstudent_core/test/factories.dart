import 'package:taskstudent_core/taskstudent.dart';

int _counter = 0;

/// Construit une tâche valide, surchargeable champ par champ.
///
/// Équivalent de `__tests__/factories.ts` : les identifiants s'incrémentent
/// globalement, donc les tests comparent toujours des identifiants lus sur les
/// tâches créées, jamais des valeurs écrites en dur.
Task makeTask({
  String? id,
  String? title,
  String? description,
  DateTime? due,
  Priority priority = Priority.medium,
  String subjectId = 'math',
  TaskStatus status = TaskStatus.active,
  List<Subtask> subtasks = const <Subtask>[],
  List<String> reminders = const <String>[],
  String? reportedAt,
  int? durationMinutes,
  String note = '',
  RepeatRule repeat = RepeatRule.none,
  DateTime? completedAt,
  DateTime? archivedAt,
}) {
  _counter += 1;
  final dueAt = due ?? DateTime.parse('2026-03-10T10:00:00Z');
  return Task(
    id: id ?? 'task-$_counter',
    title: title ?? 'Tâche $_counter',
    description: description ?? '',
    dueDate: dueAt.toUtc().toIso8601String(),
    priority: priority,
    subjectId: subjectId,
    status: status,
    subtasks: subtasks,
    reminders: reminders,
    reportedAt: reportedAt,
    durationMinutes: durationMinutes,
    note: note,
    repeat: repeat,
    createdAt: DateTime.parse('2026-03-01T08:00:00Z').toIso8601String(),
    completedAt: completedAt?.toUtc().toIso8601String(),
    archivedAt: archivedAt?.toUtc().toIso8601String(),
  );
}

/// Réinitialise le compteur d'identifiants (utile entre deux fichiers de test).
void resetTaskCounter() => _counter = 0;
