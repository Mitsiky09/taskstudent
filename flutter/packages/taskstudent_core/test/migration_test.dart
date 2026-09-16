import 'dart:convert';

import 'package:taskstudent_core/taskstudent.dart';
import 'package:test/test.dart';

import 'factories.dart';

/// Miroir de `__tests__/migration.test.ts`, augmenté du parcours de stockage
/// réel (chaîne JSON → `jsonDecode` → migration), absent de la suite d'origine.
void main() {
  group('migrateTask', () {
    test('convertit le nom de catégorie de l’ancien modèle en identifiant', () {
      const legacy = <String, Object?>{
        'id': 'a1',
        'title': 'Devoir maison',
        'subject': 'Mathématiques',
        'subjectColor': '#4f46e5',
        'dueDate': '2026-03-10T10:00:00.000Z',
        'priority': 'high',
        'status': 'active',
        'subtasks': <Object?>[],
        'attachments': <Object?>[],
        'reminders': <Object?>[],
        'createdAt': '2026-03-01T08:00:00.000Z',
        'completedAt': null,
        'archivedAt': null,
      };
      final migrated = migrateTask(legacy);
      expect(migrated?.subjectId, 'work');
      // La couleur n'est plus portée par la tâche : elle vient de la catégorie.
      expect(migrated?.toJson().containsKey('subjectColor'), isFalse);
      expect(migrated?.priority, Priority.high);
    });

    test('bascule sur la boîte de réception si le nom est inconnu', () {
      expect(
        migrateTask(<String, Object?>{'id': 'a2', 'title': 'X', 'subject': 'Philosophie'})
            ?.subjectId,
        'inbox',
      );
    });

    test('complète les champs manquants avec des valeurs sûres', () {
      final migrated = migrateTask(<String, Object?>{'id': 'a3', 'title': 'Sans détail'});
      expect(migrated?.priority, Priority.medium);
      expect(migrated?.status, TaskStatus.active);
      expect(migrated?.subtasks, isEmpty);
      expect(migrated?.description, '');
      expect(migrated?.reportedAt, isNull);
      expect(migrated?.durationMinutes, isNull);
      expect(migrated?.note, '');
      expect(migrated?.repeat, RepeatRule.none);
    });

    test('conserve les nouveaux champs (report, durée, remarque, répétition)', () {
      final migrated = migrateTask(<String, Object?>{
        'id': 'a6',
        'title': 'Avancé',
        'reportedAt': '2026-03-01T08:00:00.000Z',
        'durationMinutes': 45,
        'note': 'À relire',
        'repeat': 'weekly',
      });
      expect(migrated?.reportedAt, '2026-03-01T08:00:00.000Z');
      expect(migrated?.durationMinutes, 45);
      expect(migrated?.note, 'À relire');
      expect(migrated?.repeat, RepeatRule.weekly);
    });

    test('rejette les entrées inexploitables', () {
      expect(migrateTask(null), isNull);
      expect(migrateTask(<String, Object?>{'title': 'sans identifiant'}), isNull);
      expect(migrateTasks('stockage corrompu'), isEmpty);
    });

    test('conserve une tâche déjà au format courant', () {
      final task = makeTask(subjectId: 'shopping');
      expect(migrateTasks(<Object?>[task.toJson()]).first, equals(task));
    });

    test('normalise les identifiants de catégorie hérités vers un projet', () {
      expect(
        migrateTask(<String, Object?>{'id': 'a4', 'title': 'X', 'subjectId': 'physics'})
            ?.subjectId,
        'work',
      );
      expect(
        migrateTask(<String, Object?>{'id': 'a5', 'title': 'Y', 'subjectId': 'other'})
            ?.subjectId,
        'inbox',
      );
    });

    test('relit une liste issue de jsonDecode, sous-tâches comprises', () {
      final task = makeTask(
        title: 'Chapitre 4',
        due: DateTime(2026, 3, 12, 18, 30),
        priority: Priority.high,
        subjectId: 'work',
        durationMinutes: 90,
        repeat: RepeatRule.weekly,
        subtasks: const <Subtask>[
          Subtask(id: 's1', title: 'Lire le chapitre'),
          Subtask(id: 's2', title: 'Faire les exercices', isCompleted: true),
        ],
        reminders: const <String>['2026-03-12T15:00:00.000Z'],
      );
      final encoded = jsonEncode(<Object?>[task.toJson()]);
      final decoded = jsonDecode(encoded);

      final migrated = migrateTasks(decoded);

      expect(migrated, hasLength(1));
      expect(migrated.first, equals(task));
      expect(migrated.first.subtasks, hasLength(2));
      expect(migrated.first.subtasks.last.isCompleted, isTrue);
      expect(migrated.first.reminders, equals(<String>['2026-03-12T15:00:00.000Z']));
    });
  });

  group('export', () {
    test('produit un CSV avec en-tête et une ligne par tâche', () {
      final csv = toCSV(<Task>[makeTask(title: 'Révisions')]);
      final lines = csv.split('\n');
      expect(lines, hasLength(2));
      expect(lines.first, contains('"Titre"'));
      expect(lines[1], contains('"Révisions"'));
    });

    test('échappe les guillemets selon la RFC 4180', () {
      final csv = toCSV(<Task>[makeTask(title: 'Lire "Candide"')]);
      expect(csv, contains('"Lire ""Candide"""'));
    });

    test('exporte le nom de la catégorie, pas son identifiant', () {
      final csv = toCSV(<Task>[makeTask(subjectId: 'work')]);
      expect(csv, contains('"Travail"'));
    });

    test('produit un JSON relisible', () {
      final parsed = jsonDecode(toJSON(<Task>[makeTask()])) as Map<String, Object?>;
      expect((parsed['tasks'] as List<Object?>), hasLength(1));
      expect(parsed['exportedAt'], isA<String>());
    });

    test('un export JSON se recharge tel quel', () {
      final tasks = <Task>[makeTask(subjectId: 'work'), makeTask(subjectId: 'personal')];
      final reloaded = migrateTasks(jsonDecode(toJSON(tasks)));
      expect(reloaded, equals(tasks));
    });
  });

  group('stockage', () {
    test('une chaîne corrompue ne fait pas planter la lecture', () async {
      final store = MemoryStore();
      await store.write(StorageKeys.tasks, '{pas du json');
      expect(await readJsonList(store, StorageKeys.tasks), isEmpty);
    });

    test('une clé absente donne la valeur par défaut', () async {
      final store = MemoryStore();
      expect(await readJsonList(store, StorageKeys.tasks), isEmpty);
      expect(await readJsonMap(store, StorageKeys.settings), isNull);
    });

    test('writeJson puis readJsonList fait un aller-retour', () async {
      final store = MemoryStore();
      await writeJson(store, StorageKeys.tasks, <Object?>[makeTask().toJson()]);
      final decoded = await readJsonList(store, StorageKeys.tasks);
      expect(migrateTasks(decoded), hasLength(1));
    });
  });

  group('createId', () {
    test('préfixe et ne produit pas deux fois le même identifiant', () {
      final first = createId('s');
      final second = createId('s');
      expect(first, startsWith('s_'));
      expect(first, isNot(second));
    });
  });
}
