import { Share } from 'react-native';
import { getSubject } from '@/constants';
import { formatDateTime } from '@/lib/date';
import { repeatLabel } from '@/lib/tasks';
import { toCSV, toJSON } from '@/lib/serialize';
import { Task } from '@/types';

/** Partage l'ensemble des tâches via la feuille de partage du système. */
export async function shareTasks(tasks: Task[], format: 'json' | 'csv'): Promise<void> {
  await Share.share({
    title: `Export TaskStudent (${format.toUpperCase()})`,
    message: format === 'csv' ? toCSV(tasks) : toJSON(tasks),
  });
}

/** Partage une tâche unique sous forme de texte lisible. */
export async function shareTask(task: Task): Promise<void> {
  const subject = getSubject(task.subjectId);
  const lines = [
    task.title,
    `${subject.name} · à rendre le ${formatDateTime(new Date(task.dueDate))}`,
  ];
  if (task.durationMinutes) lines[1] += ` · ${task.durationMinutes} min`;
  if (task.repeat !== 'none') lines.push(`Répétition : ${repeatLabel(task.repeat)}`);
  if (task.description) lines.push('', task.description);
  if (task.note) lines.push(`Remarque : ${task.note}`);
  if (task.subtasks.length > 0) {
    lines.push('', ...task.subtasks.map((s) => `${s.isCompleted ? '☑' : '☐'} ${s.title}`));
  }
  await Share.share({ title: task.title, message: lines.join('\n') });
}
