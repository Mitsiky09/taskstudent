import '../models/task.dart';
import 'dates.dart';

/// Moteur de « saisie rapide » façon Todoist, porté de `lib/quickadd.ts`.
///
/// Module pur : on tape une phrase, elle devient une tâche structurée.
///
/// Syntaxe reconnue (l'ordre des règles compte — les phrases de dates sont
/// consommées avant les jetons) :
///
/// * **Dates** : « demain », « après-demain », « ce soir », « le 15 octobre »,
///   « 15/10 », « lundi », « vendredi prochain », « dans 3 jours », « à 14h30 » ;
/// * **Récurrences** : « chaque jour », « tous les lundis »,
///   « tous les 2 jours », « le 10 de chaque mois » ;
/// * **Catégorie** : `#Mathématiques`, préfixe unique toléré (`#Math`) ;
/// * **Priorité** : `p1`…`p4` ou `!!1`…`!!4` (`p1` = la plus haute) ;
/// * **Description** : après un double saut de ligne ou le délimiteur `||`.
library;

/// Catégorie candidate pour la saisie rapide.
///
/// Structure allégée par rapport à [Subject] : le moteur n'a besoin que de
/// l'identifiant et du nom, ce qui lui évite de dépendre des préférences.
class QuickSubject {
  /// Catégorie connue du moteur.
  const QuickSubject({required this.id, required this.name});

  /// Identifiant stable.
  final String id;

  /// Nom affiché, comparé sans casse.
  final String name;

  @override
  bool operator ==(Object other) =>
      other is QuickSubject && other.id == id && other.name == name;

  @override
  int get hashCode => Object.hash(id, name);

  @override
  String toString() => 'QuickSubject($id, $name)';
}

/// Échéance déduite du texte saisi.
class ParsedDue {
  /// Échéance extraite.
  const ParsedDue({
    required this.date,
    required this.raw,
    this.time,
    this.recurrence,
    this.rrule,
  });

  /// Date au format `AAAA-MM-JJ`, en heure locale.
  final String date;

  /// Heure `HH:MM` (24 h) si elle était écrite, sinon `null`.
  final String? time;

  /// Récurrence lisible, ex. « Tous les lundis ».
  final String? recurrence;

  /// Règle RRULE correspondante, ex. `FREQ=WEEKLY;BYDAY=MO`.
  final String? rrule;

  /// Texte brut consommé, affiché dans une pastille.
  final String raw;

  @override
  bool operator ==(Object other) =>
      other is ParsedDue &&
      other.date == date &&
      other.time == time &&
      other.recurrence == recurrence &&
      other.rrule == rrule &&
      other.raw == raw;

  @override
  int get hashCode => Object.hash(date, time, recurrence, rrule, raw);

  @override
  String toString() => 'ParsedDue($date, $time, $recurrence)';
}

/// Nature d'une pastille de saisie rapide.
enum QuickChipKind {
  /// Échéance.
  date,

  /// Priorité.
  priority,

  /// Catégorie.
  subject,
}

/// Pastille affichée sous le champ de saisie.
class QuickChip {
  /// Pastille de saisie.
  const QuickChip({
    required this.kind,
    required this.label,
    required this.raw,
    this.subjectId,
    this.priority,
    this.unknown = false,
  });

  /// Nature de la pastille.
  final QuickChipKind kind;

  /// Texte affiché.
  final String label;

  /// Texte brut d'origine.
  final String raw;

  /// Catégorie reconnue, le cas échéant.
  final String? subjectId;

  /// Priorité reconnue, le cas échéant.
  final Priority? priority;

  /// `true` pour une catégorie `#…` saisie mais absente de la liste connue.
  final bool unknown;

  @override
  bool operator ==(Object other) =>
      other is QuickChip &&
      other.kind == kind &&
      other.label == label &&
      other.raw == raw &&
      other.subjectId == subjectId &&
      other.priority == priority &&
      other.unknown == unknown;

  @override
  int get hashCode => Object.hash(kind, label, raw, subjectId, priority, unknown);

  @override
  String toString() => 'QuickChip(${kind.name}, $label)';
}

/// Résultat complet de l'analyse d'une saisie.
class ParsedQuickAdd {
  /// Analyse d'une phrase de saisie rapide.
  const ParsedQuickAdd({
    required this.title,
    required this.description,
    required this.due,
    required this.priority,
    required this.priorityToken,
    required this.subject,
    required this.subjectToken,
    required this.unknownTokens,
    required this.chips,
  });

  /// Titre débarrassé des jetons et des phrases de dates.
  final String title;

  /// Description extraite après un double saut de ligne ou `||`.
  final String description;

  /// Échéance, `null` si aucune date n'était écrite.
  final ParsedDue? due;

  /// Priorité déduite ; `medium` par défaut.
  final Priority priority;

  /// `true` si un jeton de priorité était présent.
  final bool priorityToken;

  /// Catégorie reconnue via `#…`, sinon `null`.
  final QuickSubject? subject;

  /// `true` si un `#…` était présent, reconnu ou non.
  final bool subjectToken;

  /// Jetons `#…` saisis mais introuvables.
  final List<String> unknownTokens;

  /// Pastilles à afficher.
  final List<QuickChip> chips;
}

/// Libellés de priorité propres à la saisie rapide.
///
/// L'application d'origine affiche ici « Haute / Moyenne / Basse »
/// (`lib/quickadd.ts`) alors que les listes affichent « P1 / P3 / P4 »
/// (`constants/index.ts`). L'écart est conservé pour rester fidèle au
/// portage ; il est signalé comme incohérence à corriger.
const Map<Priority, String> kQuickPriorityLabels = <Priority, String>{
  Priority.high: 'Haute',
  Priority.medium: 'Moyenne',
  Priority.low: 'Basse',
};

const Priority _defaultPriority = Priority.medium;

/// `p1` = la plus haute, comme dans l'application d'origine.
Priority _priorityLevel(int level) =>
    level <= 1 ? Priority.high : (level == 2 ? Priority.medium : Priority.low);

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                        */
/* ------------------------------------------------------------------ */

const List<String> _weekdayRules = <String>['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

String _pad2(int value) => value.toString().padLeft(2, '0');

/// Ajoute des jours au calendrier (pas en millisecondes) : `setDate` côté JS.
DateTime _addDaysLocal(DateTime date, int days) =>
    DateTime(date.year, date.month, date.day + days);

/// Prochain jour de la semaine [weekday] (index `kWeekdaysLong`, dimanche = 0),
/// aujourd'hui inclus s'il correspond.
DateTime _nextWeekday(DateTime from, int weekday) {
  final base = startOfDay(from);
  for (var i = 0; i < 7; i++) {
    final candidate = _addDaysLocal(base, i);
    if (candidate.weekday % 7 == weekday) return candidate;
  }
  return base;
}

DateTime _withTime(DateTime date, String time) {
  final parts = time.split(':');
  return DateTime(
    date.year,
    date.month,
    date.day,
    int.parse(parts[0]),
    int.parse(parts[1]),
  );
}

/// Reconstruit l'échéance : heure exacte si elle était écrite, fin de journée
/// sinon.
DateTime dueToDate(ParsedDue due) {
  final base = fromDateKey(due.date, hours: 0, minutes: 0);
  final time = due.time;
  if (time == null) return endOfDay(base);
  return _withTime(base, time);
}

String _normalizeName(String name) =>
    name.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');

/// Retire la ponctuation de fin d'un jeton (`#Maths.` → `Maths`).
String _trimPunctuation(String text) =>
    text.replaceAll(RegExp(r'[.,;:!?)\]]+$'), '').trim();

String _capitalize(String text) =>
    text.isEmpty ? text : text[0].toUpperCase() + text.substring(1);

int _weekdayIndex(String name) => kWeekdaysLong.indexOf(name.toLowerCase());

int _monthIndex(String name) => kMonthsLong.indexOf(name.toLowerCase());

/* ------------------------------------------------------------------ */
/*  Motifs de date                                                     */
/* ------------------------------------------------------------------ */

enum _DateKind { today, offset, weekday, weekdayNext, monthday, abs }

class _DateContext {
  const _DateContext(
    this.type, {
    this.n,
    this.weekday,
    this.year,
    this.month,
    this.day,
  });

  final _DateKind type;
  final int? n;
  final int? weekday;
  final int? year;

  /// Mois en base 1 (janvier = 1), comme `DateTime`.
  final int? month;
  final int? day;
}

class _Recurrence {
  const _Recurrence(this.label, this.rrule);

  final String label;
  final String rrule;
}

class _DateFragment {
  const _DateFragment({required this.raw, this.context, this.time, this.recurrence});

  final _DateContext? context;
  final String? time;
  final _Recurrence? recurrence;
  final String raw;
}

class _DateRule {
  const _DateRule(this.regexp, this.resolve);

  final RegExp regexp;
  final _DateFragment? Function(RegExpMatch match) resolve;
}

const String _weekdayPattern = '(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)';
const String _monthPattern =
    '(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)';

RegExp _ci(String pattern) => RegExp(pattern, caseSensitive: false);

final List<_DateRule> _dateRules = <_DateRule>[
  // Récurrences longues d'abord, pour ne pas laisser un mot isolé de côté.
  _DateRule(
    _ci(r'(?:tous les|chaque)\s+(\d{1,2})\s+jours\b'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.today),
      recurrence: _Recurrence('Tous les ${m.group(1)} jours', 'FREQ=DAILY;INTERVAL=${m.group(1)}'),
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'(?:tous les|chaque)\s+(\d{1,2})\s+semaines\b'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.today),
      recurrence:
          _Recurrence('Tous les ${m.group(1)} semaines', 'FREQ=WEEKLY;INTERVAL=${m.group(1)}'),
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci('(?:tous les|chaque)\\s+$_weekdayPattern' r's?\b'),
    (m) {
      final index = _weekdayIndex(m.group(1)!);
      return _DateFragment(
        context: _DateContext(_DateKind.weekday, weekday: index),
        recurrence: _Recurrence(
          'Tous les ${kWeekdaysLong[index]}s',
          'FREQ=WEEKLY;BYDAY=${_weekdayRules[index]}',
        ),
        raw: m.group(0)!,
      );
    },
  ),
  _DateRule(
    _ci(r'le\s+(\d{1,2})\s+de\s+chaque\s+mois\b'),
    (m) {
      final day = int.parse(m.group(1)!);
      return _DateFragment(
        context: _DateContext(_DateKind.monthday, day: day),
        recurrence: _Recurrence('Le $day de chaque mois', 'FREQ=MONTHLY;BYMONTHDAY=$day'),
        raw: m.group(0)!,
      );
    },
  ),
  _DateRule(
    _ci(r'(?:chaque jour|tous les jours|quotidien(?:nement)?)\b'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.today),
      recurrence: const _Recurrence('Tous les jours', 'FREQ=DAILY'),
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'(?:chaque semaine|hebdomadaire(?:ment)?)\b'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.today),
      recurrence: const _Recurrence('Chaque semaine', 'FREQ=WEEKLY'),
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'(?:chaque mois|mensuel(?:lement)?)\b'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.today),
      recurrence: const _Recurrence('Chaque mois', 'FREQ=MONTHLY'),
      raw: m.group(0)!,
    ),
  ),

  // Dates relatives.
  _DateRule(
    _ci(r'après-demain|apres-demain|après demain'),
    (m) => _DateFragment(context: const _DateContext(_DateKind.offset, n: 2), raw: m.group(0)!),
  ),
  _DateRule(
    _ci(r'aujourd(?:\s+|[' "'" '\u2019' r'])?hui\b'),
    (m) => _DateFragment(context: const _DateContext(_DateKind.today), raw: m.group(0)!),
  ),
  _DateRule(
    _ci(r'demain\s+matin'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.offset, n: 1),
      time: '09:00',
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'demain\s+soir'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.offset, n: 1),
      time: '18:00',
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'demain\b'),
    (m) => _DateFragment(context: const _DateContext(_DateKind.offset, n: 1), raw: m.group(0)!),
  ),
  _DateRule(
    _ci(r'ce\s+soir\b'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.today),
      time: '18:00',
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'cette\s+nuit\b'),
    (m) => _DateFragment(
      context: const _DateContext(_DateKind.today),
      time: '22:00',
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'dans\s+(?:(\d{1,3})|(une|deux|trois|quatre|cinq|sept|dix|douze))\s+'
        r'(jours?|heures?|semaines?|mois|ans?)(?=\s|$)'),
    (m) {
      const words = <String, int>{
        'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5, //
        'sept': 7, 'dix': 10, 'douze': 12,
      };
      final digits = m.group(1);
      final count = digits != null ? int.parse(digits) : (words[m.group(2)!.toLowerCase()] ?? 1);
      final unit = m.group(3)!;
      final int days;
      if (unit.startsWith('jour')) {
        days = count;
      } else if (unit.startsWith('semaine')) {
        days = count * 7;
      } else if (unit.startsWith('heure')) {
        days = 0;
      } else if (unit.startsWith('mois')) {
        days = count * 30;
      } else {
        days = count * 365;
      }
      return _DateFragment(
        context: days > 0
            ? _DateContext(_DateKind.offset, n: days)
            : const _DateContext(_DateKind.today),
        raw: m.group(0)!,
      );
    },
  ),
  _DateRule(
    _ci(r'la\s+semaine\s+prochaine\b'),
    (m) => _DateFragment(context: const _DateContext(_DateKind.offset, n: 7), raw: m.group(0)!),
  ),

  // Jours de la semaine.
  _DateRule(
    _ci('\\b$_weekdayPattern\\s+prochain\\b'),
    (m) => _DateFragment(
      context: _DateContext(_DateKind.weekdayNext, weekday: _weekdayIndex(m.group(1)!)),
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci('\\b$_weekdayPattern\\b'),
    (m) => _DateFragment(
      context: _DateContext(_DateKind.weekday, weekday: _weekdayIndex(m.group(1)!)),
      raw: m.group(0)!,
    ),
  ),

  // Dates absolues en français.
  _DateRule(
    _ci('le\\s+(\\d{1,2})\\s+$_monthPattern\\b'),
    (m) => _DateFragment(
      context: _DateContext(
        _DateKind.monthday,
        day: int.parse(m.group(1)!),
        month: _monthIndex(m.group(2)!) + 1,
      ),
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci('(\\d{1,2})\\s+$_monthPattern\\b'),
    (m) => _DateFragment(
      context: _DateContext(
        _DateKind.monthday,
        day: int.parse(m.group(1)!),
        month: _monthIndex(m.group(2)!) + 1,
      ),
      raw: m.group(0)!,
    ),
  ),
  _DateRule(
    _ci(r'le\s+(\d{1,2})(?=\s|$)'),
    (m) => _DateFragment(
      context: _DateContext(_DateKind.monthday, day: int.parse(m.group(1)!)),
      raw: m.group(0)!,
    ),
  ),

  // Dates numériques.
  _DateRule(
    _ci(r'(?:(\d{4})-(\d{1,2})-(\d{1,2}))|\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b'),
    (m) {
      final isoYear = m.group(1);
      if (isoYear != null) {
        return _DateFragment(
          context: _DateContext(
            _DateKind.abs,
            year: int.parse(isoYear),
            month: int.parse(m.group(2)!),
            day: int.parse(m.group(3)!),
          ),
          raw: m.group(0)!,
        );
      }
      final shortYear = m.group(6);
      return _DateFragment(
        context: _DateContext(
          _DateKind.abs,
          year: shortYear == null ? null : int.parse(shortYear),
          month: int.parse(m.group(5)!),
          day: int.parse(m.group(4)!),
        ),
        raw: m.group(0)!,
      );
    },
  ),

  // Heures, rattachées ensuite à la date consommée (ou à aujourd'hui).
  _DateRule(
    _ci(r'(?:^|[\s,(])(?:à|a)\s*(\d{1,2})h(?:\s*(\d{2}))?(?:min)?'),
    (m) => _DateFragment(
      time: '${_pad2(int.parse(m.group(1)!))}:${m.group(2) ?? '00'}',
      raw: m.group(0)!.trim(),
    ),
  ),
  _DateRule(
    _ci(r'(?:^|[\s,(])(?:à|a)\s*(\d{1,2}):(\d{2})\b'),
    (m) => _DateFragment(
      time: '${_pad2(int.parse(m.group(1)!))}:${m.group(2)}',
      raw: m.group(0)!.trim(),
    ),
  ),
];

DateTime _resolveContext(_DateContext context, DateTime now) {
  final today = startOfDay(now);
  switch (context.type) {
    case _DateKind.today:
      return today;
    case _DateKind.offset:
      return _addDaysLocal(today, context.n ?? 0);
    case _DateKind.weekday:
      return _nextWeekday(today, context.weekday ?? 0);
    case _DateKind.weekdayNext:
      return _nextWeekday(_addDaysLocal(today, 7), context.weekday ?? 0);
    case _DateKind.monthday:
      final year = context.year ?? now.year;
      final month = context.month ?? now.month;
      final day = context.day ?? 1;
      var date = DateTime(year, month, day);
      if (context.year == null && context.month != null && date.isBefore(today)) {
        // « le 15 octobre » passé : on vise l'année suivante.
        date = DateTime(year + 1, month, day);
      } else if (context.year == null && context.month == null && date.isBefore(today)) {
        // « le 15 » passé : on vise le mois suivant.
        date = DateTime(year, month + 1, day);
      }
      return date;
    case _DateKind.abs:
      final month = context.month ?? 1;
      final day = context.day ?? 1;
      if (context.year == null) {
        final date = DateTime(now.year, month, day);
        return date.isBefore(today) ? DateTime(now.year + 1, month, day) : date;
      }
      return DateTime(context.year!, month, day);
  }
}

/// Consomme les règles de dates en retirant du tampon le texte reconnu.
({String buffer, List<_DateFragment> fragments}) _extractDates(String buffer) {
  var out = buffer;
  final fragments = <_DateFragment>[];
  for (final rule in _dateRules) {
    final next = StringBuffer();
    var cursor = 0;
    for (final match in rule.regexp.allMatches(out)) {
      final fragment = rule.resolve(match);
      if (fragment != null) fragments.add(fragment);
      next
        ..write(out.substring(cursor, match.start))
        ..write(' ');
      cursor = match.end;
    }
    next.write(out.substring(cursor));
    out = next.toString();
  }
  return (buffer: out, fragments: fragments);
}

/// Concatène les fragments : première date, sa récurrence et son heure.
ParsedDue? _buildDueInfo(List<_DateFragment> fragments, DateTime now) {
  _DateFragment? firstWhere(bool Function(_DateFragment fragment) test) {
    for (final fragment in fragments) {
      if (test(fragment)) return fragment;
    }
    return null;
  }

  final contextFragment = firstWhere((fragment) => fragment.context != null);
  final recurrenceFragment = firstWhere((fragment) => fragment.recurrence != null);
  final timeFragment = firstWhere((fragment) => fragment.time != null);
  if (contextFragment == null && recurrenceFragment == null && timeFragment == null) {
    return null;
  }

  var date = contextFragment != null
      ? _resolveContext(contextFragment.context!, now)
      : startOfDay(now);
  final time = timeFragment?.time;
  if (time != null) date = _withTime(date, time);

  // `raw` reprend les fragments utiles, sans doublon (identité de l'objet).
  final unique = <_DateFragment>{
    for (final fragment in <_DateFragment?>[
      contextFragment,
      recurrenceFragment,
      timeFragment,
    ])
      if (fragment != null) fragment,
  };
  final rawParts = unique.map((fragment) => fragment.raw).where((raw) => raw.isNotEmpty);

  return ParsedDue(
    date: toDateKey(date),
    time: time,
    recurrence: recurrenceFragment?.recurrence?.label,
    rrule: recurrenceFragment?.recurrence?.rrule,
    raw: rawParts.join(' '),
  );
}

/* ------------------------------------------------------------------ */
/*  Jetons # et priorités                                              */
/* ------------------------------------------------------------------ */

final RegExp _sigilRegExp = RegExp(r'(?:^|[\s,(])([#][^\s#]+)');

final RegExp _priorityRegExp =
    RegExp(r'(?:^|[\s,(])(?:(p)([1-4])|(!!)([1-4]))(?=[\s,.)!?]|$)', caseSensitive: false);

(String, String) _splitDescription(String input) {
  final doubleBreak = input.indexOf('\n\n');
  if (doubleBreak != -1) {
    return (input.substring(0, doubleBreak), input.substring(doubleBreak + 2));
  }
  final delimiter = input.indexOf(' || ');
  if (delimiter != -1) {
    return (input.substring(0, delimiter), input.substring(delimiter + 4));
  }
  return (input, '');
}

/// Libellé lisible d'une échéance, ex. « Demain à 14h30 ».
String prettyDue(ParsedDue due) {
  final recurrence = due.recurrence == null ? '' : ' (${due.recurrence})';
  return '${_capitalize(due.raw)}$recurrence';
}

/// Analyse une phrase de saisie rapide.
///
/// [subjects] sont les catégories connues : la comparaison ignore la casse et
/// un préfixe unique suffit (`#Phys` → Physique). [now] fixe le référentiel
/// temporel, ce qui rend les tests déterministes.
ParsedQuickAdd parseQuickAdd(
  String input, {
  List<QuickSubject> subjects = const <QuickSubject>[],
  DateTime? now,
}) {
  final reference = now ?? DateTime.now();

  final (titleBlockRaw, description) = _splitDescription(input);
  final buffer = titleBlockRaw.replaceAll(RegExp(r'\s+'), ' ').trim();

  // 1) Dates et récurrences.
  final extracted = _extractDates(buffer);
  final due = _buildDueInfo(extracted.fragments, reference);

  // 2) Catégories `#…`.
  final subjectTokens = <String>[];
  final unknownTokens = <String>[];
  var titleBuffer = extracted.buffer.replaceAllMapped(_sigilRegExp, (match) {
    final body = _trimPunctuation(match.group(1)!.substring(1));
    if (body.isNotEmpty) subjectTokens.add(body);
    return ' ';
  });

  // 3) Priorités `p1`..`p4` / `!!1`..`!!4` : la dernière mentionnée gagne.
  var priority = _defaultPriority;
  var priorityToken = false;
  titleBuffer = titleBuffer.replaceAllMapped(_priorityRegExp, (match) {
    final level = int.parse(match.group(2) ?? match.group(4)!);
    priority = _priorityLevel(level);
    priorityToken = true;
    return ' ';
  });

  final title = titleBuffer.replaceAll(RegExp(r'\s+'), ' ').trim();

  // 4) Résolution par nom exact, sinon par préfixe unique.
  QuickSubject? subject;
  for (final token in subjectTokens) {
    final normalized = _normalizeName(token);
    final exact = subjects.where((candidate) => _normalizeName(candidate.name) == normalized);
    final matches = exact.isNotEmpty
        ? exact.toList(growable: false)
        : subjects
            .where((candidate) => _normalizeName(candidate.name).startsWith(normalized))
            .toList(growable: false);
    if (matches.length == 1) {
      subject = matches.first;
      break;
    }
    unknownTokens.add(token);
  }

  // 5) Pastilles pour l'interface.
  final chips = <QuickChip>[];
  if (due != null) {
    chips.add(QuickChip(kind: QuickChipKind.date, label: prettyDue(due), raw: due.raw));
  }
  if (priorityToken) {
    chips.add(
      QuickChip(
        kind: QuickChipKind.priority,
        label: kQuickPriorityLabels[priority] ?? '',
        raw: priority.wire,
        priority: priority,
      ),
    );
  }
  if (subject != null) {
    chips.add(
      QuickChip(
        kind: QuickChipKind.subject,
        label: subject.name,
        raw: '#${subject.name}',
        subjectId: subject.id,
      ),
    );
  }
  for (final token in unknownTokens) {
    chips.add(
      QuickChip(kind: QuickChipKind.subject, label: token, raw: '#$token', unknown: true),
    );
  }

  return ParsedQuickAdd(
    title: title,
    description: description.trim(),
    due: due,
    priority: priority,
    priorityToken: priorityToken,
    subject: subject,
    subjectToken: subjectTokens.isNotEmpty,
    unknownTokens: unknownTokens,
    chips: chips,
  );
}
