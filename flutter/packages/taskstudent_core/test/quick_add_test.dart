import 'package:taskstudent_core/taskstudent.dart';
import 'package:test/test.dart';

/// Miroir de `__tests__/quickadd.test.ts` : mêmes entrées, mêmes attentes.
///
/// Le référentiel temporel est fixé au lundi 6 janvier 2025, comme dans la
/// suite d'origine, pour que « demain », « vendredi prochain » et « le 15
/// octobre » donnent des résultats stables.
void main() {
  final now = DateTime(2025, 1, 6, 10); // lundi 6 janvier 2025

  const subjects = <QuickSubject>[
    QuickSubject(id: 'math', name: 'Mathématiques'),
    QuickSubject(id: 'physics', name: 'Physique'),
    QuickSubject(id: 'history', name: 'Histoire'),
    QuickSubject(id: 'languages', name: 'Langues'),
  ];

  ParsedQuickAdd parse(String input) => parseQuickAdd(input, subjects: subjects, now: now);

  group('parseQuickAdd — syntaxe complète', () {
    test('extrait titre, date, heure, catégorie et priorité', () {
      final parsed = parse('Acheter un livre demain à 14h30 #Langues p1');
      expect(parsed.title, 'Acheter un livre');
      expect(parsed.priority, Priority.high);
      expect(parsed.priorityToken, isTrue);
      expect(parsed.subject, const QuickSubject(id: 'languages', name: 'Langues'));
      expect(parsed.due?.date, '2025-01-07');
      expect(parsed.due?.time, '14:30');
      expect(parsed.due?.recurrence, isNull);
      expect(parsed.unknownTokens, isEmpty);
      expect(
        parsed.chips.map((chip) => chip.kind),
        equals(<QuickChipKind>[
          QuickChipKind.date,
          QuickChipKind.priority,
          QuickChipKind.subject,
        ]),
      );
    });

    test('gère la récurrence hebdomadaire', () {
      final parsed = parse('Cours tous les lundis à 9h #Mathématiques');
      expect(parsed.title, 'Cours');
      expect(parsed.due?.date, '2025-01-06');
      expect(parsed.due?.time, '09:00');
      expect(parsed.due?.recurrence, 'Tous les lundis');
      expect(parsed.due?.rrule, 'FREQ=WEEKLY;BYDAY=MO');
      expect(parsed.subject?.id, 'math');
    });

    test('résout un préfixe unique de catégorie', () {
      expect(parse('Devoir #Phys').subject?.id, 'physics');
    });

    test('reconnaît la priorité « !!2 »', () {
      final parsed = parse('Ranger les fichiers !!2');
      expect(parsed.priority, Priority.medium);
      expect(parsed.priorityToken, isTrue);
      expect(parsed.title, 'Ranger les fichiers');
    });

    test('la dernière priorité mentionnée gagne', () {
      final parsed = parse('rapport p1 p3');
      expect(parsed.priority, Priority.low);
      expect(parsed.priorityToken, isTrue);
      expect(parsed.title, 'rapport');
    });

    test('ne confond pas un « p1 » en fin de mot', () {
      final parsed = parse('Finir supp1');
      expect(parsed.priorityToken, isFalse);
      expect(parsed.priority, Priority.medium);
      expect(parsed.title, 'Finir supp1');
    });

    test('sans jeton de priorité, priorityToken est faux', () {
      final parsed = parse('Tâche simple demain');
      expect(parsed.priorityToken, isFalse);
      expect(parsed.priority, Priority.medium);
    });

    test('ignore un jeton catégorie collé sans espace', () {
      final parsed = parse('Acheter un livre#Langues');
      expect(parsed.title, 'Acheter un livre#Langues');
      expect(parsed.subject, isNull);
    });

    test('signale une catégorie inconnue', () {
      final parsed = parse('Planifier #Nouveaute');
      expect(parsed.title, 'Planifier');
      expect(parsed.subject, isNull);
      expect(parsed.subjectToken, isTrue);
      expect(parsed.unknownTokens, equals(<String>['Nouveaute']));
      expect(
        parsed.chips,
        equals(<QuickChip>[
          const QuickChip(
            kind: QuickChipKind.subject,
            label: 'Nouveaute',
            raw: '#Nouveaute',
            unknown: true,
          ),
        ]),
      );
    });

    test('retire la ponctuation collée à un jeton', () {
      expect(parse('Devoir #Math.').subject?.id, 'math');
    });
  });

  group('parseQuickAdd — dates en langage naturel', () {
    test('traduit « demain »', () {
      final due = parse('Lire un chapitre demain').due;
      expect(due?.date, '2025-01-07');
      expect(due?.time, isNull);
    });

    test('traduit « après-demain »', () {
      expect(parse('RDV après-demain').due?.date, '2025-01-08');
    });

    test('traduit « dans 3 jours »', () {
      expect(parse('Rendu dans 3 jours').due?.date, '2025-01-09');
    });

    test('traduit « le 15 octobre »', () {
      final due = parse('Réviser le 15 octobre').due;
      expect(due?.date, '2025-10-15');
      expect(due?.time, isNull);
    });

    test('traduit une date numérique et une heure « à 15:00 »', () {
      final due = parse('Exam le 15/10 à 15:00').due;
      expect(due?.date, '2025-10-15');
      expect(due?.time, '15:00');
    });

    test('traduit « chaque jour à 7h » en récurrence quotidienne', () {
      final due = parse('Yoga chaque jour à 7h').due;
      expect(due?.date, '2025-01-06');
      expect(due?.time, '07:00');
      expect(due?.recurrence, 'Tous les jours');
      expect(due?.rrule, 'FREQ=DAILY');
    });

    test('traduit « vendredi prochain »', () {
      // lundi 6 janvier 2025 → vendredi de la semaine suivante = 17 janvier.
      expect(parse('Sortie vendredi prochain').due?.date, '2025-01-17');
    });

    test('une heure seule vaut pour aujourd’hui', () {
      final parsed = parse('Répondre au mail à 16h');
      expect(parsed.due?.date, '2025-01-06');
      expect(parsed.due?.time, '16:00');
      expect(parsed.title, 'Répondre au mail');
    });

    test('sans phrase de date, due est nul', () {
      expect(parse('Juste un titre').due, isNull);
    });

    test('traduit « aujourd’hui » et « ce soir »', () {
      expect(parse("Ranger aujourd'hui").due?.date, '2025-01-06');
      // Les claviers mobiles produisent une apostrophe typographique.
      expect(parse('Ranger aujourd\u2019hui').due?.date, '2025-01-06');
      expect(parse('Cinéma ce soir').due?.time, '18:00');
    });

    test('traduit « demain matin » à 9 h', () {
      final due = parse('Appeler le prof demain matin').due;
      expect(due?.date, '2025-01-07');
      expect(due?.time, '09:00');
    });

    test('traduit « tous les 2 jours » en récurrence intervalle', () {
      final due = parse('Arroser les plantes tous les 2 jours').due;
      expect(due?.recurrence, 'Tous les 2 jours');
      expect(due?.rrule, 'FREQ=DAILY;INTERVAL=2');
    });

    test('traduit « le 10 de chaque mois »', () {
      final due = parse('Loyer le 10 de chaque mois').due;
      expect(due?.recurrence, 'Le 10 de chaque mois');
      expect(due?.rrule, 'FREQ=MONTHLY;BYMONTHDAY=10');
    });

    test('bascule sur l’année suivante pour une date déjà passée', () {
      // Le 6 janvier, « le 3 janvier » est passé : on vise 2026.
      expect(parse('Bilan le 3 janvier').due?.date, '2026-01-03');
    });
  });

  group('parseQuickAdd — description', () {
    test('sépare la description après un double saut de ligne', () {
      final parsed = parse('Rédiger le rapport\n\nVoir le chap. 2\nDétailler');
      expect(parsed.title, 'Rédiger le rapport');
      expect(parsed.description, 'Voir le chap. 2\nDétailler');
    });

    test('sépare la description via le délimiteur « || »', () {
      final parsed = parse('Rédiger le rapport || Une brève description');
      expect(parsed.title, 'Rédiger le rapport');
      expect(parsed.description, 'Une brève description');
    });
  });

  group('dueToDate et prettyDue', () {
    test('construit une heure exacte quand une heure est donnée', () {
      final date = dueToDate(parse('Tâche demain à 14h30').due!);
      expect(date.year, 2025);
      expect(date.month, 1);
      expect(date.day, 7);
      expect(date.hour, 14);
      expect(date.minute, 30);
    });

    test('retombe en fin de journée sans heure', () {
      final date = dueToDate(parse('Tâche demain').due!);
      expect(date.hour, 23);
      expect(date.minute, 59);
      expect(isEndOfDay(date), isTrue);
    });

    test('affiche la récurrence dans le libellé', () {
      expect(prettyDue(parse('Yoga chaque jour').due!), 'Chaque jour (Tous les jours)');
    });
  });
}
