import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:taskstudent_app/src/presentation/providers.dart';
import 'package:taskstudent_app/src/presentation/viewmodels/session_viewmodel.dart';
import 'package:taskstudent_core/taskstudent.dart';

/// Tests du ViewModel de session (port de `context/SessionContext.tsx`).
///
/// Même principe que pour les tâches : le stockage est un `MemoryStore`, donc
/// ces tests vérifient la persistance réelle sans toucher au disque.
void main() {
  ProviderContainer makeContainer(MemoryStore store) => ProviderContainer(
        overrides: <Override>[keyValueStoreProvider.overrideWithValue(store)],
      );

  /// Laisse le chargement asynchrone du `build()` se terminer.
  Future<void> settle() => Future<void>.delayed(Duration.zero);

  test('démarre déconnecté, introduction non vue', () async {
    final container = makeContainer(MemoryStore());
    addTearDown(container.dispose);

    await settle();

    final state = container.read(sessionProvider);
    expect(state.isLoading, isFalse);
    expect(state.user, isNull);
    expect(state.onboardingSeen, isFalse);
  });

  test("l'introduction vue est mémorisée d'un conteneur à l'autre", () async {
    final store = MemoryStore();
    final container = makeContainer(store);
    addTearDown(container.dispose);
    await settle();

    await container.read(sessionProvider.notifier).completeOnboarding();
    expect(container.read(sessionProvider).onboardingSeen, isTrue);

    final reopened = makeContainer(store);
    addTearDown(reopened.dispose);
    await settle();
    expect(reopened.read(sessionProvider).onboardingSeen, isTrue);
  });

  test('connexion, mise à jour du profil puis déconnexion', () async {
    final store = MemoryStore();
    final container = makeContainer(store);
    addTearDown(container.dispose);
    await settle();

    await container
        .read(sessionProvider.notifier)
        .signIn(const LocalUser(name: 'Micka', email: 'micka@example.com'));
    expect(container.read(sessionProvider).user?.name, 'Micka');

    await container.read(sessionProvider.notifier).updateUser(name: 'Micka R.');
    expect(container.read(sessionProvider).user?.name, 'Micka R.');
    expect(container.read(sessionProvider).user?.email, 'micka@example.com');

    await container.read(sessionProvider.notifier).signOut();
    expect(container.read(sessionProvider).user, isNull);

    // La déconnexion est bien écrite dans le stockage.
    final reopened = makeContainer(store);
    addTearDown(reopened.dispose);
    await settle();
    expect(reopened.read(sessionProvider).user, isNull);
  });

  test('la session invitée est marquée comme telle', () async {
    final container = makeContainer(MemoryStore());
    addTearDown(container.dispose);
    await settle();

    await container.read(sessionProvider.notifier).signInAsGuest();

    final user = container.read(sessionProvider).user;
    expect(user?.isGuest, isTrue);
    expect(user?.name, 'Invité');
  });

  test('revoir l’introduction replace la garde de navigation', () async {
    final container = makeContainer(MemoryStore());
    addTearDown(container.dispose);
    await settle();

    await container.read(sessionProvider.notifier).completeOnboarding();
    await container.read(sessionProvider.notifier).resetOnboarding();

    expect(container.read(sessionProvider).onboardingSeen, isFalse);
  });
}
