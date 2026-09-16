import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from '@/components/ui/Screen';
import TextField from '@/components/ui/TextField';
import EmptyState from '@/components/EmptyState';
import FilterBar from '@/components/FilterBar';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { getCategory } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import {
  FILTER_LABELS,
  TaskFilter,
  TaskSort,
  filterTasks,
  searchTasks,
  sortTasks,
  visibleTasks,
} from '@/lib/tasks';

const FILTERS = (Object.keys(FILTER_LABELS) as TaskFilter[]).map((value) => ({
  value,
  label: FILTER_LABELS[value],
}));

export default function Tasks() {
  const { tasks, toggleTask } = useTasks();
  const { settings } = useSettings();
  const { filter: rawFilter } = useLocalSearchParams<{ filter?: string }>();

  // Le filtre vient du paramètre de route : « Tout voir » depuis l'Accueil
  // pousse `?filter=overdue`, et les boutons du FilterBar mettent à jour le
  // paramètre. Ainsi la vue reflète toujours le filtre demandé.
  const filter: TaskFilter =
    typeof rawFilter === 'string' && (FILTER_LABELS as Record<string, string>)[rawFilter]
      ? (rawFilter as TaskFilter)
      : 'all';

  const changeFilter = (value: TaskFilter) => router.setParams({ filter: value });

  const [sort, setSort] = useState<TaskSort>('date');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const now = new Date();
    const filtered = filterTasks(visibleTasks(tasks), filter, now);
    const searched = searchTasks(
      filtered,
      query,
      (t) => getCategory(settings.categories, t.subjectId).name
    );
    return sortTasks(searched, sort);
  }, [tasks, filter, sort, query, settings.categories]);

  return (
    <Screen>
      <Header
        title={filter === 'all' ? 'Toutes les tâches' : FILTER_LABELS[filter]}
        right={
          <Pressable
            onPress={() => setSort((current) => (current === 'date' ? 'priority' : 'date'))}
            accessibilityRole="button"
            accessibilityLabel="Changer le tri"
            hitSlop={8}
          >
            <Text className="text-sm font-semibold text-primary">
              Tri : {sort === 'date' ? 'échéance' : 'priorité'}
            </Text>
          </Pressable>
        }
      />

      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une tâche…"
        accessibilityLabel="Rechercher une tâche"
        variant="surface"
        containerClassName="mb-4"
      />

      <FilterBar items={FILTERS} value={filter} onChange={changeFilter} />

      <FlatList
        className="flex-1"
        data={shown}
        keyExtractor={(task) => task.id}
        contentContainerStyle={{ paddingBottom: 150 }}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggle={() => toggleTask(item.id)}
            onPress={() => router.push(`/task/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Aucune tâche"
            message="Ajuste tes filtres ou crée une nouvelle tâche."
          />
        }
      />
    </Screen>
  );
}
