import { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { archivedThisMonth, archivedTasks, groupBySubject } from '@/lib/tasks';

/**
 * Vue dédiée aux archives : dérive les listes utiles à partir de la source de
 * vérité unique, sans dupliquer l'état.
 */
export function useArchives() {
  const api = useTasks();

  const archives = useMemo(() => archivedTasks(api.tasks), [api.tasks]);
  const thisMonth = useMemo(() => archivedThisMonth(api.tasks), [api.tasks]);
  const bySubject = useMemo(() => groupBySubject(archives), [archives]);

  return { ...api, archives, thisMonth, bySubject };
}
