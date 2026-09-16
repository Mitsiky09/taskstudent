import { RepeatRule, Settings, Subject } from '@/types';
import { theme } from './theme';

/**
 * Projets façon Todoist (remplace l'ancien modèle « matières scolaires »).
 * Les couleurs viennent de la palette du design system : une catégorie par
 * défaut ne doit pas introduire une teinte hors système.
 */
export const PROJECTS: Subject[] = [
  { id: 'inbox', name: 'Boîte de réception', color: theme.colors.textMuted },
  { id: 'work', name: 'Travail', color: theme.colors.primary },
  { id: 'personal', name: 'Personnel', color: theme.colors.info },
  { id: 'shopping', name: 'Courses', color: theme.colors.warning },
];

/** @deprecated Alias conservé pour compatibilité interne. */
export const SUBJECTS = PROJECTS;

export const FALLBACK_PROJECT: Subject = {
  id: 'inbox',
  name: 'Boîte de réception',
  color: theme.colors.textMuted,
};

/** @deprecated */
export const FALLBACK_SUBJECT = FALLBACK_PROJECT;

/** Correspondance des anciens identifiants « matière » vers les projets. */
export const LEGACY_SUBJECT_MAP: Record<string, string> = {
  math: 'work',
  physics: 'work',
  history: 'personal',
  languages: 'personal',
  other: 'inbox',
};

/**
 * Résout un projet à partir de son identifiant.
 * Les tâches ne stockent que `subjectId` : renommer un projet ou changer
 * sa couleur se répercute partout sans migration de données.
 */
export function getProject(projectId: string): Subject {
  return PROJECTS.find((p) => p.id === projectId) ?? FALLBACK_PROJECT;
}

/** Palette proposée pour les nouvelles catégories. */
export const CATEGORY_COLORS: string[] = [
  theme.colors.primary,
  theme.colors.info,
  theme.colors.success,
  theme.colors.warning,
  theme.colors.danger,
  '#a855f7',
  '#14b8a6',
  theme.colors.textSecondary,
];

/** Résout une catégorie (définie dans les réglages) par son identifiant. */
export function getCategory(categories: Subject[], categoryId: string): Subject {
  return categories.find((c) => c.id === categoryId) ?? FALLBACK_PROJECT;
}

/** @deprecated Utiliser getProject. */
export function getSubject(subjectId: string): Subject {
  return getProject(subjectId);
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'P4',
  medium: 'P3',
  high: 'P1',
};

/** Priorités alignées sur les couleurs sémantiques du design system. */
export const PRIORITY_COLORS: Record<string, string> = {
  low: theme.colors.textMuted,
  medium: theme.colors.primary,
  high: theme.colors.danger,
};

/**
 * États d'une tâche, utilisés par les graphiques et les pastilles :
 * à faire (marque), reportée (avertissement), terminée (succès), en retard.
 */
export const STATUS_COLORS = {
  todo: theme.colors.primary,
  reported: theme.colors.warning,
  done: theme.colors.success,
  overdue: theme.colors.danger,
} as const;

/** Durées rapides proposées lors de la création/édition (en minutes). */
export const DURATION_OPTIONS: number[] = [15, 30, 45, 60, 90, 120];

/** Règles de répétition proposées dans les formulaires. */
export const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: 'none', label: 'Jamais' },
  { value: 'daily', label: 'Chaque jour' },
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'monthly', label: 'Chaque mois' },
];

export const STORAGE_KEYS = {
  tasks: '@taskstudent/tasks',
  user: '@taskstudent/user',
  onboarding: '@taskstudent/onboarding',
  settings: '@taskstudent/settings',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  autoArchive: false,
  categories: PROJECTS,
};

/** Délai avant archivage automatique d'une tâche terminée, en jours. */
export const AUTO_ARCHIVE_DAYS = 7;
