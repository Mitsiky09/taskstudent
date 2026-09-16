import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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
    const searched = searchTasks(filtered, query, (t) =>
      getCategory(settings.categories, t.subjectId).name
    );
    return sortTasks(searched, sort);
  }, [tasks, filter, sort, query, settings.categories]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="px-4">
        <Header
          title={filter === 'all' ? 'Toutes les tâches' : FILTER_LABELS[filter]}
          right={
            <Pressable
              onPress={() => setSort((current) => (current === 'date' ? 'priority' : 'date'))}
              accessibilityRole="button"
              accessibilityLabel="Changer le tri"
              hitSlop={8}
            >
              <Text className="text-indigo-600">
                Tri : {sort === 'date' ? 'échéance' : 'priorité'}
              </Text>
            </Pressable>
          }
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une tâche…"
          accessibilityLabel="Rechercher une tâche"
          className="mb-4 h-12 rounded-xl bg-white px-4"
        />

        <FilterBar items={FILTERS} value={filter} onChange={changeFilter} />
      </View>

      <FlatList
        data={shown}
        keyExtractor={(task) => task.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 150 }}
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

    </SafeAreaView>
  );
}