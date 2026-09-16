import 'package:flutter/material.dart';
import 'package:taskstudent_core/taskstudent.dart' as core;

/// Thème Material construit à partir des tokens du noyau.
///
/// Aucune couleur n'est écrite en dur ici : tout vient de
/// `taskstudent_core/lib/src/theme.dart`, la même source que celle utilisée par
/// l'application Expo. Le noyau ne pouvant pas importer `dart:ui`, il expose des
/// chaînes `#rrggbb` que ce fichier convertit.

/// Convertit `#rgb` ou `#rrggbb` en [Color] opaque.
Color colorFromHex(String hex) {
  var value = hex.replaceFirst('#', '');
  if (value.length == 3) {
    value = value.split('').map((channel) => '$channel$channel').join();
  }
  if (value.length == 6) {
    value = 'ff$value';
  }
  return Color(int.parse(value, radix: 16));
}

/// Palette de l'application, convertie une seule fois.
abstract final class AppTheme {
  /// Couleur de marque.
  static final Color primary = colorFromHex(core.AppColors.primary);

  /// Fond global.
  static final Color background = colorFromHex(core.AppColors.background);

  /// Surface des cartes.
  static final Color surface = colorFromHex(core.AppColors.surface);

  /// Champs et pastilles posés sur une surface.
  static final Color surfaceMuted = colorFromHex(core.AppColors.surfaceMuted);

  /// Bordure.
  static final Color border = colorFromHex(core.AppColors.border);

  /// Titres.
  static final Color text = colorFromHex(core.AppColors.text);

  /// Texte courant.
  static final Color textSecondary = colorFromHex(core.AppColors.textSecondary);

  /// Mentions et icônes.
  static final Color textMuted = colorFromHex(core.AppColors.textMuted);

  /// Tâche terminée.
  static final Color success = colorFromHex(core.AppColors.success);

  /// Tâche reportée.
  static final Color warning = colorFromHex(core.AppColors.warning);

  /// Retard et actions destructives.
  static final Color danger = colorFromHex(core.AppColors.danger);

  /// Couleur d'une catégorie, à partir de sa valeur stockée.
  static Color category(String hex) => colorFromHex(hex);

  /// Thème clair de l'application.
  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.light,
      surface: surface,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: background,
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        surfaceTintColor: Colors.transparent,
        foregroundColor: text,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: const TextStyle(
          color: text,
          fontSize: 28,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(core.AppRadius.card),
          side: BorderSide(color: border),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(core.AppRadius.control),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(core.AppRadius.control),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(core.AppRadius.control),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(core.AppRadius.control),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceMuted,
        selectedColor: colorFromHex(core.AppColors.primarySoft),
        side: BorderSide.none,
        labelStyle: const TextStyle(color: textSecondary, fontWeight: FontWeight.w500),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(core.AppRadius.pill),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(core.AppRadius.control),
        ),
      ),
      dividerTheme: DividerThemeData(color: border, space: 1, thickness: 1),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: colorFromHex(core.AppColors.text),
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(core.AppRadius.control),
        ),
      ),
    );
  }
}
