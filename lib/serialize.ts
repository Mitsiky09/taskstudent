import { getSubject } from '@/constants';
import { Task } from '@/types';

/**
 * Sérialisation des tâches, isolée de React Native pour rester testable
 * unitairement (`__tests__/serialize.test.ts`).
 */

/** Échappe un champ selon la RFC 4180 : guillemets doublés, champ encadré. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export const CSV_HEADER = [
  'Titre',
  'Projet',
  'Échéance',
  'Priorité',
  'Statut',
  'Terminée le',
  'Durée (min)',
  'Répétition',
  'Remarque',
];

export function toCSV(tasks: Task[]): string {
  const rows = tasks.map((task) =>
    [
      task.title,
      getSubject(task.subjectId).name,
      new Date(task.dueDate).toISOString(),
      task.priority,
      task.status,
      task.completedAt ?? '',
      task.durationMinutes != null ? String(task.durationMinutes) : '',
      task.repeat,
      task.note,
    ]
      .map(csvCell)
      .join(',')
  );
  return [CSV_HEADER.map(csvCell).join(','), ...rows].join('\n');
}

export function toJSON(tasks: Task[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), tasks }, null, 2);
}
