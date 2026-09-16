import '../constants.dart';
import '../models/task.dart';

/// Migration des données persistées, portée de `lib/migration.ts`.
///
/// L'ancien modèle recopiait le *nom* et la *couleur* de la matière dans chaque
/// tâche ; le modèle actuel ne conserve que `subjectId`. Ces fonctions
/// convertissent les enregistrements existants au chargement pour ne rien perdre
/// chez un utilisateur qui avait déjà installé l'application.
library;

const Map<String, String> _legacyNameMap = <String, String>{
  'mathématiques': 'work',
  'physique': 'work',
  'histoire': 'personal',
  'langues': 'personal',
  'autre': 'inbox',
};

String _normalizeProjectId(String id) => kLegacySubjectMap[id] ?? id;

String _projectIdFromName(Object? name) {
  if (name is! String || name.isEmpty) return kFallbackProject.id;
  final normalized = name.trim().toLowerCase();
  final byLegacyName = _legacyNameMap[normalized];
  if (byLegacyName != null) return byLegacyName;
  for (final project in kProjects) {
    if (project.id == name || project.name.toLowerCase() == normalized) return project.id;
  }
  return kFallbackProject.id;
}

bool _isNonEmptyString(Object? value) => value is String && value.isNotEmpty;

String? _stringOrNull(Map<String, Object?> input, String key) {
  final value = input[key];
  return _isNonEmptyString(value) ? value as String : null;
}

/// Normalise une entrée inconnue ; renvoie `null` si elle est inexploitable.
Task? migrateTask(Object? raw) {
  if (raw is! Map<dynamic, dynamic>) return null;
  final input = raw.cast<String, Object?>();

  final id = _stringOrNull(input, 'id');
  final title = _stringOrNull(input, 'title');
  if (id == null || title == null) return null;

  final storedSubjectId = _stringOrNull(input, 'subjectId');
  final subjectId = _normalizeProjectId(storedSubjectId ?? _projectIdFromName(input['subject']));

  final subtasks = input['subtasks'];
  final reminders = input['reminders'];
  final duration = input['durationMinutes'];

  return Task(
    id: id,
    title: title,
    description: (input['description'] as String?) ?? '',
    dueDate: _stringOrNull(input, 'dueDate') ?? DateTime.now().toUtc().toIso8601String(),
    priority: Priority.fromWire(input['priority']),
    subjectId: subjectId,
    status: TaskStatus.fromWire(input['status']),
    subtasks: subtasks is List<dynamic>
        ? subtasks
            .whereType<Map<dynamic, dynamic>>()
            .map((raw) => Subtask.fromJson(raw.cast<String, Object?>()))
            .toList(growable: false)
        : const <Subtask>[],
    reminders: reminders is List<dynamic>
        ? reminders.whereType<String>().toList(growable: false)
        : const <String>[],
    reportedAt: _stringOrNull(input, 'reportedAt'),
    durationMinutes: duration is num ? duration.toInt() : null,
    note: (input['note'] as String?) ?? '',
    repeat: RepeatRule.fromWire(input['repeat']),
    createdAt: _stringOrNull(input, 'createdAt') ?? DateTime.now().toUtc().toIso8601String(),
    completedAt: _stringOrNull(input, 'completedAt'),
    archivedAt: _stringOrNull(input, 'archivedAt'),
  );
}

/// Migre une liste brute ; un stockage corrompu donne une liste vide.
List<Task> migrateTasks(Object? raw) {
  if (raw is! List<dynamic>) return <Task>[];
  return raw.map(migrateTask).whereType<Task>().toList(growable: false);
}
