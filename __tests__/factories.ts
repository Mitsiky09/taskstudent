import { Task } from '@/types';

let counter = 0;

/** Construit une tâche valide, surchargeable champ par champ. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  counter += 1;
  return {
    id: `task-${counter}`,
    title: `Tâche ${counter}`,
    description: '',
    dueDate: new Date('2026-03-10T10:00:00Z').toISOString(),
    priority: 'medium',
    subjectId: 'math',
    status: 'active',
    subtasks: [],
    reminders: [],
    reportedAt: null,
    durationMinutes: null,
    note: '',
    repeat: 'none',
    createdAt: new Date('2026-03-01T08:00:00Z').toISOString(),
    completedAt: null,
    archivedAt: null,
    ...overrides,
  };
}
