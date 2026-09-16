/**
 * Utilitaires de date.
 *
 * Règle du projet : les dates sont **stockées** en ISO 8601 mais toujours
 * **comparées et affichées** en heure locale. `Date.toISOString()` convertit
 * en UTC : l'utiliser pour construire une clé de jour décale la tâche d'une
 * journée dès que le fuseau n'est pas UTC (une échéance à 01h00 à
 * Antananarivo, UTC+3, tomberait la veille). Toutes les clés de jour passent
 * donc par `toDateKey`.
 */

const MS_PER_DAY = 86_400_000;

/** Clé de jour locale au format `AAAA-MM-JJ`. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Reconstruit une date locale à midi à partir d'une clé `AAAA-MM-JJ`. */
export function fromDateKey(key: string, hours = 12, minutes = 0): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_DAY;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/** Lundi 00 h de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

/** Dimanche 23 h 59 de la semaine contenant `date`. */
export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  return endOfDay(start);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Énumère les journées (bornes incluses) entre deux dates, en heure locale. */
export function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(from);
  const last = startOfDay(to);
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 12, 0, 0, 0));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Jour court français, ex. « lun. 3 ». */
export function formatShortDay(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

/** Intervalle lisible, ex. « 2 mars – 9 mars ». */
export function formatRange(from: Date, to: Date): string {
  return `${formatShortDate(from)} – ${formatShortDate(to)}`;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date): string {
  return `${formatShortDate(date)} à ${formatTime(date)}`;
}
