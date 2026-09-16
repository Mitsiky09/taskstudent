import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../providers.dart';

/// État des préférences.
class SettingsState {
  /// Préférences et indicateur de chargement.
  const SettingsState({this.isLoading = true, this.settings = kDefaultSettings});

  /// `true` tant que le stockage n'a pas été lu.
  final bool isLoading;

  /// Préférences persistées.
  final Settings settings;

  /// Copie en remplaçant certains champs.
  SettingsState copyWith({bool? isLoading, Settings? settings}) => SettingsState(
        isLoading: isLoading ?? this.isLoading,
        settings: settings ?? this.settings,
      );

  @override
  bool operator ==(Object other) =>
      other is SettingsState &&
      other.isLoading == isLoading &&
      other.settings == settings;

  @override
  int get hashCode => Object.hash(isLoading, settings);
}

/// ViewModel des préférences : notifications, archivage automatique, catégories.
class SettingsNotifier extends Notifier<SettingsState> {
  @override
  SettingsState build() {
    unawaited(_load());
    return const SettingsState();
  }

  Future<void> _load() async {
    // Le store est lu avant tout `await` : après, le `Ref` peut être disposé.
    final store = ref.read(keyValueStoreProvider);
    final raw = await readJsonMap(store, StorageKeys.settings);
    if (!ref.mounted) return;
    state = SettingsState(
      isLoading: false,
      settings: raw == null ? kDefaultSettings : Settings.fromJson(raw),
    );
  }

  Future<void> _save(Settings settings) async {
    final store = ref.read(keyValueStoreProvider);
    state = SettingsState(isLoading: false, settings: settings);
    await writeJson(store, StorageKeys.settings, settings.toJson());
  }

  /// Active ou coupe les rappels locaux.
  Future<void> setNotifications(bool value) =>
      _save(state.settings.copyWith(notifications: value));

  /// Active ou coupe l'archivage automatique des tâches terminées.
  Future<void> setAutoArchive(bool value) =>
      _save(state.settings.copyWith(autoArchive: value));

  /// Ajoute une catégorie et renvoie son identifiant.
  Future<String> addCategory(String name, String color) async {
    final id = createId('c');
    final categories = <Subject>[
      ...state.settings.categories,
      Subject(id: id, name: name.trim(), color: color),
    ];
    await _save(state.settings.copyWith(categories: categories));
    return id;
  }

  /// Renomme une catégorie.
  ///
  /// Aucune migration n'est nécessaire : les tâches ne stockent que
  /// l'identifiant, jamais le nom.
  Future<void> renameCategory(String id, String name) async {
    final categories = state.settings.categories
        .map((category) => category.id == id
            ? Subject(id: category.id, name: name.trim(), color: category.color)
            : category)
        .toList(growable: false);
    await _save(state.settings.copyWith(categories: categories));
  }

  /// Change la couleur d'une catégorie.
  Future<void> recolorCategory(String id, String color) async {
    final categories = state.settings.categories
        .map((category) => category.id == id
            ? Subject(id: category.id, name: category.name, color: color)
            : category)
        .toList(growable: false);
    await _save(state.settings.copyWith(categories: categories));
  }

  /// Supprime une catégorie.
  ///
  /// Les tâches qui la référençaient ne sont pas supprimées : le noyau les
  /// fait retomber sur la boîte de réception à l'affichage.
  Future<void> deleteCategory(String id) async {
    final categories =
        state.settings.categories.where((category) => category.id != id).toList(growable: false);
    await _save(state.settings.copyWith(categories: categories));
  }

  /// Restaure les catégories par défaut.
  Future<void> resetCategories() => _save(state.settings.copyWith(categories: kProjects));
}

/// ViewModel des préférences, exposé aux écrans.
final NotifierProvider<SettingsNotifier, SettingsState> settingsProvider =
    NotifierProvider<SettingsNotifier, SettingsState>(SettingsNotifier.new);
