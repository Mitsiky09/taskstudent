/// Utilitaires de date, portés de `lib/date.ts`.
///
/// Règle du projet, inchangée : les dates sont **stockées** en ISO 8601 mais
/// toujours **comparées et affichées** en heure locale. Construire une clé de
/// jour à partir d'une chaîne UTC décale la tâche d'une journée dès que le
/// fuseau n'est pas UTC (une échéance à 01 h 00 à Antananarivo, UTC+3,
/// tomberait la veille). Toutes les clés de jour passent par [toDateKey].
///
/// Le formatage français est porté à la main plutôt que délégué à `intl` :
/// le paquet n'a ainsi aucune dépendance d'exécution et se teste avec
/// `dart test` seul.
library;

const int _usPerDay = 86400000000;

/// Mois en toutes lettres, indexés de 0 (janvier) à 11 (décembre).
const List<String> kMonthsLong = <String>[
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin', //
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/// Mois abrégés, tels que les produit `fr-FR` (« 5 janv. 2027 »).
const List<String> kMonthsShort = <String>[
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', //
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/// Jours abrégés, indexés comme `DateTime.weekday % 7` (dimanche = 0).
const List<String> kWeekdaysShort = <String>[
  'dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.',
];

/// Jours en toutes lettres, même indexation.
const List<String> kWeekdaysLong = <String>[
  'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
];

String _pad2(int value) => value.toString().padLeft(2, '0');

/// Clé de jour locale au format `AAAA-MM-JJ`.
String toDateKey(DateTime date) =>
    '${date.year}-${_pad2(date.month)}-${_pad2(date.day)}';

/// Reconstruit une date locale à partir d'une clé `AAAA-MM-JJ`.
DateTime fromDateKey(String key, {int hours = 12, int minutes = 0}) {
  final parts = key.split('-').map(int.parse).toList(growable: false);
  return DateTime(parts[0], parts[1], parts[2], hours, minutes);
}

/// Même jour calendaire, en heure locale.
bool isSameDay(DateTime a, DateTime b) => toDateKey(a) == toDateKey(b);

/// Même mois calendaire.
bool isSameMonth(DateTime a, DateTime b) => a.year == b.year && a.month == b.month;

/// Ajoute (ou retire) un nombre de jours.
DateTime addDays(DateTime date, int days) => date.add(Duration(days: days));

/// Nombre de jours (éventuellement fractionnaire) entre deux instants.
double daysBetween(DateTime from, DateTime to) =>
    to.difference(from).inMicroseconds / _usPerDay;

/// Minuit du jour donné.
DateTime startOfDay(DateTime date) => DateTime(date.year, date.month, date.day);

/// 23 h 59 min 59,999 s du jour donné.
DateTime endOfDay(DateTime date) =>
    DateTime(date.year, date.month, date.day, 23, 59, 59, 999);

/// Lundi 00 h de la semaine contenant [date].
DateTime startOfWeek(DateTime date) {
  final start = startOfDay(date);
  final offset = start.weekday - 1; // DateTime.weekday : lundi = 1
  return start.subtract(Duration(days: offset));
}

/// Dimanche 23 h 59 de la semaine contenant [date].
DateTime endOfWeek(DateTime date) => endOfDay(startOfWeek(date).add(const Duration(days: 6)));

/// Premier jour du mois à minuit.
DateTime startOfMonth(DateTime date) => DateTime(date.year, date.month);

/// Dernier jour du mois à 23 h 59.
DateTime endOfMonth(DateTime date) =>
    DateTime(date.year, date.month + 1, 0, 23, 59, 59, 999);

/// Énumère les journées (bornes incluses) entre deux dates, en heure locale.
///
/// Les jours sont construits à midi pour rester stables quelle que soit
/// l'heure d'entrée. Une borne inversée ou vide renvoie une liste vide.
List<DateTime> eachDay(DateTime from, DateTime to) {
  final first = startOfDay(from);
  final last = startOfDay(to);
  // Écart calculé en UTC : une heure d'été/hiver ne doit pas faire perdre une
  // journée au décompte.
  final count = DateTime.utc(last.year, last.month, last.day)
      .difference(DateTime.utc(first.year, first.month, first.day))
      .inDays;
  if (count < 0) return <DateTime>[];
  // `DateTime` normalise les débordements : `day + i` franchit les mois.
  return <DateTime>[
    for (var i = 0; i <= count; i++) DateTime(first.year, first.month, first.day + i, 12),
  ];
}

/// Jour court français, ex. « lun. 3 ».
String formatShortDay(DateTime date) =>
    '${kWeekdaysShort[date.weekday % 7]} ${date.day}';

/// Jour long français, ex. « mardi 10 mars ».
String formatDay(DateTime date) =>
    '${kWeekdaysLong[date.weekday % 7]} ${date.day} ${kMonthsLong[date.month - 1]}';

/// Date courte française, ex. « 12 mars ».
String formatShortDate(DateTime date) => '${date.day} ${kMonthsShort[date.month - 1]}';

/// Date courte avec l'année, ex. « 5 janv. 2027 ».
String formatShortDateWithYear(DateTime date) =>
    '${date.day} ${kMonthsShort[date.month - 1]} ${date.year}';

/// Heure sur deux chiffres, au format 24 h (« 14:05 »).
String formatTime(DateTime date) => '${_pad2(date.hour)}:${_pad2(date.minute)}';

/// Date et heure, ex. « 12 mars à 14:05 ».
String formatDateTime(DateTime date) => '${formatShortDate(date)} à ${formatTime(date)}';

/// Intervalle lisible, ex. « 2 mars – 9 mars ».
String formatRange(DateTime from, DateTime to) =>
    '${formatShortDate(from)} – ${formatShortDate(to)}';

/// Échéance posée « en fin de journée » (23 h 59) : valeur par défaut des
/// tâches créées sans heure précise. L'heure n'a alors aucune signification
/// pour l'utilisateur et ne doit pas être affichée.
bool isEndOfDay(DateTime date) => date.hour == 23 && date.minute >= 59;

/// Échéance compacte pour les listes : « Aujourd'hui 14:00 », « Demain »,
/// « Hier », « 12 mars », « 5 janv. 2027 ».
///
/// Deux règles de sobriété : l'heure disparaît quand elle vaut 23 h 59, et le
/// jour est nommé plutôt que daté tant qu'il reste proche.
String formatDueLabel(DateTime due, [DateTime? now]) {
  final reference = now ?? DateTime.now();
  final time = isEndOfDay(due) ? '' : formatTime(due);
  String join(String label) => time.isEmpty ? label : '$label $time';

  if (isSameDay(due, reference)) return join("Aujourd'hui");
  if (isSameDay(due, addDays(reference, 1))) return join('Demain');
  if (isSameDay(due, addDays(reference, -1))) return join('Hier');

  final day = due.year == reference.year
      ? formatShortDate(due)
      : formatShortDateWithYear(due);
  return time.isEmpty ? day : '$day, $time';
}
