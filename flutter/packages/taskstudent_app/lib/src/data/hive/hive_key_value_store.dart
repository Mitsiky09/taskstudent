import 'package:hive_ce/hive.dart';
import 'package:taskstudent_core/taskstudent.dart';

/// Implémentation Hive du contrat [KeyValueStore] du noyau.
///
/// C'est le seul point de contact entre Hive et la logique métier : le noyau ne
/// connaît pas Hive, il ne connaît que trois méthodes asynchrones. Remplacer
/// Hive par `shared_preferences`, Drift ou un backend ne touche donc que ce
/// fichier.
///
/// Les valeurs sont stockées telles que le noyau les produit, c'est-à-dire en
/// JSON texte : le format reste lisible, exportable, et identique à celui de
/// l'application Expo d'origine. Un enregistrement écrit par l'une des deux
/// applications est relisible par l'autre.
class HiveKeyValueStore implements KeyValueStore {
  /// Branche le store sur une box Hive ouverte.
  const HiveKeyValueStore(this._box);

  final Box<dynamic> _box;

  @override
  Future<String?> read(String key) async {
    final value = _box.get(key);
    // Une valeur d'un autre type (box partagée, donnée corrompue) est traitée
    // comme une absence : le noyau retombe sur sa valeur par défaut.
    return value is String ? value : null;
  }

  @override
  Future<void> write(String key, String value) => _box.put(key, value);

  @override
  Future<void> delete(String key) => _box.delete(key);
}
