import { RepeatRule, Settings, Subject } from '@/types';

/** Projets façon Todoist (remplace l'ancien modèle « matières scolaires »). */
export const PROJECTS: Subject[] = [
  { id: 'inbox', name: 'Boîte de réception', color: '#808080' },
  { id: 'work', name: 'Travail', color: '#4073ff' },
  { id: 'personal', name: 'Personnel', color: '#25cad3' },
  { id: 'shopping', name: 'Courses', color: '#ff9933' },
];

/** @deprecated Alias conservé pour compatibilité interne. */
export const SUBJECTS = PROJECTS;

export const FALLBACK_PROJECT: Subject = {
  id: 'inbox',
  name: 'Boîte de réception',
  color: '#808080',
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
export const CATEGORY_COLORS = [
  '#d1453b',
  '#246fe0',
  '#25cad3',
  '#ff9933',
  '#4f46e5',
  '#ec4899',
  '#22c55e',
  '#a855f7',
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

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#808080',
  medium: '#246fe0',
  high: '#d1453b',
};

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

export const COLORS = {
  primary: '#db4c3f',
  background: '#fafafa',
} as const;
