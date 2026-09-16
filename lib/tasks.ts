import { AUTO_ARCHIVE_DAYS } from '@/constants';
import {
  addDays,
  daysBetween,
  eachDay,
  endOfDay,
  formatDay,
  formatShortDate,
  formatShortDay,
  fromDateKey,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfWeek,
  toDateKey,
} from '@/lib/date';
import { Priority, RepeatRule, Task } from '@/types';

/**
 * Logique métier pure : aucune dépendance à React ni à React Native, ce qui
 * la rend testable directement avec Jest (voir `__tests__/tasks.test.ts`).
 */

export type TaskFilter = 'all' | 'active' | 'overdue' | 'reported' | 'week';
export type TaskSort = 'date' | 'priority';

export const FILTER_LABELS: Record<TaskFilter, string> = {
  all: 'Toutes',
  active: 'En cours',
  overdue: 'En retard',
  reported: 'Reportées',
  week: 'Cette semaine',
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  return task.status === 'active' && new Date(task.dueDate).getTime() < now.getTime();
}

export function isDueToday(task: Task, now: Date = new Date()): boolean {
  return isSameDay(new Date(task.dueDate), now);
}

/** Tâche active qui a été « reportée » (échéance repoussée manuellement). */
export function isReported(task: Task): boolean {
  return task.status === 'active' && task.reportedAt !== null;
}

/**
 * Prochaine occurrence d'une tâche répétée, à partir de son échéance
 * actuelle. Renvoie `null` si la règle est « aucune ».
 */
export function nextOccurrence(due: Date, rule: RepeatRule): Date | null {
  switch (rule) {
    case 'daily':
      return addDays(due, 1);
    case 'weekly':
      return addDays(due, 7);
    case 'monthly':
      return new Date(
        due.getFullYear(),
        due.getMonth() + 1,
        due.getDate(),
        due.getHours(),
        due.getMinutes(),
        0,
        0
      );
    default:
      return null;
  }
}

/** Libellé français d'une règle de répétition. */
export function repeatLabel(rule: RepeatRule): string {
  switch (rule) {
    case 'daily':
      return 'Tous les jours';
    case 'weekly':
      return 'Chaque semaine';
    case 'monthly':
      return 'Chaque mois';
    default:
      return 'Jamais';
  }
}

/** Tâches visibles au quotidien : tout sauf les archives. */
export function visibleTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status !== 'archived');
}

export function archivedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'archived');
}

export function filterTasks(tasks: Task[], filter: TaskFilter, now: Date = new Date()): Task[] {
  const endOfWeek = addDays(now, 7);
  switch (filter) {
    case 'active':
      return tasks.filter((t) => t.status === 'active');
    case 'overdue':
      return tasks.filter((t) => isOverdue(t, now));
    case 'reported':
      return tasks.filter((t) => isReported(t));
    case 'week':
      return tasks.filter((t) => {
        const due = new Date(t.dueDate);
        return due >= now && due <= endOfWeek;
      });
    default:
      return [...tasks];
  }
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const copy = [...tasks];
  if (sort === 'priority') {
    return copy.sort((a, b) => {
      const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return rank !== 0 ? rank : +new Date(a.dueDate) - +new Date(b.dueDate);
    });
  }
  return copy.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
}

export function searchTasks(
  tasks: Task[],
  query: string,
  subjectName: (t: Task) => string
): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...tasks];
  return tasks.filter((t) =>
    `${t.title} ${t.description} ${subjectName(t)}`.toLowerCase().includes(q)
  );
}

export function tasksDueOn(tasks: Task[], dateKey: string): Task[] {
  return visibleTasks(tasks).filter((t) => toDateKey(new Date(t.dueDate)) === dateKey);
}

export function upcomingTasks(tasks: Task[], now: Date = new Date(), limit = 3): Task[] {
  const upcoming = visibleTasks(tasks).filter((t) => {
    const due = new Date(t.dueDate);
    return due > now && !isSameDay(due, now);
  });
  return sortTasks(upcoming, 'date').slice(0, limit);
}

/** Tâches actives à priorité haute (P1), hors retard. */
export function importantTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return sortTasks(
    visibleTasks(tasks).filter(
      (t) => t.status === 'active' && t.priority === 'high' && !isOverdue(t, now)
    ),
    'date'
  );
}

/** Toutes les tâches visibles à partir d'aujourd'hui, triées par échéance. */
export function allUpcomingTasks(tasks: Task[], now: Date = new Date()): Task[] {
  const todayStart = startOfDay(now);
  return sortTasks(
    visibleTasks(tasks).filter((t) => new Date(t.dueDate) >= todayStart),
    'date'
  );
}

export interface DateSection {
  dateKey: string;
  label: string;
  tasks: Task[];
}

function daySectionLabel(date: Date, now: Date): string {
  if (isSameDay(date, now)) return "Aujourd'hui";
  if (isSameDay(date, addDays(now, 1))) return 'Demain';
  return formatDay(date);
}

/** Regroupe des tâches par jour d'échéance (clé locale). */
export function groupByDate(tasks: Task[], now: Date = new Date()): DateSection[] {
  const groups = new Map<string, Task[]>();
  tasks.forEach((task) => {
    const key = toDateKey(new Date(task.dueDate));
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(task);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, list]) => ({
      dateKey,
      label: daySectionLabel(fromDateKey(dateKey), now),
      tasks: sortTasks(list, 'date'),
    }));
}

export function archivedThisMonth(tasks: Task[], now: Date = new Date()): Task[] {
  return archivedTasks(tasks).filter(
    (t) => t.archivedAt !== null && isSameMonth(new Date(t.archivedAt), now)
  );
}

/** Regroupe des tâches par identifiant de matière, en conservant l'ordre d'apparition. */
export function groupBySubject(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce<Record<string, Task[]>>((acc, task) => {
    (acc[task.subjectId] ??= []).push(task);
    return acc;
  }, {});
}

export interface TaskStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  archived: number;
  completionRate: number;
  bySubject: { subjectId: string; total: number; completed: number }[];
}

export function computeStats(tasks: Task[], now: Date = new Date()): TaskStats {
  const completed = tasks.filter((t) => t.completedAt !== null).length;
  const grouped = groupBySubject(tasks);
  return {
    total: tasks.length,
    completed,
    active: tasks.filter((t) => t.status === 'active').length,
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
    archived: archivedTasks(tasks).length,
    completionRate: tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100),
    bySubject: Object.entries(grouped).map(([subjectId, list]) => ({
      subjectId,
      total: list.length,
      completed: list.filter((t) => t.completedAt !== null).length,
    })),
  };
}

/**
 * Archive les tâches terminées depuis plus de AUTO_ARCHIVE_DAYS jours.
 * Retourne le tableau inchangé (même référence) s'il n'y a rien à archiver,
 * ce qui évite une écriture inutile dans AsyncStorage au démarrage.
 */
export function applyAutoArchive(tasks: Task[], now: Date = new Date()): Task[] {
  let changed = false;
  const next = tasks.map((task) => {
    if (
      task.status === 'completed' &&
      task.completedAt !== null &&
      daysBetween(new Date(task.completedAt), now) >= AUTO_ARCHIVE_DAYS
    ) {
      changed = true;
      return { ...task, status: 'archived' as const, archivedAt: now.toISOString() };
    }
    return task;
  });
  return changed ? next : tasks;
}

export interface DailyCount {
  dateKey: string;
  label: string;
  count: number;
}

export interface RangeStats {
  /** Tâches (hors archives) dont l'échéance tombe dans la période. */
  totalDue: number;
  /** Parmi celles-ci, combien sont terminées. */
  completed: number;
  /** Parmi celles-ci, combien restent en cours. */
  active: number;
  /** Parmi celles-ci, combien sont dépassées (échéance avant maintenant). */
  overdue: number;
  completionRate: number;
  bySubject: { subjectId: string; total: number; completed: number }[];
}

/**
 * Statistiques d'une période bornée `[start, end]`, fondées sur l'échéance
 * (`dueDate`) plutôt que sur la date de création, ce qui colle à la vision
 * « tâches à faire » des écrans.
 */
export function statsForRange(
  tasks: Task[],
  start: Date,
  end: Date,
  now: Date = new Date()
): RangeStats {
  const s = startOfDay(start);
  const e = endOfDay(end);
  const due = visibleTasks(tasks).filter((t) => {
    const dueAt = new Date(t.dueDate);
    return dueAt >= s && dueAt <= e;
  });
  const completed = due.filter((t) => t.status === 'completed');
  const bySubject = Object.entries(groupBySubject(due)).map(([subjectId, list]) => ({
    subjectId,
    total: list.length,
    completed: list.filter((t) => t.status === 'completed').length,
  }));
  return {
    totalDue: due.length,
    completed: completed.length,
    active: due.filter((t) => t.status === 'active').length,
    overdue: due.filter((t) => t.status === 'active' && new Date(t.dueDate) < now).length,
    completionRate: due.length === 0 ? 0 : Math.round((completed.length / due.length) * 100),
    bySubject,
  };
}

/**
 * Nombre de tâches terminées par jour dans la période. S'appuie sur
 * `completedAt`, en heure locale (règle du projet, voir `lib/date.ts`).
 */
export function completedPerDay(tasks: Task[], start: Date, end: Date): DailyCount[] {
  const s = startOfDay(start);
  const e = endOfDay(end);
  const counts = new Map<string, number>();
  tasks.forEach((task) => {
    if (task.completedAt === null) return;
    const at = new Date(task.completedAt);
    if (at < s || at > e) return;
    const key = toDateKey(at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return eachDay(start, end).map((day) => ({
    dateKey: toDateKey(day),
    label: formatShortDay(day),
    count: counts.get(toDateKey(day)) ?? 0,
  }));
}

/**
 * Séries pour un graphique : un point par jour tant que la période reste
 * lisible (≤ 42 jours), sinon un point par semaine s'appuyant sur la clé du
 * lundi. Évite un graphique illisible sur de longues périodes personnalisées.
 */
export function buildTrend(tasks: Task[], start: Date, end: Date): DailyCount[] {
  const daily = completedPerDay(tasks, start, end);
  if (daily.length <= 42) return daily;

  const buckets: DailyCount[] = [];
  let current: DailyCount | null = null;
  for (const day of daily) {
    const weekKey = toDateKey(startOfWeek(fromDateKey(day.dateKey)));
    if (current === null || current.dateKey !== weekKey) {
      current = { dateKey: weekKey, label: formatShortDate(startOfWeek(fromDateKey(day.dateKey))), count: 0 };
      buckets.push(current);
    }
    current.count += day.count;
  }
  return buckets;
}
