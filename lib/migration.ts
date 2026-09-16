import { FALLBACK_PROJECT, LEGACY_SUBJECT_MAP, PROJECTS } from '@/constants';
import { Priority, RepeatRule, Task, TaskStatus } from '@/types';

/**
 * Migration des données persistées.
 *
 * L'ancien modèle recopiait le *nom* et la *couleur* de la matière dans chaque
 * tâche. Le modèle actuel ne conserve que `subjectId`. Cette fonction convertit
 * les enregistrements existants au chargement pour ne pas perdre les données
 * d'un utilisateur ayant déjà installé l'application.
 */

interface LegacyTask {
  subject?: string;
  subjectColor?: string;
  attachments?: unknown;
  [key: string]: unknown;
}

function normalizeProjectId(id: string): string {
  return LEGACY_SUBJECT_MAP[id] ?? id;
}

const LEGACY_NAME_MAP: Record<string, string> = {
  mathématiques: 'work',
  physique: 'work',
  histoire: 'personal',
  langues: 'personal',
  autre: 'inbox',
};

function projectIdFromName(name: string | undefined): string {
  if (!name) return FALLBACK_PROJECT.id;
  const normalized = name.trim().toLowerCase();
  if (LEGACY_NAME_MAP[normalized]) return LEGACY_NAME_MAP[normalized];
  const match = PROJECTS.find(
    (p) => p.id === name || p.name.toLowerCase() === normalized
  );
  return match ? match.id : FALLBACK_PROJECT.id;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Normalise une entrée inconnue ; renvoie `null` si elle est inexploitable. */
export function migrateTask(raw: unknown): Task | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const input = raw as LegacyTask;

  if (!isNonEmptyString(input.id) || !isNonEmptyString(input.title)) return null;

  const rawProjectId = isNonEmptyString(input.subjectId)
    ? input.subjectId
    : projectIdFromName(input.subject);
  const subjectId = normalizeProjectId(rawProjectId);

  return {
    id: input.id,
    title: input.title,
    description: typeof input.description === 'string' ? input.description : '',
    dueDate: isNonEmptyString(input.dueDate) ? input.dueDate : new Date().toISOString(),
    priority: (['low', 'medium', 'high'] as Priority[]).includes(input.priority as Priority)
      ? (input.priority as Priority)
      : 'medium',
    subjectId,
    status: (['active', 'completed', 'archived'] as TaskStatus[]).includes(
      input.status as TaskStatus
    )
      ? (input.status as TaskStatus)
      : 'active',
    subtasks: Array.isArray(input.subtasks) ? (input.subtasks as Task['subtasks']) : [],
    reminders: Array.isArray(input.reminders) ? (input.reminders as string[]) : [],
    reportedAt: isNonEmptyString(input.reportedAt) ? input.reportedAt : null,
    durationMinutes: typeof input.durationMinutes === 'number' ? input.durationMinutes : null,
    note: typeof input.note === 'string' ? input.note : '',
    repeat: (['none', 'daily', 'weekly', 'monthly'] as RepeatRule[]).includes(
      input.repeat as RepeatRule
    )
      ? (input.repeat as RepeatRule)
      : 'none',
    createdAt: isNonEmptyString(input.createdAt) ? input.createdAt : new Date().toISOString(),
    completedAt: isNonEmptyString(input.completedAt) ? input.completedAt : null,
    archivedAt: isNonEmptyString(input.archivedAt) ? input.archivedAt : null,
  };
}

export function migrateTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(migrateTask).filter((t): t is Task => t !== null);
}
