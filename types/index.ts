export type Priority = 'low' | 'medium' | 'high';

export type TaskStatus = 'active' | 'completed' | 'archived';

export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** Échéance sérialisée en ISO 8601. */
  dueDate: string;
  priority: Priority;
  /** Référence vers SUBJECTS : on stocke l'identifiant, jamais le nom ni la couleur. */
  subjectId: string;
  status: TaskStatus;
  subtasks: Subtask[];
  /** Dates ISO auxquelles un rappel local est programmé. */
  reminders: string[];
  /** Dernière date ISO où la tâche a été « reportée » (échéance repoussée). */
  reportedAt: string | null;
  /** Durée estimée en minutes ; null si non renseignée. */
  durationMinutes: number | null;
  /** Remarque libre, distincte de la description. */
  note: string;
  /** Règle de répétition : à la complétion, l'échéance avance d'un cycle. */
  repeat: RepeatRule;
  createdAt: string;
  completedAt: string | null;
  archivedAt: string | null;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface LocalUser {
  name: string;
  email: string;
  isGuest: boolean;
}

export interface Settings {
  notifications: boolean;
  autoArchive: boolean;
  /** Catégories personnalisées (remplace l'ancien « projet / matière »). */
  categories: Subject[];
}

export type TaskInput = Pick<Task, 'title' | 'description' | 'dueDate' | 'priority' | 'subjectId'> &
  Partial<Pick<Task, 'subtasks' | 'reminders' | 'durationMinutes' | 'note' | 'repeat' | 'reportedAt'>>;
