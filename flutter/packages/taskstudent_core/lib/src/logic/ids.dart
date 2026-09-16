import 'dart:math';

/// Identifiants locaux, portés de `lib/id.ts`.
///
/// Le paquet `uuid` a été écarté côté React Native (il exige un polyfill
/// `crypto.getRandomValues`) ; le besoin se limite à distinguer des
/// enregistrements stockés sur un seul appareil. L'horodatage garantit
/// l'unicité entre deux créations, le suffixe aléatoire à l'intérieur d'une
/// même milliseconde.
library;

const String _alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

final Random _random = Random();

/// Génère un identifiant préfixé, ex. `t_mdq3k2_a91f0c`.
String createId([String prefix = 't']) {
  final timestamp = DateTime.now().millisecondsSinceEpoch.toRadixString(36);
  final suffix = List<String>.generate(6, (_) => _alphabet[_random.nextInt(_alphabet.length)])
      .join();
  return '${prefix}_$timestamp_$suffix';
}
