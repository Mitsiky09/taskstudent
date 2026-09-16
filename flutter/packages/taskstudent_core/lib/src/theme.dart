/// Tokens du design system, portés de `constants/theme.ts`.
///
/// Le paquet n'importe pas Flutter : les couleurs restent des chaînes
/// `#rrggbb` et les tailles des `double`. La couche applicative les convertit
/// en `ThemeData` (une extension `Color fromHex(String)` suffit), ce qui
/// garantit qu'il n'existe qu'une seule définition de chaque couleur dans tout
/// le projet — le même principe que `tailwind.config.js` important la palette
/// côté React Native.
library;

/// Nuances brutes, alignées sur l'échelle Tailwind de l'application d'origine.
abstract final class Palette {
  /// Indigo 50 → 900.
  static const List<String> primary = <String>[
    '#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', //
    '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
  ];

  /// Slate 50 → 900.
  static const List<String> slate = <String>[
    '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', //
    '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
  ];
}

/// Tokens sémantiques : c'est ce qu'il faut consommer.
abstract final class AppColors {
  /// Couleur de marque : boutons, onglet actif, liens, sélections.
  static const String primary = '#4f46e5';

  /// État appuyé de la couleur de marque.
  static const String primaryPressed = '#4338ca';

  /// Fond teinté très clair, pour les états « sélectionné » discrets.
  static const String primarySoft = '#eef2ff';

  /// Texte posé sur la couleur de marque.
  static const String onPrimary = '#ffffff';

  /// Fond global de l'application.
  static const String background = '#f8fafc';

  /// Cartes, feuilles modales, barres : tout ce qui flotte au-dessus du fond.
  static const String surface = '#ffffff';

  /// Champs de saisie et pastilles posés sur une surface blanche.
  static const String surfaceMuted = '#f1f5f9';

  /// État appuyé d'une surface discrète.
  static const String surfacePressed = '#e2e8f0';

  /// Bordure visible.
  static const String border = '#e2e8f0';

  /// Bordure très discrète des cartes.
  static const String borderSoft = '#f1f5f9';

  /// Titres.
  static const String text = '#0f172a';

  /// Texte courant.
  static const String textSecondary = '#475569';

  /// Mentions, icônes, placeholders.
  static const String textMuted = '#94a3b8';

  /// Icône secondaire.
  static const String iconSoft = '#cbd5e1';

  /// Tâche terminée.
  static const String success = '#10b981';

  /// Fond teinté « terminé ».
  static const String successSoft = '#ecfdf5';

  /// Tâche reportée.
  static const String warning = '#f59e0b';

  /// Fond teinté « reporté ».
  static const String warningSoft = '#fffbeb';

  /// Retard, action destructive.
  static const String danger = '#f43f5e';

  /// Fond teinté « en retard ».
  static const String dangerSoft = '#fff1f2';

  /// Information secondaire, « à faire ».
  static const String info = '#0ea5e9';

  /// Fond teinté d'information.
  static const String infoSoft = '#f0f9ff';
}

/// Rayons, en points logiques.
abstract final class AppRadius {
  /// Champ de saisie, petit bouton.
  static const double control = 14;

  /// Carte de liste (tâche).
  static const double card = 16;

  /// Panneau, statistique.
  static const double panel = 24;

  /// Feuille modale qui remonte du bas.
  static const double sheet = 28;

  /// Pastille.
  static const double pill = 999;
}

/// Pas de mise en page, en points logiques.
abstract final class AppSpacing {
  /// Marge latérale d'un écran.
  static const double screen = 20;

  /// Rembourrage d'une carte.
  static const double card = 20;

  /// Espace entre deux sections.
  static const double section = 28;

  /// Espace entre deux éléments d'une liste.
  static const double item = 10;
}

/// Applique une opacité à une couleur `#rgb` ou `#rrggbb`.
///
/// Sert aux pastilles teintées (catégorie, priorité) qui doivent rester
/// lisibles. Remplace les concaténations « `${color}18` » de la version
/// React Native.
String withAlpha(String color, double alpha) {
  var hex = color.replaceFirst('#', '');
  if (hex.length == 3) {
    hex = hex.split('').map((c) => '$c$c').join();
  }
  if (hex.length != 6) return color;
  final clamped = alpha.clamp(0.0, 1.0);
  final byte = (clamped * 255).round().toRadixString(16).padLeft(2, '0');
  return '#$hex$byte';
}
