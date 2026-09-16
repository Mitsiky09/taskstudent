import 'dart:convert';

/// Accès au stockage clé/valeur.
///
/// Le paquet n'importe volontairement **aucun** plugin : [KeyValueStore] est
/// une interface, et l'implémentation `shared_preferences` viendra avec la
/// couche applicative Flutter. Cette séparation garde le noyau testable avec
/// `dart test` seul.
///
/// Toutes les lectures sont protégées : un stockage corrompu (JSON invalide,
/// écriture interrompue) renvoie la valeur par défaut au lieu de faire planter
/// l'application au démarrage — même contrat que `lib/storage.ts`.
library;

/// Contrat minimal d'un stockage clé/valeur asynchrone.
abstract interface class KeyValueStore {
  /// Lit la valeur brute associée à [key], ou `null`.
  Future<String?> read(String key);

  /// Écrit la valeur brute.
  Future<void> write(String key, String value);

  /// Supprime la clé.
  Future<void> delete(String key);
}

/// Stockage en mémoire, pour les tests et le développement.
class MemoryStore implements KeyValueStore {
  final Map<String, String> _values = <String, String>{};

  @override
  Future<String?> read(String key) async => _values[key];

  @override
  Future<void> write(String key, String value) async => _values[key] = value;

  @override
  Future<void> delete(String key) async => _values.remove(key);
}

/// Lit et décode un JSON ; toute erreur renvoie `null` plutôt que de propager.
Future<Object?> readJson(KeyValueStore store, String key) async {
  try {
    final raw = await store.read(key);
    if (raw == null) return null;
    return jsonDecode(raw) as Object?;
  } catch (error) {
    // Lecture impossible (JSON corrompu, écriture interrompue) : on repart de
    // la valeur par défaut de l'appelant.
    return null;
  }
}

/// Lit une liste JSON, ou une liste vide.
Future<List<Object?>> readJsonList(KeyValueStore store, String key) async {
  final decoded = await readJson(store, key);
  return decoded is List ? decoded : <Object?>[];
}

/// Lit un objet JSON, ou `null`.
Future<Map<String, Object?>?> readJsonMap(KeyValueStore store, String key) async {
  final decoded = await readJson(store, key);
  return decoded is Map<dynamic, dynamic> ? decoded.cast<String, Object?>() : null;
}

/// Sérialise et écrit ; une erreur d'écriture est absorbée.
Future<void> writeJson(KeyValueStore store, String key, Object? value) async {
  try {
    await store.write(key, jsonEncode(value));
  } catch (error) {
    // Écriture impossible : l'application continue, la donnée sera réécrite au
    // prochain changement d'état.
  }
}
