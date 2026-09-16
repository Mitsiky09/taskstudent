import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../../app/theme.dart';
import '../../viewmodels/session_viewmodel.dart';

/// Création de compte locale.
///
/// Port de `app/auth/register.tsx` : aucun compte n'est créé ailleurs que sur
/// l'appareil, le mot de passe n'est pas stocké.
class RegisterScreen extends ConsumerStatefulWidget {
  /// Écran de création de compte.
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _name = TextEditingController();
  final TextEditingController _email = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    await ref.read(sessionProvider.notifier).signIn(
          LocalUser(name: _name.text.trim(), email: _email.text.trim()),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Créer un compte')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.screen,
            8,
            AppSpacing.screen,
            40,
          ),
          children: <Widget>[
            TextFormField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Prénom'),
              validator: (value) =>
                  (value == null || value.trim().isEmpty) ? 'Indique ton prénom' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Adresse e-mail'),
              validator: (value) =>
                  (value == null || !value.contains('@')) ? 'Adresse invalide' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Mot de passe',
                helperText: 'Non stocké : la session est locale.',
              ),
            ),
            const SizedBox(height: 28),
            FilledButton(onPressed: _submit, child: const Text('Commencer')),
          ],
        ),
      ),
    );
  }
}
