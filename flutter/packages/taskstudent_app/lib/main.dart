import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app/app.dart';
import 'src/data/hive/hive_bootstrap.dart';
import 'src/data/hive/hive_key_value_store.dart';
import 'src/presentation/providers.dart';

/// Point d'entrée.
///
/// Le stockage est ouvert **avant** `runApp`, puis injecté via
/// `ProviderScope.overrides` : aucun widget ne construit Hive lui-même, et les
/// tests remplacent ce store par un `MemoryStore` sans rien changer d'autre.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final box = await HiveBootstrap.open();
  final store = HiveKeyValueStore(box);

  runApp(
    ProviderScope(
      overrides: <Override>[keyValueStoreProvider.overrideWithValue(store)],
      child: const TaskStudentApp(),
    ),
  );
}
