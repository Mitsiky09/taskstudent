import 'package:flutter/material.dart';

import '../presentation/screens/auth_gate.dart';
import 'theme.dart';

/// Racine de l'application.
///
/// La racine délègue à [AuthGate], qui choisit entre l'introduction, la
/// connexion et la coque à onglets selon l'état lu dans le stockage.
class TaskStudentApp extends StatelessWidget {
  /// Application TaskStudent.
  const TaskStudentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TaskStudent',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const AuthGate(),
    );
  }
}
