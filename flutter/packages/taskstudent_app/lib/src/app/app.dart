import 'package:flutter/material.dart';

import '../presentation/screens/home_screen.dart';
import 'theme.dart';

/// Racine de l'application.
///
/// Une seule route pour l'instant (l'accueil) : la navigation par onglets et
/// les écrans restants arrivent au fur et à mesure du portage de l'application
/// Expo. Le thème, lui, est déjà complet.
class TaskStudentApp extends StatelessWidget {
  /// Application TaskStudent.
  const TaskStudentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TaskStudent',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const HomeScreen(),
    );
  }
}
