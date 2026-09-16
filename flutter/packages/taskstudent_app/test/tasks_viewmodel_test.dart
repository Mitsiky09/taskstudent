import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:taskstudent_app/src/presentation/providers.dart';
import 'package:taskstudent_app/src/presentation/viewmodels/settings_viewmodel.dart';
import 'package:taskstudent_app/src/presentation/viewmodels/tasks_viewmodel.dart';
import 'package:taskstudent_core/taskstudent.dart';

/// Tests de la couche ViewModel.
///
/// Le stockage est remplacé par le `MemoryStore` du noyau : ces tests
/// n'écrivent rien sur le disque et ne demandent aucune plateforme. C'est
/// l'intérêt de l'injection de [keyValueStoreProvider] — la même surcharge
/// servirait à brancher un faux Hive ou un backend.
void main() {
  ProviderContainer makeContainer(MemoryStore store) => ProviderContainer(
        overrides: <Override>[keyValueStoreProvider.overrideWithValue(store)],
      );

  group('TasksNotifier', () {
    test('charge un stockage vide sans erreur', () async {
      final container = makeContainer(MemoryStore());
      addTearDown(container.dispose);

      await container.read(tasksProvider.notifier).load();

      final state = container.read(tasksProvider);
      expect(state.isLoading, isFalse);
      expect(state.tasks, isEmpty);
    });

    test('crée, coche et persiste une tâche', () async {
      final store = MemoryStore();
      final container = makeContainer(store);
      addTearDown(container.dispose);
      final notifier = container.read(tasksProvider.notifier);

      await notifier.load();
      await notifier.create(
        TaskInput(title: 'Réviser les dérivées', dueDate: DateTime(2026, 3, 12, 18)),
      );

      expect(container.read(tasksProvider).tasks, hasLength(1));
      final id = container.read(tasksProvider).tasks.single.id;

      await notifier.toggle(id);
      expect(container.read(tasksProvider).tasks.single.status, TaskStatus.completed);

      // Un second conteneur relit le même stockage : la donnée a bien été écrite.
      final reopened = makeContainer(store);
      addTearDown(reopened.dispose);
      await reopened.read(tasksProvider.notifier).load();
      expect(reopened.read(tasksProvider).tasks.single.id, id);
      expect(reopened.read(tasksProvider).tasks.single.status, TaskStatus.completed);
    });

    test('cocher une tâche répétée la fait avancer d’un cycle', () async {
      final container = makeContainer(MemoryStore());
      addTearDown(container.dispose);
      final notifier = container.read(tasksProvider.notifier);

      await notifier.load();
      final task = await notifier.create(
        TaskInput(
          title: 'Sport',
          dueDate: DateTime(2026, 3, 10, 7),
          repeat: RepeatRule.daily,
        ),
      );
      await notifier.toggle(task.id);

      final after = container.read(tasksProvider).tasks.single;
      expect(after.status, TaskStatus.active);
      expect(toDateKey(after.due), '2026-03-11');
    });

    test('le filtre ne garde que les tâches concernées', () async {
      final container = makeContainer(MemoryStore());
      addTearDown(container.dispose);
      final notifier = container.read(tasksProvider.notifier);

      await notifier.load();
      await notifier.create(
        TaskInput(title: 'En retard', dueDate: DateTime.now().subtract(const Duration(days: 2))),
      );
      await notifier.create(
        TaskInput(title: 'Bientôt', dueDate: DateTime.now().add(const Duration(days: 2))),
      );

      notifier.setFilter(TaskFilter.overdue);
      expect(container.read(tasksProvider).visible(kProjects), hasLength(1));
      expect(container.read(tasksProvider).visible(kProjects).single.title, 'En retard');

      notifier.setFilter(TaskFilter.all);
      expect(container.read(tasksProvider).visible(kProjects), hasLength(2));
    });

    test('la recherche porte sur le titre et le nom de catégorie', () async {
      final container = makeContainer(MemoryStore());
      addTearDown(container.dispose);
      final notifier = container.read(tasksProvider.notifier);

      await notifier.load();
      await notifier.create(
        TaskInput(title: 'Devoir maison', dueDate: DateTime.now(), subjectId: 'work'),
      );
      await notifier.create(
        TaskInput(title: 'Courses', dueDate: DateTime.now(), subjectId: 'shopping'),
      );

      notifier.setQuery('travail');
      expect(container.read(tasksProvider).visible(kProjects), hasLength(1));
      expect(container.read(tasksProvider).visible(kProjects).single.title, 'Devoir maison');
    });

    test('les sous-tâches s’ajoutent et se cochent', () async {
      final container = makeContainer(MemoryStore());
      addTearDown(container.dispose);
      final notifier = container.read(tasksProvider.notifier);

      await notifier.load();
      final task = await notifier.create(
        TaskInput(title: 'Exposé', dueDate: DateTime.now()),
      );

      await notifier.addSubtask(task.id, '   ');
      expect(container.read(tasksProvider).tasks.single.subtasks, isEmpty);

      await notifier.addSubtask(task.id, '  Préparer les slides  ');
      final subtask = container.read(tasksProvider).tasks.single.subtasks.single;
      expect(subtask.title, 'Préparer les slides');

      await notifier.toggleSubtask(task.id, subtask.id);
      expect(container.read(tasksProvider).tasks.single.subtasks.single.isCompleted, isTrue);
    });

    test('archiver retire la tâche de la liste visible, pas des archives',
        () async {
      final container = makeContainer(MemoryStore());
      addTearDown(container.dispose);
      final notifier = container.read(tasksProvider.notifier);

      await notifier.load();
      final task = await notifier.create(
        TaskInput(title: 'Vieux dossier', dueDate: DateTime.now()),
      );
      await notifier.archive(task.id);

      final state = container.read(tasksProvider);
      expect(state.visible(kProjects), isEmpty);
      expect(state.archived, hasLength(1));

      expect(await notifier.clearArchives(), 1);
      expect(container.read(tasksProvider).tasks, isEmpty);
    });
  });

  group('SettingsNotifier', () {
    test('part des catégories par défaut puis persiste les changements',
        () async {
      final store = MemoryStore();
      final container = makeContainer(store);
      addTearDown(container.dispose);
      final notifier = container.read(settingsProvider.notifier);

      await Future<void>.delayed(Duration.zero);
      expect(container.read(settingsProvider).settings.categories, isNotEmpty);

      final id = await notifier.addCategory('Mémoire', '#4f46e5');
      await notifier.setAutoArchive(true);

      final reopened = makeContainer(store);
      addTearDown(reopened.dispose);
      reopened.read(settingsProvider.notifier);
      await Future<void>.delayed(Duration.zero);

      final settings = reopened.read(settingsProvider).settings;
      expect(settings.autoArchive, isTrue);
      expect(settings.categories.map((category) => category.id), contains(id));
    });
  });
}
