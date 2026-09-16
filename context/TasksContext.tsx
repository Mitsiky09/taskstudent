import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { STORAGE_KEYS } from '@/constants';
import { createId } from '@/lib/id';
import { migrateTasks } from '@/lib/migration';
import { scheduleReminder } from '@/lib/notifications';
import { readJSON, writeJSON } from '@/lib/storage';
import { applyAutoArchive, nextOccurrence } from '@/lib/tasks';
import { Task, TaskInput } from '@/types';
import { useSettings } from '@/context/SettingsContext';

/**
 * Source de vérité des tâches.
 *
 * Deux points d'attention :
 *
 * 1. **Toutes les mutations passent par `setTasks(previous => ...)`.** Lire le
 *    tableau capturé dans la closure exposerait à des écritures concurrentes :
 *    deux actions rapprochées (cocher deux tâches d'affilée) repartiraient du
 *    même état et la première serait perdue.
 * 2. **La persistance est un effet dérivé de l'état**, déclenché seulement
 *    après l'hydratation. Sans ce garde-fou, le premier rendu écrirait un
 *    tableau vide par-dessus les données de l'utilisateur.
 */

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
  clearArchives: () => void;
  reportTask: (id: string, due: Date) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const hydrated = useRef(false);
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    let active = true;
    readJSON<unknown>(STORAGE_KEYS.tasks, []).then((raw) => {
      if (!active) return;
      setTasks(migrateTasks(raw));
      hydrated.current = true;
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    void writeJSON(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  // Archivage automatique des tâches terminées depuis plus d'une semaine.
  // Effet légitime (pas de la dérivation de props) : il synchronise l'état
  // persisté avec une condition externe qui devient vraie de façon
  // asynchrone (hydratation + préférences chargées), donc `setState` ne peut
  // pas être calculé pendant le rendu. `applyAutoArchive` renvoie la même
  // référence si rien n'a changé, ce qui évite tout rendu en boucle.
  useEffect(() => {
    if (loading || settingsLoading || !settings.autoArchive) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise l'état persisté avec la disponibilité asynchrone des données, pas une dérivation de props.
    setTasks((previous) => applyAutoArchive(previous));
  }, [loading, settingsLoading, settings.autoArchive]);

  const createTask = useCallback(
    async (input: TaskInput): Promise<Task> => {
      const task: Task = {
        id: createId(),
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        priority: input.priority,
        subjectId: input.subjectId,
        status: 'active',
        subtasks: input.subtasks ?? [],
        reminders: input.reminders ?? [],
        reportedAt: input.reportedAt ?? null,
        durationMinutes: input.durationMinutes ?? null,
        note: input.note ?? '',
        repeat: input.repeat ?? 'none',
        createdAt: new Date().toISOString(),
        completedAt: null,
        archivedAt: null,
      };
      setTasks((previous) => [...previous, task]);

      if (settings.notifications) {
        await Promise.all(task.reminders.map((iso) => scheduleReminder(task.title, new Date(iso))));
      }
      return task;
    },
    [settings.notifications]
  );

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((previous) => previous.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((previous) => previous.filter((t) => t.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== id) return task;
        const wasCompleted = task.status === 'completed';
        if (wasCompleted) {
          return { ...task, status: 'active' as const, completedAt: null };
        }
        const next = nextOccurrence(new Date(task.dueDate), task.repeat);
        if (next) {
          return {
            ...task,
            dueDate: next.toISOString(),
            status: 'active' as const,
            completedAt: null,
            reportedAt: null,
          };
        }
        return { ...task, status: 'completed' as const, completedAt: new Date().toISOString() };
      })
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
              ),
            }
          : task
      )
    );
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                { id: createId('s'), title: trimmed, isCompleted: false },
              ],
            }
          : task
      )
    );
  }, []);

  const archiveTask = useCallback((id: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, status: 'archived', archivedAt: new Date().toISOString() }
          : task
      )
    );
  }, []);

  const restoreTask = useCallback((id: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, status: 'active', completedAt: null, archivedAt: null } : task
      )
    );
  }, []);

  const clearArchives = useCallback(() => {
    setTasks((previous) => previous.filter((t) => t.status !== 'archived'));
  }, []);

  const reportTask = useCallback((id: string, due: Date) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, dueDate: due.toISOString(), reportedAt: new Date().toISOString() }
          : task
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      loading,
      createTask,
      updateTask,
      deleteTask,
      toggleTask,
      toggleSubtask,
      addSubtask,
      archiveTask,
      restoreTask,
      clearArchives,
      reportTask,
    }),
    [
      tasks,
      loading,
      createTask,
      updateTask,
      deleteTask,
      toggleTask,
      toggleSubtask,
      addSubtask,
      archiveTask,
      restoreTask,
      clearArchives,
      reportTask,
    ]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasksContext(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks doit être utilisé dans un TasksProvider');
  return context;
}
