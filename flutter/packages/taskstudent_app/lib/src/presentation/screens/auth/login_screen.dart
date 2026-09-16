import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../../app/theme.dart';
import '../../viewmodels/session_viewmodel.dart';
import 'register_screen.dart';

/// Connexion.
///
/// Port de `app/auth/login.tsx`. Comme dans l'application d'origine, il n'y a
/// **aucun serveur** : l'adresse et le mot de passe ne quittent pas l'appareil
/// et le mot de passe n'est pas vérifié. L'écran le dit explicitement, pour ne
/// pas laisser croire à une authentification réelle.
class LoginScreen extends ConsumerStatefulWidget {
  /// Écran de connexion.
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (email.isEmpty) return;
    await ref.read(sessionProvider.notifier).signIn(
          LocalUser(name: email.split('@').first, email: email),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
          children: <Widget>[
            const SizedBox(height: 48),
            Text(
              'Content de te revoir',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.text,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tes tâches t’attendent, exactement où tu les as laissées.',
              style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Adresse e-mail'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Mot de passe'),
              onSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: _submit, child: const Text('Se connecter')),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => ref.read(sessionProvider.notifier).signInAsGuest(),
              child: const Text('Continuer en invité'),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Text(
                  'Pas encore de compte ?',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
                TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const RegisterScreen()),
                  ),
                  child: const Text('Créer un compte'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Aucun serveur : les données restent sur cet appareil.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
