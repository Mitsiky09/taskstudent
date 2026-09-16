import 'package:taskstudent_core/taskstudent.dart';
import 'package:test/test.dart';

import 'factories.dart';

/// Mutations et persistance, portées de `context/TasksContext.tsx`.
///
/// L'horloge est injectée : aucun test ne dépend de l'heure réelle.
void main() {
  final now = DateTime(2026, 3, 10, 12);
  DateTime clock() => now;

  group('transformations pures', () {
    test('completeTask horodate et désarchive', () {
      final task = makeTask(status: TaskStatus.archived, archivedAt: now);
      final done = completeTask(task, now);
      expect(done.status, TaskStatus.completed);
      expect(done.completedAtDate, isNotNull);
      expect(done.archivedAt, isNull);
    });

    test('uncompleteTask efface la date de complétion', () {
      final task = makeTask(status: TaskStatus.completed, completedAt: now);
      final back = uncompleteTask(task);
      expect(back.status, TaskStatus.active);
      expect(back.completedAt, isNull);
    });

    test('toggleTaskCompletion termine une tâche active', () {
      final done = toggleTaskCompletion(makeTask(), now);
      expect(done.status, TaskStatus.completed);
      expect(done.completedAt, isNotNull);
    });

    test('toggleTaskCompletion dé-coche une tâche terminée', () {
      final task = makeTask(status: TaskStatus.completed, completedAt: now);
      expect(toggleTaskCompletion(task, now).completedAt, isNull);
    });

    test('toggleTaskCompletion fait avancer une tâche répétée au lieu de la '
        'terminer', () {
      final task = makeTask(
        due: DateTime(2026, 3, 10, 9),
        repeat: RepeatRule.daily,
        reportedAt: now.toUtc().toIso8601String(),
      );
      final next = toggleTaskCompletion(task, now);
      expect(next.status, TaskStatus.active);
      expect(next.completedAt, isNull);
      expect(next.reportedAt, isNull);
      expect(toDateKey(next.due), '2026-03-11');
    });

    test('reportTaskTo repousse l’échéance et marque le report', () {
      final reported = reportTaskTo(makeTask(), DateTime(2026, 3, 15, 9), now);
      expect(toDateKey(reported.due), '2026-03-15');
      expect(reported.reportedAt, isNotNull);
      expect(isReported(reported), isTrue);
    });

    test('appendSubtask ajoute en fin de liste', () {
      final task = appendSubtask(makeTask(), 'Relire', 's1');
      expect(task.subtasks.map((s) => s.title), equals(<String>['Relire']));
      expect(task.subtasks.single.isCompleted, isFalse);
    });

    test('toggleSubtaskCompletion inverse l’état d’une seule sous-tâche', () {
      final task = makeTask(subtasks: const <Subtask>[
        Subtask(id: 's1', title: 'Un'),
        Subtask(id: 's2', title: 'Deux'),
      ]);
      final toggled = toggleSubtaskCompletion(task, 's2');
      expect(toggled.subtasks.first.isCompleted, isFalse);
      expect(toggled.subtasks.last.isCompleted, isTrue);
    });

    test('copyWith peut remettre un champ optionnel à null', () {
      final task = makeTask(
        status: TaskStatus.completed,
        completedAt: now,
        durationMinutes: 30,
      );
      final cleared = task.copyWith(clearCompletedAt: true, clearDurationMinutes: true);
      expect(cleared.completedAt, isNull);
      expect(cleared.durationMinutes, isNull);
      // Les autres champs ne bougent pas.
      expect(cleared.title, task.title);
      expect(cleared.subjectId, task.subjectId);
    });
  });

  group('TaskRepository', () {
    late MemoryStore store;
    late TaskRepository repository;

    setUp(() {
      store = MemoryStore();
      repository = TaskRepository(store: store, clock: clock);
    });

    test('createTask pose l’identifiant, la création et l’état actif', () {
      final created = repository.createTask(
        TaskInput(
          title: 'Préparer l’exposé',
          dueDate: DateTime(2026, 3, 12, 14),
          subjectId: 'work',
          priority: Priority.high,
        ),
      );
      expect(created.id, startsWith('t_'));
      expect(created.status, TaskStatus.active);
      expect(created.createdAt, isNotEmpty);
      expect(created.completedAt, isNull);
      expect(repository.tasks, hasLength(1));
    });

    test('la liste exposée ne se modifie pas de l’extérieur', () {
      repository.createTask(TaskInput(title: 'X', dueDate: DateTime(2026, 3, 12)));
      expect(() => repository.tasks.clear(), throwsUnsupportedError);
    });

    test('toggleTask coche puis décoche', () {
      final created = repository.createTask(
        TaskInput(title: 'X', dueDate: DateTime(2026, 3, 12)),
      );
      expect(repository.toggleTask(created.id)?.status, TaskStatus.completed);
      expect(repository.toggleTask(created.id)?.status, TaskStatus.active);
      expect(repository.toggleTask('inconnu'), isNull);
    });

    test('reportTask repousse l’échéance', () {
      final created = repository.createTask(
        TaskInput(title: 'X', dueDate: DateTime(2026, 3, 12)),
      );
      final reported = repository.reportTask(created.id, DateTime(2026, 3, 20, 9));
      expect(toDateKey(reported!.due), '2026-03-20');
      expect(reported.reportedAt, isNotNull);
    });

    test('addSubtask ignore un titre vide', () {
      final created = repository.createTask(
        TaskInput(title: 'X', dueDate: DateTime(2026, 3, 12)),
      );
      expect(repository.addSubtask(created.id, '   '), isNull);
      final updated = repository.addSubtask(created.id, '  Relire  ');
      expect(updated?.subtasks.single.title, 'Relire');
    });

    test('archive, restauration et vidage des archives', () {
      final first = repository.createTask(
        TaskInput(title: 'Un', dueDate: DateTime(2026, 3, 12)),
      );
      final second = repository.createTask(
        TaskInput(title: 'Deux', dueDate: DateTime(2026, 3, 13)),
      );
      repository.archiveTask(first.id);
      repository.archiveTask(second.id);
      expect(visibleTasks(repository.tasks), isEmpty);

      repository.restoreTask(first.id);
      expect(repository.tasks.firstWhere((t) => t.id == first.id).status, TaskStatus.active);
      expect(repository.tasks.firstWhere((t) => t.id == first.id).archivedAt, isNull);

      expect(repository.clearArchives(), 1);
      expect(repository.tasks, hasLength(1));
    });

    test('deleteTask supprime définitivement', () {
      final created = repository.createTask(
        TaskInput(title: 'X', dueDate: DateTime(2026, 3, 12)),
      );
      expect(repository.deleteTask(created.id), isTrue);
      expect(repository.deleteTask(created.id), isFalse);
      expect(repository.tasks, isEmpty);
    });

    test('load convertit les enregistrements de l’ancien modèle', () async {
      await store.write(
        StorageKeys.tasks,
        '[{"id":"a1","title":"Devoir","subject":"Mathématiques",'
            '"dueDate":"2026-03-10T10:00:00.000Z","priority":"high","status":"active",'
            '"subtasks":[],"reminders":[],"createdAt":"2026-03-01T08:00:00.000Z",'
            '"completedAt":null,"archivedAt":null}]',
      );
      await repository.load();
      expect(repository.isLoaded, isTrue);
      expect(repository.tasks.single.subjectId, 'work');
      expect(repository.tasks.single.priority, Priority.high);
    });

    test('load(autoArchive) archive les tâches terminées depuis plus d’une '
        'semaine', () async {
      final old = makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 2, 25));
      await writeJson(store, StorageKeys.tasks, <Object?>[old.toJson()]);
      await repository.load(autoArchive: true);
      expect(repository.tasks.single.status, TaskStatus.archived);
    });

    test('save puis reload conserve les données à l’identique', () async {
      repository.createTask(
        TaskInput(
          title: 'Fiche de révision',
          dueDate: DateTime(2026, 3, 12, 18, 30),
          subjectId: 'work',
          priority: Priority.high,
          repeat: RepeatRule.weekly,
        ),
      );
      await repository.save();

      final reopened = TaskRepository(store: store, clock: clock);
      await reopened.load();
      expect(reopened.tasks, equals(repository.tasks));
    });

    test('save ne fait rien avant load (garde-fou d’écrasement)', () async {
      await repository.save();
      expect(await store.read(StorageKeys.tasks), isNull);
    });

    test('applyAutoArchiveNow signale si quelque chose a changé', () async {
      final old = makeTask(status: TaskStatus.completed, completedAt: DateTime(2026, 2, 25));
      await writeJson(store, StorageKeys.tasks, <Object?>[old.toJson()]);
      await repository.load();
      expect(repository.applyAutoArchiveNow(), isTrue);
      expect(repository.applyAutoArchiveNow(), isFalse);
    });
  });
}
