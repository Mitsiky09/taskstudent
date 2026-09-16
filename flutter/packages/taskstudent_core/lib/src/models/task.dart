/// Modèles de données de TaskStudent.
///
/// Port fidèle de `types/index.ts` de l'application React Native. Le format de
/// persistance est **identique** (mêmes noms de champs, dates en ISO 8601) :
/// un export JSON produit par l'application Expo se recharge tel quel ici.
library;

/// Priorité d'une tâche.
///
/// Trois niveaux, comme dans l'application d'origine. Les libellés affichés
/// (« P1 » / « P3 » / « P4 ») vivent dans `constants.dart`, pas ici : le modèle
/// ne connaît que la valeur technique.
enum Priority {
  low('low'),
  medium('medium'),
  high('high');

  const Priority(this.wire);

  /// Valeur telle qu'elle est stockée et exportée.
  final String wire;

  /// Résout une valeur stockée ; toute valeur inconnue retombe sur [medium],
  /// comme le fait la migration côté React Native.
  static Priority fromWire(Object? value) => Priority.values.firstWhere(
        (p) => p.wire == value,
        orElse: () => Priority.medium,
      );
}

/// Cycle de vie d'une tâche.
enum TaskStatus {
  active('active'),
  completed('completed'),
  archived('archived');

  const TaskStatus(this.wire);

  /// Valeur telle qu'elle est stockée et exportée.
  final String wire;

  /// Résout une valeur stockée ; toute valeur inconnue retombe sur [active].
  static TaskStatus fromWire(Object? value) => TaskStatus.values.firstWhere(
        (s) => s.wire == value,
        orElse: () => TaskStatus.active,
      );
}

/// Règle de répétition d'une tâche.
enum RepeatRule {
  none('none'),
  daily('daily'),
  weekly('weekly'),
  monthly('monthly');

  const RepeatRule(this.wire);

  /// Valeur telle qu'elle est stockée et exportée.
  final String wire;

  /// Résout une valeur stockée ; toute valeur inconnue retombe sur [none].
  static RepeatRule fromWire(Object? value) => RepeatRule.values.firstWhere(
        (r) => r.wire == value,
        orElse: () => RepeatRule.none,
      );
}

/// Sous-tâche rattachée à une [Task].
class Subtask {
  /// Crée une sous-tâche.
  const Subtask({required this.id, required this.title, this.isCompleted = false});

  /// Identifiant local.
  final String id;

  /// Libellé affiché.
  final String title;

  /// État coché / à faire.
  final bool isCompleted;

  /// Copie en remplaçant certains champs.
  Subtask copyWith({String? title, bool? isCompleted}) => Subtask(
        id: id,
        title: title ?? this.title,
        isCompleted: isCompleted ?? this.isCompleted,
      );

  /// Représentation persistée.
  Map<String, Object?> toJson() => <String, Object?>{
        'id': id,
        'title': title,
        'isCompleted': isCompleted,
      };

  /// Reconstruit une sous-tâche depuis le stockage, en tolérant les champs
  /// absents (données écrites par une version antérieure).
  factory Subtask.fromJson(Map<String, Object?> json) => Subtask(
        id: (json['id'] as String?) ?? '',
        title: (json['title'] as String?) ?? '',
        isCompleted: json['isCompleted'] == true,
      );

  @override
  bool operator ==(Object other) =>
      other is Subtask &&
      other.id == id &&
      other.title == title &&
      other.isCompleted == isCompleted;

  @override
  int get hashCode => Object.hash(id, title, isCompleted);

  @override
  String toString() => 'Subtask($id, $title, $isCompleted)';
}

/// Tâche de l'application.
///
/// Deux conventions héritées de la version React Native et conservées ici :
///
/// 1. **Les dates sont stockées en ISO 8601** ([dueDate], [createdAt]…) mais
///    toujours comparées et affichées en heure locale : utiliser
///    [due] / [completedAtDate] plutôt que de re-parser soi-même.
/// 2. **La tâche ne stocke que [subjectId]**, jamais le nom ni la couleur de la
///    catégorie : renommer une catégorie se répercute partout sans migration.
class Task {
  /// Crée une tâche. Les champs omis prennent la valeur neutre du modèle.
  const Task({
    required this.id,
    required this.title,
    required this.dueDate,
    this.description = '',
    this.priority = Priority.medium,
    this.subjectId = 'inbox',
    this.status = TaskStatus.active,
    this.subtasks = const <Subtask>[],
    this.reminders = const <String>[],
    this.reportedAt,
    this.durationMinutes,
    this.note = '',
    this.repeat = RepeatRule.none,
    required this.createdAt,
    this.completedAt,
    this.archivedAt,
  });

  /// Identifiant local (voir `logic/ids.dart`).
  final String id;

  /// Titre saisi par l'utilisateur.
  final String title;

  /// Description longue, distincte de la remarque.
  final String description;

  /// Échéance sérialisée en ISO 8601.
  final String dueDate;

  /// Priorité.
  final Priority priority;

  /// Référence vers une catégorie ; jamais le nom ni la couleur.
  final String subjectId;

  /// Cycle de vie.
  final TaskStatus status;

  /// Sous-tâches, dans l'ordre d'affichage.
  final List<Subtask> subtasks;

  /// Dates ISO auxquelles un rappel local est programmé.
  final List<String> reminders;

  /// Dernière ISO où la tâche a été « reportée » (échéance repoussée).
  final String? reportedAt;

  /// Durée estimée en minutes ; `null` si non renseignée.
  final int? durationMinutes;

  /// Remarque libre, distincte de la description.
  final String note;

  /// Règle de répétition.
  final RepeatRule repeat;

  /// Création, en ISO 8601.
  final String createdAt;

  /// Complétion, en ISO 8601 ; `null` si jamais terminée.
  final String? completedAt;

  /// Archivage, en ISO 8601 ; `null` si non archivée.
  final String? archivedAt;

  /// Échéance en **heure locale**.
  DateTime get due => DateTime.parse(dueDate).toLocal();

  /// Complétion en heure locale, si la tâche a été terminée.
  DateTime? get completedAtDate =>
      completedAt == null ? null : DateTime.parse(completedAt!).toLocal();

  /// Archivage en heure locale, si la tâche est archivée.
  DateTime? get archivedAtDate =>
      archivedAt == null ? null : DateTime.parse(archivedAt!).toLocal();

  /// Copie en remplaçant certains champs.
  ///
  /// Les champs optionnels ne peuvent pas être « remis à `null` » en passant
  /// `null` (cela voudrait dire « ne pas toucher ») : les drapeaux `clear…`
  /// existent pour ça. Décocher une tâche ou la restaurer depuis les archives
  /// passe forcément par eux — c'est exactement ce que fait le fournisseur de
  /// contexte côté React Native (`completedAt: null`).
  Task copyWith({
    String? title,
    String? description,
    DateTime? dueDate,
    Priority? priority,
    String? subjectId,
    TaskStatus? status,
    List<Subtask>? subtasks,
    List<String>? reminders,
    String? reportedAt,
    int? durationMinutes,
    String? note,
    RepeatRule? repeat,
    String? completedAt,
    String? archivedAt,
    bool clearReportedAt = false,
    bool clearDurationMinutes = false,
    bool clearCompletedAt = false,
    bool clearArchivedAt = false,
  }) =>
      Task(
        id: id,
        title: title ?? this.title,
        description: description ?? this.description,
        dueDate: dueDate == null ? this.dueDate : dueDate.toUtc().toIso8601String(),
        priority: priority ?? this.priority,
        subjectId: subjectId ?? this.subjectId,
        status: status ?? this.status,
        subtasks: subtasks ?? this.subtasks,
        reminders: reminders ?? this.reminders,
        reportedAt: clearReportedAt ? null : (reportedAt ?? this.reportedAt),
        durationMinutes:
            clearDurationMinutes ? null : (durationMinutes ?? this.durationMinutes),
        note: note ?? this.note,
        repeat: repeat ?? this.repeat,
        createdAt: createdAt,
        completedAt: clearCompletedAt ? null : (completedAt ?? this.completedAt),
        archivedAt: clearArchivedAt ? null : (archivedAt ?? this.archivedAt),
      );

  /// Représentation persistée (mêmes clés que l'application React Native).
  Map<String, Object?> toJson() => <String, Object?>{
        'id': id,
        'title': title,
        'description': description,
        'dueDate': dueDate,
        'priority': priority.wire,
        'subjectId': subjectId,
        'status': status.wire,
        'subtasks': subtasks.map((s) => s.toJson()).toList(),
        'reminders': reminders,
        'reportedAt': reportedAt,
        'durationMinutes': durationMinutes,
        'note': note,
        'repeat': repeat.wire,
        'createdAt': createdAt,
        'completedAt': completedAt,
        'archivedAt': archivedAt,
      };

  /// Reconstruit une tâche depuis le stockage.
  ///
  /// Contrairement à `logic/migration.dart`, cette méthode suppose un JSON au
  /// format courant ; elle sert à la relecture du stockage écrit par
  /// l'application elle-même.
  factory Task.fromJson(Map<String, Object?> json) {
    final rawSubtasks = json['subtasks'];
    final rawReminders = json['reminders'];
    final rawDuration = json['durationMinutes'];
    return Task(
      id: (json['id'] as String?) ?? '',
      title: (json['title'] as String?) ?? '',
      description: (json['description'] as String?) ?? '',
      dueDate: (json['dueDate'] as String?) ?? DateTime.now().toUtc().toIso8601String(),
      priority: Priority.fromWire(json['priority']),
      subjectId: (json['subjectId'] as String?) ?? 'inbox',
      status: TaskStatus.fromWire(json['status']),
      subtasks: rawSubtasks is List<dynamic>
          ? rawSubtasks
              .whereType<Map<dynamic, dynamic>>()
              .map((raw) => Subtask.fromJson(raw.cast<String, Object?>()))
              .toList(growable: false)
          : const <Subtask>[],
      reminders: rawReminders is List<dynamic>
          ? rawReminders.whereType<String>().toList(growable: false)
          : const <String>[],
      reportedAt: json['reportedAt'] as String?,
      durationMinutes: rawDuration is num ? rawDuration.toInt() : null,
      note: (json['note'] as String?) ?? '',
      repeat: RepeatRule.fromWire(json['repeat']),
      createdAt: (json['createdAt'] as String?) ?? DateTime.now().toUtc().toIso8601String(),
      completedAt: json['completedAt'] as String?,
      archivedAt: json['archivedAt'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is Task &&
      other.id == id &&
      other.title == title &&
      other.description == description &&
      other.dueDate == dueDate &&
      other.priority == priority &&
      other.subjectId == subjectId &&
      other.status == status &&
      _listEquals(other.subtasks, subtasks) &&
      _listEquals(other.reminders, reminders) &&
      other.reportedAt == reportedAt &&
      other.durationMinutes == durationMinutes &&
      other.note == note &&
      other.repeat == repeat &&
      other.createdAt == createdAt &&
      other.completedAt == completedAt &&
      other.archivedAt == archivedAt;

  @override
  int get hashCode => Object.hash(
        id,
        title,
        dueDate,
        priority,
        subjectId,
        status,
        subtasks.length,
        reminders.length,
        reportedAt,
        durationMinutes,
        note,
        repeat,
        createdAt,
        completedAt,
        archivedAt,
      );

  @override
  String toString() => 'Task($id, "$title", $dueDate, ${status.wire})';
}

bool _listEquals<T>(List<T> a, List<T> b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

/// Catégorie de tâches (l'application d'origine parlait de « matières »,
/// puis de « projets » ; le modèle est le même).
class Subject {
  /// Crée une catégorie.
  const Subject({required this.id, required this.name, required this.color});

  /// Identifiant stable, référencé par [Task.subjectId].
  final String id;

  /// Nom affiché, modifiable sans migration de données.
  final String name;

  /// Couleur au format `#rrggbb`.
  final String color;

  /// Représentation persistée.
  Map<String, Object?> toJson() => <String, Object?>{'id': id, 'name': name, 'color': color};

  /// Reconstruit une catégorie depuis le stockage.
  factory Subject.fromJson(Map<String, Object?> json) => Subject(
        id: (json['id'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        color: (json['color'] as String?) ?? '#94a3b8',
      );

  @override
  bool operator ==(Object other) =>
      other is Subject && other.id == id && other.name == name && other.color == color;

  @override
  int get hashCode => Object.hash(id, name, color);

  @override
  String toString() => 'Subject($id, $name)';
}

/// Préférences persistées de l'utilisateur.
class Settings {
  /// Crée des préférences.
  const Settings({
    this.notifications = true,
    this.autoArchive = false,
    this.categories = const <Subject>[],
  });

  /// Rappels locaux activés.
  final bool notifications;

  /// Archivage automatique des tâches terminées.
  final bool autoArchive;

  /// Catégories disponibles.
  final List<Subject> categories;

  /// Copie en remplaçant certains champs.
  Settings copyWith({bool? notifications, bool? autoArchive, List<Subject>? categories}) =>
      Settings(
        notifications: notifications ?? this.notifications,
        autoArchive: autoArchive ?? this.autoArchive,
        categories: categories ?? this.categories,
      );

  /// Représentation persistée.
  Map<String, Object?> toJson() => <String, Object?>{
        'notifications': notifications,
        'autoArchive': autoArchive,
        'categories': categories.map((c) => c.toJson()).toList(),
      };

  /// Reconstruit les préférences depuis le stockage.
  factory Settings.fromJson(Map<String, Object?> json) {
    final raw = json['categories'];
    return Settings(
      notifications: json['notifications'] != false,
      autoArchive: json['autoArchive'] == true,
      categories: raw is List<dynamic>
          ? raw
              .whereType<Map<dynamic, dynamic>>()
              .map((entry) => Subject.fromJson(entry.cast<String, Object?>()))
              .toList(growable: false)
          : const <Subject>[],
    );
  }
}

/// Session locale : aucun serveur, aucune vérification de mot de passe.
class LocalUser {
  /// Crée un utilisateur local.
  const LocalUser({required this.name, required this.email, this.isGuest = false});

  /// Prénom affiché.
  final String name;

  /// Adresse e-mail, non vérifiée.
  final String email;

  /// `true` si la session a été ouverte en mode invité.
  final bool isGuest;

  /// Représentation persistée.
  Map<String, Object?> toJson() =>
      <String, Object?>{'name': name, 'email': email, 'isGuest': isGuest};

  /// Reconstruit un utilisateur depuis le stockage.
  factory LocalUser.fromJson(Map<String, Object?> json) => LocalUser(
        name: (json['name'] as String?) ?? '',
        email: (json['email'] as String?) ?? '',
        isGuest: json['isGuest'] == true,
      );
}

/// Champs requis pour créer une tâche.
class TaskInput {
  /// Données de création d'une tâche.
  const TaskInput({
    required this.title,
    required this.dueDate,
    this.description = '',
    this.priority = Priority.medium,
    this.subjectId = 'inbox',
    this.subtasks = const <Subtask>[],
    this.reminders = const <String>[],
    this.durationMinutes,
    this.note = '',
    this.repeat = RepeatRule.none,
    this.reportedAt,
  });

  /// Titre.
  final String title;

  /// Description.
  final String description;

  /// Échéance.
  final DateTime dueDate;

  /// Priorité.
  final Priority priority;

  /// Catégorie.
  final String subjectId;

  /// Sous-tâches.
  final List<Subtask> subtasks;

  /// Rappels programmés.
  final List<String> reminders;

  /// Durée estimée.
  final int? durationMinutes;

  /// Remarque.
  final String note;

  /// Répétition.
  final RepeatRule repeat;

  /// Marque de report éventuelle.
  final String? reportedAt;
}
