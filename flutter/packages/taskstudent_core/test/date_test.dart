import 'package:taskstudent_core/taskstudent.dart';
import 'package:test/test.dart';

/// Miroir de `__tests__/date.test.ts`.
///
/// Le formatage français est porté à la main côté Dart (pas de `intl`) : les
/// assertions sur les libellés sont donc le garde-fou de ce portage.
void main() {
  group('toDateKey', () {
    test('formate la date en heure locale', () {
      expect(toDateKey(DateTime(2026, 3, 10, 14, 30)), '2026-03-10');
    });

    test('complète le mois et le jour sur deux chiffres', () {
      expect(toDateKey(DateTime(2026, 1, 5)), '2026-01-05');
    });

    test('ne décale pas la journée pour une échéance de fin de soirée '
        '(régression du bug UTC)', () {
      // En passant par une chaîne UTC, une tâche due à 23 h dans un fuseau
      // positif basculait au lendemain (ou à la veille) selon le décalage.
      expect(toDateKey(DateTime(2026, 3, 10, 23, 45)), '2026-03-10');
      expect(toDateKey(DateTime(2026, 3, 10, 0, 15)), '2026-03-10');
    });
  });

  group('fromDateKey', () {
    test('reconstruit une date locale à midi par défaut', () {
      final date = fromDateKey('2026-03-10');
      expect(date.year, 2026);
      expect(date.month, 3);
      expect(date.day, 10);
      expect(date.hour, 12);
    });

    test('fait un aller-retour stable avec toDateKey', () {
      expect(toDateKey(fromDateKey('2026-12-31')), '2026-12-31');
    });
  });

  group('comparaisons', () {
    test('isSameDay ignore l’heure', () {
      expect(isSameDay(DateTime(2026, 3, 10, 1), DateTime(2026, 3, 10, 23)), isTrue);
      expect(isSameDay(DateTime(2026, 3, 10), DateTime(2026, 3, 11)), isFalse);
    });

    test('isSameMonth distingue les années', () {
      expect(isSameMonth(DateTime(2026, 3, 1), DateTime(2026, 3, 28)), isTrue);
      expect(isSameMonth(DateTime(2025, 3, 1), DateTime(2026, 3, 1)), isFalse);
    });

    test('addDays et daysBetween sont cohérents', () {
      final start = DateTime(2026, 3, 10, 12);
      expect(daysBetween(start, addDays(start, 7)), 7);
    });
  });

  group('bornes de période', () {
    test('startOfWeek retombe sur le lundi', () {
      // Le 10 mars 2026 est un mardi : la semaine commence le lundi 9.
      final start = startOfWeek(DateTime(2026, 3, 10, 18));
      expect(toDateKey(start), '2026-03-09');
      expect(start.hour, 0);
    });

    test('endOfWeek tombe le dimanche à 23 h 59', () {
      final end = endOfWeek(DateTime(2026, 3, 10));
      expect(toDateKey(end), '2026-03-15');
      expect(end.hour, 23);
      expect(end.minute, 59);
    });

    test('endOfMonth franchit les années', () {
      expect(toDateKey(endOfMonth(DateTime(2026, 12, 5))), '2026-12-31');
    });

    test('eachDay énumère les journées bornes incluses', () {
      final days = eachDay(DateTime(2026, 3, 2), DateTime(2026, 3, 4));
      expect(days.map(toDateKey).toList(), <String>['2026-03-02', '2026-03-03', '2026-03-04']);
    });

    test('eachDay franchit les fins de mois', () {
      final days = eachDay(DateTime(2026, 2, 27), DateTime(2026, 3, 2));
      expect(days.map(toDateKey).toList(), <String>[
        '2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02',
      ]);
    });

    test('eachDay renvoie une liste vide si les bornes sont inversées', () {
      expect(eachDay(DateTime(2026, 3, 4), DateTime(2026, 3, 2)), isEmpty);
    });
  });

  group('formatage français', () {
    test('formatShortDate abrège le mois comme fr-FR', () {
      expect(formatShortDate(DateTime(2026, 3, 12)), '12 mars');
      expect(formatShortDate(DateTime(2026, 1, 5)), '5 janv.');
    });

    test('formatShortDateWithYear ajoute l’année', () {
      expect(formatShortDateWithYear(DateTime(2027, 1, 5)), '5 janv. 2027');
    });

    test('formatDay écrit le jour en toutes lettres, en minuscules', () {
      // Le 10 mars 2026 est un mardi.
      expect(formatDay(DateTime(2026, 3, 10)), 'mardi 10 mars');
    });

    test('formatShortDay abrège le jour de la semaine', () {
      // Le 2 mars 2026 est un lundi.
      expect(formatShortDay(DateTime(2026, 3, 2)), 'lun. 2');
    });

    test('formatTime reste sur deux chiffres, au format 24 h', () {
      expect(formatTime(DateTime(2026, 3, 10, 9, 5)), '09:05');
      expect(formatTime(DateTime(2026, 3, 10, 14, 30)), '14:30');
    });

    test('formatRange sépare par un tiret cadratin', () {
      expect(formatRange(DateTime(2026, 3, 2), DateTime(2026, 3, 9)), '2 mars – 9 mars');
    });
  });

  group('isEndOfDay', () {
    test('reconnaît une échéance posée en fin de journée', () {
      expect(isEndOfDay(DateTime(2026, 3, 10, 23, 59)), isTrue);
      expect(isEndOfDay(DateTime(2026, 3, 10, 23, 59, 59, 999)), isTrue);
    });

    test('refuse une heure réellement choisie', () {
      expect(isEndOfDay(DateTime(2026, 3, 10, 23, 30)), isFalse);
      expect(isEndOfDay(DateTime(2026, 3, 10, 18)), isFalse);
    });
  });

  group('formatDueLabel', () {
    final now = DateTime(2026, 3, 10, 8);

    test('nomme le jour du jour et garde l’heure choisie', () {
      expect(formatDueLabel(DateTime(2026, 3, 10, 14, 30), now), "Aujourd'hui 14:30");
    });

    test('masque l’heure d’une échéance « fin de journée »', () {
      expect(formatDueLabel(DateTime(2026, 3, 10, 23, 59, 59, 999), now), "Aujourd'hui");
    });

    test('nomme demain et hier', () {
      expect(formatDueLabel(DateTime(2026, 3, 11, 9, 5), now), 'Demain 09:05');
      expect(formatDueLabel(DateTime(2026, 3, 9, 23, 59), now), 'Hier');
    });

    test('date au-delà, sans l’année en cours', () {
      expect(formatDueLabel(DateTime(2026, 5, 20, 23, 59), now), '20 mai');
      expect(formatDueLabel(DateTime(2026, 5, 20, 17), now), '20 mai, 17:00');
    });

    test('ajoute l’année pour une échéance lointaine', () {
      expect(formatDueLabel(DateTime(2027, 1, 5, 23, 59), now), '5 janv. 2027');
    });
  });
}
