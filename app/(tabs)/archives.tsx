import { useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, Text } from 'react-native';
import { router } from 'expo-router';
import Screen from '@/components/ui/Screen';
import TextField from '@/components/ui/TextField';
import EmptyState from '@/components/EmptyState';
import FilterBar from '@/components/FilterBar';
import Header from '@/components/Header';
import TaskCardArchive from '@/components/TaskCardArchive';
import { getCategory } from '@/constants';
import { useArchives } from '@/hooks/useArchives';
import { useSettings } from '@/context/SettingsContext';
import { isSameMonth } from '@/lib/date';
import { groupBySubject, searchTasks, sortTasks } from '@/lib/tasks';
import { Task } from '@/types';

type ArchiveFilter = 'all' | 'month' | 'project';

const FILTERS = [
  { value: 'all' as const, label: 'Toutes' },
  { value: 'month' as const, label: 'Ce mois-ci' },
  { value: 'project' as const, label: 'Par projet' },
];

export default function Archives() {
  const { archives, thisMonth, restoreTask, deleteTask, clearArchives } = useArchives();
  const { settings } = useSettings();
  const [filter, setFilter] = useState<ArchiveFilter>('all');
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const now = new Date();
    const base =
      filter === 'month'
        ? archives.filter((t) => t.archivedAt !== null && isSameMonth(new Date(t.archivedAt), now))
        : archives;
    const found = searchTasks(
      base,
      query,
      (t) => getCategory(settings.categories, t.subjectId).name
    );

    if (filter !== 'project') {
      return [{ title: '', data: sortTasks(found, 'date') }];
    }

    return Object.entries(groupBySubject(found))
      .map(([subjectId, list]) => ({
        title: getCategory(settings.categories, subjectId).name,
        data: sortTasks(list, 'date'),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  }, [archives, filter, query, settings.categories]);

  const confirmClear = () =>
    Alert.alert('Vider les archives ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vider', style: 'destructive', onPress: clearArchives },
    ]);

  const renderItem = ({ item }: { item: Task }) => (
    <TaskCardArchive
      task={item}
      onPress={() => router.push(`/task/${item.id}`)}
      onRestore={() => restoreTask(item.id)}
      onDelete={() => deleteTask(item.id)}
    />
  );

  return (
    <Screen>
      <Header
        title="Archives"
        subtitle={`${thisMonth.length} tâche${thisMonth.length > 1 ? 's' : ''} archivée${
          thisMonth.length > 1 ? 's' : ''
        } ce mois-ci`}
        right={
          archives.length > 0 ? (
            <Pressable onPress={confirmClear} accessibilityRole="button" hitSlop={8}>
              <Text className="text-sm font-semibold text-danger">Tout vider</Text>
            </Pressable>
          ) : undefined
        }
      />

      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher par titre ou projet…"
        accessibilityLabel="Rechercher dans les archives"
        variant="surface"
        containerClassName="mb-4"
      />

      <FilterBar items={FILTERS} value={filter} onChange={setFilter} />

      <SectionList
        className="flex-1"
        sections={sections}
        keyExtractor={(task) => task.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 150 }}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wider text-faint">
              {section.title}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📦"
            title="Aucune tâche archivée"
            message="Tes tâches terminées puis archivées apparaîtront ici."
          />
        }
      />
    </Screen>
  );
}
