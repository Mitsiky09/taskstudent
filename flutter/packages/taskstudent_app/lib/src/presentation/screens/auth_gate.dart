import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../viewmodels/session_viewmodel.dart';
import 'auth/login_screen.dart';
import 'main_shell.dart';
import 'onboarding_screen.dart';

/// Garde de navigation.
///
/// Port de `app/index.tsx` : c'est le seul endroit qui décide de la destination
/// de démarrage, selon l'état réel (introduction vue ? session ouverte ?). Sans
/// ce point unique, un utilisateur déconnecté retomberait sur les onglets au
/// redémarrage.
class AuthGate extends ConsumerWidget {
  /// Garde de navigation.
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);

    if (session.isLoading) {
      return const _Splash();
    }
    if (!session.onboardingSeen) {
      return const OnboardingScreen();
    }
    if (session.user == null) {
      return const LoginScreen();
    }
    return const MainShell();
  }
}

/// Écran d'amorçage, affiché le temps de lire le stockage.
class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
