import 'models/task.dart';

/// Constantes applicatives, portées de `constants/index.ts`.
///
/// Les couleurs restent des chaînes `#rrggbb` : le paquet n'importe pas Flutter,
/// donc pas `Color`. La couche applicative les convertit (`Color(0xFF…)` ou
/// l'extension fournie dans `theme.dart` côté app).
library;

/// Catégories par défaut, façon Todoist.
const List<Subject> kProjects = <Subject>[
  Subject(id: 'inbox', name: 'Boîte de réception', color: '#94a3b8'),
  Subject(id: 'work', name: 'Travail', color: '#4f46e5'),
  Subject(id: 'personal', name: 'Personnel', color: '#0ea5e9'),
  Subject(id: 'shopping', name: 'Courses', color: '#f59e0b'),
];

/// Catégorie de repli quand une référence est inconnue.
const Subject kFallbackProject =
    Subject(id: 'inbox', name: 'Boîte de réception', color: '#94a3b8');

/// Correspondance des anciens identifiants « matière » vers les projets.
const Map<String, String> kLegacySubjectMap = <String, String>{
  'math': 'work',
  'physics': 'work',
  'history': 'personal',
  'languages': 'personal',
  'other': 'inbox',
};

/// Résout une catégorie par son identifiant, avec repli.
Subject getProject(String projectId) =>
    kProjects.firstWhere((p) => p.id == projectId, orElse: () => kFallbackProject);

/// Résout une catégorie parmi une liste fournie (celles de l'utilisateur).
Subject getCategory(List<Subject> categories, String categoryId) =>
    categories.firstWhere((c) => c.id == categoryId, orElse: () => kFallbackProject);

/// Palette proposée à la création d'une catégorie.
const List<String> kCategoryColors = <String>[
  '#4f46e5', // primary
  '#0ea5e9', // info
  '#10b981', // success
  '#f59e0b', // warning
  '#f43f5e', // danger
  '#a855f7',
  '#14b8a6',
  '#475569',
];

/// Libellés de priorité.
///
/// L'application d'origine (`constants/index.ts` → `PRIORITY_LABELS`) affiche
/// « P1 » / « P3 » / « P4 » : le P2 de l'échelle Todoist manque. L'échelle est
/// reproduite telle quelle pour rester fidèle, mais regroupée ici afin qu'une
/// correction ne touche qu'un seul endroit.
const Map<Priority, String> kPriorityLabels = <Priority, String>{
  Priority.low: 'P4',
  Priority.medium: 'P3',
  Priority.high: 'P1',
};

/// Couleurs de priorité, alignées sur les tokens sémantiques.
const Map<Priority, String> kPriorityColors = <Priority, String>{
  Priority.low: '#94a3b8',
  Priority.medium: '#4f46e5',
  Priority.high: '#f43f5e',
};

/// Couleurs d'état utilisées par les graphiques et les pastilles.
const Map<String, String> kStatusColors = <String, String>{
  'todo': '#4f46e5',
  'reported': '#f59e0b',
  'done': '#10b981',
  'overdue': '#f43f5e',
};

/// Durées rapides proposées dans les formulaires, en minutes.
const List<int> kDurationOptions = <int>[15, 30, 45, 60, 90, 120];

/// Règles de répétition proposées dans les formulaires.
const List<(RepeatRule, String)> kRepeatOptions = <(RepeatRule, String)>[
  (RepeatRule.none, 'Jamais'),
  (RepeatRule.daily, 'Chaque jour'),
  (RepeatRule.weekly, 'Chaque semaine'),
  (RepeatRule.monthly, 'Chaque mois'),
];

/// Libellés d'affichage d'une répétition (`lib/tasks.ts` → `repeatLabel`).
///
/// À ne pas confondre avec [kRepeatOptions], qui alimente les formulaires :
/// l'application d'origine affiche « Chaque jour » dans le sélecteur
/// (`constants/index.ts` → `REPEAT_OPTIONS`) mais « Tous les jours » dans le
/// résumé d'une tâche (`lib/tasks.ts` → `repeatLabel`). L'écart est conservé
/// ici pour rester fidèle au portage ; l'unifier est une amélioration
/// candidate, pas une correction de comportement.
const Map<RepeatRule, String> kRepeatDisplayLabels = <RepeatRule, String>{
  RepeatRule.none: 'Jamais',
  RepeatRule.daily: 'Tous les jours',
  RepeatRule.weekly: 'Chaque semaine',
  RepeatRule.monthly: 'Chaque mois',
};

/// Clés de persistance.
abstract final class StorageKeys {
  /// Liste des tâches.
  static const String tasks = '@taskstudent/tasks';

  /// Session locale.
  static const String user = '@taskstudent/user';

  /// Introduction déjà vue.
  static const String onboarding = '@taskstudent/onboarding';

  /// Préférences.
  static const String settings = '@taskstudent/settings';
}

/// Préférences par défaut.
final Settings kDefaultSettings = Settings(categories: kProjects);

/// Délai avant archivage automatique d'une tâche terminée, en jours.
const int kAutoArchiveDays = 7;
