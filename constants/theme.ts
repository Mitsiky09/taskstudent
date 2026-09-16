import type { ViewStyle } from 'react-native';

/**
 * Design system unique de TaskStudent.
 *
 * Toutes les couleurs, rayons, ombres et styles de texte de l'application
 * viennent d'ici. Un écran ne doit plus contenir de couleur en dur : il
 * utilise soit une classe utilitaire issue de `tailwind.config.js`
 * (`bg-primary`, `text-muted`…), soit une valeur de ce fichier pour les API
 * qui n'acceptent pas de classes (`react-native-calendars`, `react-native-svg`,
 * les icônes, `placeholderTextColor`…).
 */

/** Nuances brutes, alignées sur l'échelle Tailwind. */
export const palette = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: { 50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669' },
  warning: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706' },
  danger: { 50: '#fff1f2', 100: '#ffe4e6', 500: '#f43f5e', 600: '#e11d48' },
  info: { 50: '#f0f9ff', 500: '#0ea5e9', 600: '#0284c7' },
  white: '#ffffff',
} as const;

/**
 * Tokens sémantiques : c'est ce qu'il faut consommer. Une couleur de nuance
 * (`palette.slate[400]`) ne s'utilise que pour déclarer un token.
 */
export const theme = {
  colors: {
    /** Couleur de marque : boutons, onglet actif, liens, sélections. */
    primary: palette.primary[600],
    primaryPressed: palette.primary[700],
    /** Fond teinté très clair, pour les états « sélectionné » discrets. */
    primarySoft: palette.primary[50],
    onPrimary: palette.white,

    /** Fond global de l'application (identique à `app.json > backgroundColor`). */
    background: palette.slate[50],
    /** Cartes, feuilles modales, barres : tout ce qui « flotte » au-dessus du fond. */
    surface: palette.white,
    /** Champs de saisie et pastilles posés sur une surface blanche. */
    surfaceMuted: palette.slate[100],
    surfacePressed: palette.slate[200],

    border: palette.slate[200],
    /** Bordure très discrète des cartes. */
    borderSoft: palette.slate[100],

    text: palette.slate[900],
    textSecondary: palette.slate[600],
    textMuted: palette.slate[400],
    placeholder: palette.slate[400],
    icon: palette.slate[400],
    iconSoft: palette.slate[300],

    success: palette.success[500],
    successSoft: palette.success[50],
    warning: palette.warning[500],
    warningSoft: palette.warning[50],
    danger: palette.danger[500],
    dangerSoft: palette.danger[50],
    info: palette.info[500],
    infoSoft: palette.info[50],

    /** Voile des modales. */
    overlay: 'rgba(15, 23, 42, 0.45)',
    overlayLight: 'rgba(15, 23, 42, 0.3)',
  },
  radius: {
    /** Champ de saisie, petit bouton. */
    control: 14,
    /** Carte de liste (tâche). */
    card: 16,
    /** Panneau, statistique. */
    panel: 24,
    /** Feuille modale qui remonte du bas. */
    sheet: 28,
    pill: 999,
  },
  /** Pas horizontaux de mise en page, en points. */
  space: {
    /** Marge latérale d'un écran. */
    screen: 20,
    /** Rembourrage d'une carte. */
    card: 20,
    /** Espace entre deux sections. */
    section: 28,
    /** Espace entre deux éléments d'une liste. */
    item: 10,
  },
} as const;

/** Ombres : objets de style, identiques sur iOS et Android. */
export const shadows: Record<'card' | 'raised' | 'floating', ViewStyle> = {
  /** Cartes de contenu. */
  card: {
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  /** Éléments détachés (barre d'onglets, boutons principaux). */
  raised: {
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  /** Bouton d'action flottant. */
  floating: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
};

/**
 * Classes utilitaires partagées : la typographie et les surfaces sont les deux
 * endroits où l'incohérence s'installe le plus vite. Les écrans composent avec
 * ces constantes au lieu de réécrire `text-lg font-bold text-slate-900`.
 */
export const typography = {
  /** Grand titre d'écran (« Aujourd'hui », « Profil »). */
  display: 'text-[28px] font-bold tracking-tight text-ink',
  /** Titre de bloc secondaire. */
  title: 'text-xl font-bold tracking-tight text-ink',
  /** En-tête de section au-dessus d'une liste. */
  section: 'text-lg font-bold tracking-tight text-ink',
  /** Sous-titre / description d'écran. */
  subtitle: 'text-sm text-muted',
  /** Étiquette majuscule au-dessus d'un groupe. */
  eyebrow: 'text-xs font-semibold uppercase tracking-wider text-faint',
  /** Titre d'une carte. */
  cardTitle: 'text-base font-semibold text-ink',
  /** Texte courant. */
  body: 'text-sm text-soft',
  /** Mention discrète (horodatage, aide). */
  caption: 'text-xs text-faint',
  /** Libellé de champ. */
  label: 'text-[13px] font-medium text-soft',
} as const;

/** Surfaces récurrentes, prêtes à l'emploi. */
export const surfaceStyles = {
  screen: 'flex-1 bg-canvas',
  /** Grande carte (aperçu du jour, statistiques, paramètres). */
  card: 'rounded-3xl border border-line-soft bg-white',
  /** Carte de liste (tâche, archive). */
  listItem: 'rounded-2xl border border-line-soft bg-white',
  /** Feuille modale qui remonte du bas. */
  sheet: 'rounded-t-3xl bg-white',
  /** Poignée de la feuille modale. */
  handle: 'h-1 w-10 self-center rounded-full bg-line',
  /** Champ posé sur une surface blanche. */
  field: 'h-12 rounded-2xl bg-surface-muted px-4 text-[15px] text-ink',
  /** Champ posé directement sur le fond de l'application. */
  fieldOnCanvas: 'h-12 rounded-2xl border border-line bg-white px-4 text-[15px] text-ink',
  /** Pastille non sélectionnable. */
  chip: 'h-10 flex-row items-center justify-center rounded-full border border-line bg-white px-4',
  /** Bouton d'action secondaire. */
  buttonSoft: 'h-12 items-center justify-center rounded-2xl bg-primary',
} as const;

/**
 * Applique une opacité à une couleur hexadécimale, pour les pastilles
 * teintées (« catégorie », « priorité ») qui doivent rester lisibles.
 * Remplace les concaténations `#${color}18` dispersées dans les écrans.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (full.length !== 6) return color;
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${full}${byte}`;
}

export default theme;
