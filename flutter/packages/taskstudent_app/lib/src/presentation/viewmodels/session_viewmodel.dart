import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../providers.dart';

/// Session locale : aucun serveur, aucune vérification de mot de passe.
///
/// Port fidèle de `context/SessionContext.tsx`. L'« inscription » ne fait
/// qu'enregistrer un nom et un e-mail sur l'appareil : c'est assumé et affiché
/// comme tel à l'utilisateur, qui peut aussi continuer en invité.
class SessionState {
  /// État de session et d'introduction.
  const SessionState({
    this.isLoading = true,
    this.user,
    this.onboardingSeen = false,
  });

  /// `true` tant que le stockage n'a pas été lu.
  final bool isLoading;

  /// Utilisateur connecté, `null` sinon.
  final LocalUser? user;

  /// L'introduction a-t-elle déjà été vue ?
  final bool onboardingSeen;

  /// Copie en remplaçant certains champs.
  SessionState copyWith({
    bool? isLoading,
    LocalUser? user,
    bool clearUser = false,
    bool? onboardingSeen,
  }) =>
      SessionState(
        isLoading: isLoading ?? this.isLoading,
        user: clearUser ? null : (user ?? this.user),
        onboardingSeen: onboardingSeen ?? this.onboardingSeen,
      );

  @override
  bool operator ==(Object other) =>
      other is SessionState &&
      other.isLoading == isLoading &&
      other.user == user &&
      other.onboardingSeen == onboardingSeen;

  @override
  int get hashCode => Object.hash(isLoading, user, onboardingSeen);
}

/// ViewModel de session : introduction, connexion, déconnexion.
class SessionNotifier extends Notifier<SessionState> {
  @override
  SessionState build() {
    unawaited(_load());
    return const SessionState();
  }

  Future<void> _load() async {
    final store = ref.read(keyValueStoreProvider);
    final rawUser = await readJsonMap(store, StorageKeys.user);
    final rawOnboarding = await readJson(store, StorageKeys.onboarding);
    if (!ref.mounted) return;
    state = SessionState(
      isLoading: false,
      user: rawUser == null ? null : LocalUser.fromJson(rawUser),
      onboardingSeen: rawOnboarding == true,
    );
  }

  /// Ouvre une session et la mémorise.
  Future<void> signIn(LocalUser user) => _persistUser(user);

  /// Ouvre une session invitée.
  Future<void> signInAsGuest() => _persistUser(
        const LocalUser(name: 'Invité', email: '', isGuest: true),
      );

  /// Ferme la session. Les tâches ne sont pas supprimées.
  Future<void> signOut() async {
    final store = ref.read(keyValueStoreProvider);
    state = state.copyWith(clearUser: true);
    await store.delete(StorageKeys.user);
  }

  /// Met à jour le profil (nom, e-mail).
  Future<void> updateUser({String? name, String? email}) async {
    final current = state.user;
    if (current == null) return;
    await _persistUser(
      LocalUser(
        name: name ?? current.name,
        email: email ?? current.email,
        isGuest: current.isGuest,
      ),
    );
  }

  /// Marque l'introduction comme vue.
  Future<void> completeOnboarding() async {
    final store = ref.read(keyValueStoreProvider);
    state = state.copyWith(onboardingSeen: true);
    await writeJson(store, StorageKeys.onboarding, true);
  }

  /// Permet de revoir l'introduction depuis le profil.
  Future<void> resetOnboarding() async {
    final store = ref.read(keyValueStoreProvider);
    state = state.copyWith(onboardingSeen: false);
    await store.delete(StorageKeys.onboarding);
  }

  Future<void> _persistUser(LocalUser user) async {
    final store = ref.read(keyValueStoreProvider);
    state = state.copyWith(user: user);
    await writeJson(store, StorageKeys.user, user.toJson());
  }
}

/// ViewModel de session, exposé à la garde de navigation et au profil.
final NotifierProvider<SessionNotifier, SessionState> sessionProvider =
    NotifierProvider<SessionNotifier, SessionState>(SessionNotifier.new);
