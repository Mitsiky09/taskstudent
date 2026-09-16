import 'dart:io';

import 'package:hive_ce/hive.dart';
import 'package:path_provider/path_provider.dart';

/// Ouverture de la base Hive.
///
/// Une seule box suffit : le noyau y range quelques clés JSON
/// (`@taskstudent/tasks`, `@taskstudent/settings`…). Les clés viennent de
/// [StorageKeys], jamais de littéraux dispersés dans l'application.
///
/// `hive_ce` est la Community Edition de Hive : le paquet `hive` d'origine
/// n'est plus maintenu, l'API est identique.
abstract final class HiveBootstrap {
  /// Nom de la box de l'application.
  static const String boxName = 'taskstudent';

  static bool _initialised = false;

  /// Initialise Hive puis ouvre la box.
  ///
  /// [path] sert aux tests : sans lui, le dossier des documents de
  /// l'application est utilisé. Sur le web, `path_provider` n'a pas de
  /// dossier — il faudrait `hive_ce_flutter` et son `initFlutter()`.
  static Future<Box<dynamic>> open({String? path}) async {
    if (!_initialised) {
      final home = path ?? (await getApplicationDocumentsDirectory()).path;
      Hive.init(home);
      _initialised = true;
    }
    return Hive.openBox<dynamic>(boxName);
  }

  /// Ouvre une box dans un dossier temporaire : réservé aux tests.
  static Future<Box<dynamic>> openTemporary() async {
    final directory = await Directory.systemTemp.createTemp('taskstudent_hive');
    return open(path: directory.path);
  }
}
