/// TaskStudent — noyau métier.
///
/// Port Dart de la logique de l'application Expo/React Native
/// (`Mitsiky09/taskstudent`). Ce paquet ne contient **aucun widget** : il
/// regroupe les modèles, la logique pure, la migration et l'export, afin de
/// pouvoir être testé avec `dart test` sans SDK Flutter.
///
/// ```dart
/// import 'package:taskstudent_core/taskstudent.dart';
///
/// final late = tasks.where((t) => isOverdue(t)).toList();
/// ```
library;

export 'src/constants.dart';
export 'src/logic/dates.dart';
export 'src/logic/ids.dart';
export 'src/logic/migration.dart';
export 'src/logic/quick_add.dart';
export 'src/logic/serialize.dart';
export 'src/logic/task_logic.dart';
export 'src/logic/task_repository.dart';
export 'src/models/task.dart';
export 'src/storage.dart';
export 'src/theme.dart';
