import 'package:taskstudent_core/taskstudent.dart';
import 'package:test/test.dart';

import 'factories.dart';

/// Miroir de `__tests__/tasks.test.ts`.
void main() {
  final now = DateTime(2026, 3, 10, 12);

  group('isOverdue', () {
    test('signale une tâche active dont l’échéance est passée', () {
      final task = makeTask(due: DateTime(2026, 3, 9));
      expect(isOverdue(task, now), isTrue);
    });

    test('ne signale pas une tâche terminée', () {
      final task = makeTask(
        due: DateTime(2026, 3, 9),
        status: TaskStatus.completed,
        completedAt: DateTime(2026, 3, 8),
      );
      expect(isOverdue(task, now), isFalse);
    });
  });

  group('isReported', () {
    test('signale une tâche active reportée', () {
      final reported = makeTask(reportedAt: now.toUtc().toIso8601String());
      expect(isReported(reported), isTrue);
    });

    test('ne signale ni une tâche jamais reportée ni une tâche terminée', () {
      expect(isReported(makeTask()), isFalse);
      expect(
        isReported(makeTask(
          reportedAt: now.toUtc().toIso8601String(),
          status: TaskStatus.completed,
          completedAt: now,
        )),
        isFalse,
      );
    });
  });

  group('filterTasks « Reportées »', () {
    test('ne garde que les tâches reportées actives', () {
      final iso = now.toUtc().toIso8601String();
      final reported = makeTask(reportedAt: iso);
      final normal = makeTask();
      final done = makeTask(reportedAt: iso, status: TaskStatus.completed, completedAt: now);
      expect(filterTasks(<Task>[reported, normal, done], TaskFilter.reported, now),
          equals(<Task>[reported]));
    });
  });

  group('nextOccurrence', () {
    test('avance d’un jour, d’une semaine ou d’un mois selon la règle', () {
      final due = DateTime(2026, 3, 10, 14, 30);
      expect(nextOccurrence(due, RepeatRule.daily)!.day, 11);
      expect(nextOccurrence(due, RepeatRule.weekly)!.day, 17);
      expect(nextOccurrence(due, RepeatRule.monthly), DateTime(2026, 4, 10, 14, 30));
    });

    test('retourne null pour une tâche non répétée', () {
      expect(nextOccurrence(DateTime(2026, 3, 10), RepeatRule.none), isNull);
    });
  });

  group('repeatLabel', () {
    test('libelle chaque règle comme le fait l’application', () {
      expect(repeatLabel(RepeatRule.none), 'Jamais');
      expect(repeatLabel(RepeatRule.daily), 'Tous les jours');
      expect(repeatLabel(RepeatRule.weekly), 'Chaque semaine');
      expect(repeatLabel(RepeatRule.monthly), 'Chaque mois');
    });

    test('les options de formulaire restent alignées sur l’application', () {
      expect(kRepeatOptions.map((option) => option.$2).toList(),
          equals(<String>['Jamais', 'Chaque jour', 'Chaque semaine', 'Chaque mois']));
      expect(kDurationOptions, equals(<int>[15, 30, 45, 60, 90, 120]));
    });
  });

  group('filterTasks', () {
    final overdue = makeTask(due: DateTime(2026, 3, 8));
    final soon = makeTask(due: DateTime(2026, 3, 12));
    final later = makeTask(due: DateTime(2026, 4, 30));
    final done = makeTask(
      due: DateTime(2026, 3, 11),
      status: TaskStatus.completed,
      completedAt: now,
    );
    final all = <Task>[overdue, soon, later, done];

    test('« Toutes » conserve la liste sans la muter', () {
      final result = filterTasks(all, TaskFilter.all, now);
      expect(result, hasLength(4));
      expect(identical(result, all), isFalse);
    });

    test('« En cours » exclut les tâches terminées', () {
      expect(filterTasks(all, TaskFilter.active, now).map((t) => t.id), isNot(contains(done.id)));
    });

    test('« En retard » ne garde que les tâches actives dépassées', () {
      expect(filterTasks(all, TaskFilter.overdue, now).map((t) => t.id),
          equals(<String>[overdue.id]));
    });

    test('« Cette semaine » borne les sept prochains jours', () {
      final ids = filterTasks(all, TaskFilter.week, now).map((t) => t.id).toList();
      expect(ids, contains(soon.id));
      expect(ids, isNot(contains(later.id)));
      expect(ids, isNot(contains(overdue.id)));
    });
  });

  group('sortTasks', () {
    final low = makeTask(priority: Priority.low, due: DateTime(2026, 3, 11));
    final high = makeTask(priority: Priority.high, due: DateTime(2026, 3, 20));
    final medium = makeTask(priority: Priority.medium, due: DateTime(2026, 3, 15));

    test('trie par échéance croissante', () {
      expect(sortTasks(<Task>[high, low, medium], TaskSort.date).map((t) => t.id),
          equals(<String>[low.id, medium.id, high.id]));
    });

    test('trie par priorité décroissante puis par échéance', () {
      expect(sortTasks(<Task>[low, medium, high], TaskSort.priority).map((t) => t.id),
          equals(<String>[high.id, medium.id, low.id]));
    });

    test('ne mute pas la liste source', () {
      final source = <Task>[high, low];
      sortTasks(source, TaskSort.date);
      expect(source.map((t) => t.id), equals(<String>[high.id, low.id]));
    });
  });

  group('recherche et regroupement', () {
    final maths = makeTask(title: 'Exercices de dérivées', subjectId: 'math');
    final histoire = makeTask(title: 'Fiche sur la Révolution', subjectId: 'history');
    String subjectName(Task task) => task.subjectId == 'math' ? 'Mathématiques' : 'Histoire';

    test('recherche sans tenir compte de la casse', () {
      expect(searchTasks(<Task>[maths, histoire], 'RÉVOLUTION', subjectName), hasLength(1));
    });

    test('recherche aussi dans le nom de la catégorie', () {
      expect(searchTasks(<Task>[maths, histoire], 'mathémat', subjectName),
          equals(<Task>[maths]));
    });

    test('renvoie tout pour une requête vide', () {
      expect(searchTasks(<Task>[maths, histoire], '   ', subjectName), hasLength(2));
    });

    test('regroupe par catégorie', () {
      final grouped = groupBySubject(<Task>[maths, histoire, makeTask(subjectId: 'math')]);
      expect(grouped.keys.toList()..sort(), equals(<String>['history', 'math']));
      expect(grouped['math'], hasLength(2));
    });
  });

  group('sélections d’écran', () {
    test('visibleTasks écarte les archives', () {
      final archived = makeTask(
        status: TaskStatus.archived,
        archivedAt: now,
      );
      expect(visibleTasks(<Task>[makeTask(), archived]), hasLength(1));
    });

    test('tasksDueOn s’appuie sur la clé de jour locale', () {
      final evening = makeTask(due: DateTime(2026, 3, 10, 22));
      expect(tasksDueOn(<Task>[evening], toDateKey(DateTime(2026, 3, 10))), hasLength(1));
    });

    test('upcomingTasks exclut aujourd’hui et limite le nombre de résultats', () {
      final tasks = <Task>[
        makeTask(due: DateTime(2026, 3, 10, 18)),
        makeTask(due: DateTime(2026, 3, 11)),
        makeTask(due: DateTime(2026, 3, 12)),
        makeTask(due: DateTime(2026, 3, 13)),
        makeTask(due: DateTime(2026, 3, 14)),
      ];
      final result = upcomingTasks(tasks, now, 3);
      expect(result, hasLength(3));
      expect(result.first.dueDate, DateTime(2026, 3, 11).toUtc().toIso8601String());
    });

    test('archivedThisMonth filtre sur le mois courant', () {
      final current = makeTask(status: TaskStatus.archived, archivedAt: DateTime(2026, 3, 3));
      final old = makeTask(status: TaskStatus.archived, archivedAt: DateTime(2026, 1, 3));
      expect(archivedThisMonth(<Task>[current, old], now), equals(<Task>[current]));
    });

    test('groupByDate nomme aujourd’hui et demain', () {
      final today = makeTask(due: DateTime(2026, 3, 10, 9));
      final tomorrow = makeTask(due: DateTime(2026, 3, 11, 9));
      final sections = groupByDate(<Task>[tomorrow, today], now);
      expect(sections.map((s) => s.label), equals(<String>["Aujourd'hui", 'Demain']));
      expect(sections.first.dateKey, '2026-03-10');
    });
  });

  group('computeStats', () {
    test('calcule le taux de complétion et la répartition par catégorie', () {
      final tasks = <Task>[
        makeTask(subjectId: 'math', status: TaskStatus.completed, completedAt: now),
        makeTask(subjectId: 'math', due: DateTime(2026, 3, 20)),
        makeTask(subjectId: 'history', due: DateTime(2026, 3, 1)),
        makeTask(subjectId: 'history', status: TaskStatus.archived, archivedAt: now),
      ];
      final stats = computeStats(tasks, now);

      expect(stats.total, 4);
      expect(stats.completed, 1);
      expect(stats.overdue, 1);
      expect(stats.archived, 1);
      expect(stats.completionRate, 25);
      expect(
        stats.bySubject
            .firstWhere((entry) => entry.subjectId == 'math')
            .total,
        2,
      );
      expect(
        stats.bySubject
            .firstWhere((entry) => entry.subjectId == 'math')
            .completed,
        1,
      );
    });

    test('évite la division par zéro sur une liste vide', () {
      expect(computeStats(<Task>[], now).completionRate, 0);
    });
  });

  group('statsForRange', () {
    final start = DateTime(2026, 3, 2);
    final end = DateTime(2026, 3, 8);
    final reference = DateTime(2026, 3, 4, 12);

    test('compte les tâches dues dans la période et leur statut', () {
      final inRange = makeTask(due: DateTime(2026, 3, 5));
      final doneInRange = makeTask(
        due: DateTime(2026, 3, 5),
        status: TaskStatus.completed,
        completedAt: DateTime(2026, 3, 6),
      );
      final lateInRange = makeTask(due: DateTime(2026, 3, 4));
      final outside = makeTask(due: DateTime(2026, 3, 20));
      final archived = makeTask(
        due: DateTime(2026, 3, 5),
        status: TaskStatus.archived,
        archivedAt: reference,
      );

      final stats = statsForRange(
        <Task>[inRange, doneInRange, lateInRange, outside, archived],
        start,
        end,
        reference,
      );
      expect(stats.totalDue, 3);
      expect(stats.completed, 1);
      expect(stats.active, 2);
      expect(stats.overdue, 1);
    });

    test('évite la division par zéro', () {
      expect(statsForRange(<Task>[], start, end, reference).completionRate, 0);
    });
  });

  group('completedPerDay et buildTrend', () {
    final start = DateTime(2026, 3, 2);
    final end = DateTime(2026, 3, 4);

    test('garde-fou : la période de test commence un lundi', () {
      expect(start.weekday, DateTime.monday);
    });

    test('répartit les tâches terminées par jour', () {
      final tasks = <Task>[
        makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 3, 2, 9)),
        makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 3, 2, 21)),
        makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 3, 4, 12)),
        makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 2, 20)),
      ];
      final trend = completedPerDay(tasks, start, end);
      expect(trend.map((t) => t.count), equals(<int>[2, 0, 1]));
      expect(trend.map((t) => t.dateKey),
          equals(<String>['2026-03-02', '2026-03-03', '2026-03-04']));
      expect(trend.first.label, 'lun. 2');
    });

    test('garde un point par jour sous 42 jours', () {
      expect(buildTrend(<Task>[], start, end), hasLength(3));
    });

    test('agrège par semaine au-delà de 42 jours', () {
      final trend = buildTrend(<Task>[], DateTime(2026, 1, 1), DateTime(2026, 2, 28));
      expect(trend.length, lessThan(10));
    });
  });

  group('applyAutoArchive', () {
    test('archive les tâches terminées depuis plus de sept jours', () {
      final old = makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 3, 1));
      final archived = applyAutoArchive(<Task>[old], now).first;
      expect(archived.status, TaskStatus.archived);
      expect(archived.archivedAt, isNotNull);
    });

    test('laisse les tâches terminées récemment', () {
      final recent = makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 3, 9));
      expect(applyAutoArchive(<Task>[recent], now).first.status, TaskStatus.completed);
    });

    test('retourne la même référence quand rien ne change', () {
      final tasks = <Task>[makeTask()];
      expect(applyAutoArchive(tasks, now), same(tasks));
    });
  });
}
