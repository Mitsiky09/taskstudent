import 'dart:convert';

import '../constants.dart';
import '../models/task.dart';

/// Sérialisation et export, portés de `lib/serialize.ts`.
///
/// Module pur : l'export CSV/JSON se teste sans interface
/// (`test/migration_test.dart` côté React Native, `test/serialize_test.dart` ici).
library;

/// Échappe un champ selon la RFC 4180 : guillemets doublés, champ encadré.
String csvCell(String value) => '"${value.replaceAll('"', '""')}"';

/// En-tête du fichier CSV exporté.
const List<String> kCsvHeader = <String>[
  'Titre',
  'Projet',
  'Échéance',
  'Priorité',
  'Statut',
  'Terminée le',
  'Durée (min)',
  'Répétition',
  'Remarque',
];

/// Export CSV, une ligne par tâche, précédée de l'en-tête.
String toCSV(List<Task> tasks) {
  final rows = tasks.map((task) => <String>[
        task.title,
        getProject(task.subjectId).name,
        task.dueDate,
        task.priority.wire,
        task.status.wire,
        task.completedAt ?? '',
        task.durationMinutes?.toString() ?? '',
        task.repeat.wire,
        task.note,
      ].map(csvCell).join(','));
  return <String>[kCsvHeader.map(csvCell).join(','), ...rows].join('\n');
}

/// Export JSON indenté, horodaté.
String toJSON(List<Task> tasks, [DateTime? exportedAt]) {
  final payload = <String, Object?>{
    'exportedAt': (exportedAt ?? DateTime.now()).toUtc().toIso8601String(),
    'tasks': tasks.map((task) => task.toJson()).toList(growable: false),
  };
  return const JsonEncoder.withIndent('  ').convert(payload);
}
