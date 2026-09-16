import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Sheet, { SheetAction } from '@/components/ui/Sheet';
import TextField, { ClearButton } from '@/components/ui/TextField';
import EmptyState from '@/components/EmptyState';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { FALLBACK_PROJECT, getCategory } from '@/constants';
import { theme } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { formatShortDate } from '@/lib/date';
import {
  filterTasks,
  isDueToday,
  isOverdue,
  searchTasks,
  sortTasks,
  TaskSort,
  visibleTasks,
} from '@/lib/tasks';
import { Subject } from '@/types';

type TodayFilter = 'all' | 'active' | 'overdue' | 'reported';

const TODAY_FILTERS: { value: TodayFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'active', label: 'En cours' },
  { value: 'overdue', label: 'En retard' },
  { value: 'reported', label: 'Reportées' },
];

const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: 'date', label: 'Échéance' },
  { value: 'priority', label: 'Priorité' },
];

const ALL_CATEGORIES: Subject = { id: 'all', name: 'Toutes', color: theme.colors.textSecondary };

export default function Aujourdhui() {
  const { tasks, toggleTask } = useTasks();
  const { settings } = useSettings();
  const [filter, setFilter] = useState<TodayFilter>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [sort, setSort] = useState<TaskSort>('date');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(
    () => (settings.categories.length > 0 ? settings.categories : [FALLBACK_PROJECT]),
    [settings.categories]
  );

  const shown = useMemo(() => {
    const now = new Date();
    const dueToday = sortTasks(
      visibleTasks(tasks).filter((t) => isDueToday(t, now)),
      'date'
    );
    const byStatus = filterTasks(dueToday, filter, now);
    const byCategory =
      categoryId === 'all' ? byStatus : byStatus.filter((t) => t.subjectId === categoryId);
    const searched = searchTasks(
      byCategory,
      query,
      (t) => getCategory(categories, t.subjectId).name
    );
    const sorted = sortTasks(searched, sort);

    return [...sorted].sort((a, b) => {
      const aDone = a.status === 'completed' ? 1 : 0;
      const bDone = b.status === 'completed' ? 1 : 0;
      return aDone - bDone;
    });
  }, [tasks, filter, categoryId, sort, query, categories]);

  const remainingCount = useMemo(
    () =>
      visibleTasks(tasks).filter((t) => isDueToday(t, new Date()) && t.status === 'active').length,
    [tasks]
  );

  const overdueCount = useMemo(
    () => visibleTasks(tasks).filter((t) => t.status === 'active' && isOverdue(t)).length,
    [tasks]
  );

  const activeCategory = useMemo(
    () =>
      categoryId === 'all'
        ? ALL_CATEGORIES
        : (categories.find((c) => c.id === categoryId) ?? ALL_CATEGORIES),
    [categoryId, categories]
  );

  const hasActiveFilters = filter !== 'all' || categoryId !== 'all' || sort !== 'date';

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filter !== 'all') n += 1;
    if (categoryId !== 'all') n += 1;
    if (sort !== 'date') n += 1;
    return n;
  }, [filter, categoryId, sort]);

  const resetFilters = () => {
    setFilter('all');
    setCategoryId('all');
    setSort('date');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <View className="px-5">
        <Header
          title="Aujourd'hui"
          subtitle={`${formatShortDate(new Date())} · ${remainingCount} restante${
            remainingCount !== 1 ? 's' : ''
          }`}
          right={
            <View className="flex-row items-center gap-2">
              <IconButton
                icon={searchOpen || query.length > 0 ? 'close' : 'search'}
                onPress={() => setSearchOpen((o) => !o)}
                label={searchOpen ? 'Fermer la recherche' : 'Rechercher'}
              />

              <View>
                <IconButton
                  icon="options-outline"
                  onPress={() => setFiltersOpen(true)}
                  label="Ouvrir les filtres"
                />
                {activeFilterCount > 0 ? (
                  <View className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1">
                    <Text className="text-[10px] font-bold text-white">{activeFilterCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          }
        />

        {searchOpen ? (
          <TextField
            icon="search"
            variant="surface"
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher…"
            accessibilityLabel="Rechercher une tâche du jour"
            autoFocus
            containerClassName="mb-4 -mt-2"
            right={query.length > 0 ? <ClearButton onPress={() => setQuery('')} /> : undefined}
          />
        ) : null}

        {hasActiveFilters ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mt-2 mb-4"
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {filter !== 'all' ? (
              <Chip
                size="sm"
                tone="soft"
                closable
                label={TODAY_FILTERS.find((f) => f.value === filter)?.label ?? ''}
                onPress={() => setFilter('all')}
              />
            ) : null}
            {categoryId !== 'all' ? (
              <Chip
                size="sm"
                tone="soft"
                closable
                color={activeCategory.color}
                label={activeCategory.name}
                onPress={() => setCategoryId('all')}
              />
            ) : null}
            {sort !== 'date' ? (
              <Chip
                size="sm"
                tone="soft"
                closable
                label="Priorité"
                onPress={() => setSort('date')}
              />
            ) : null}
            <Pressable
              onPress={resetFilters}
              className="h-9 items-center justify-center rounded-full px-3"
              accessibilityRole="button"
            >
              <Text className="text-sm font-medium text-muted">Tout effacer</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(task) => task.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 150 }}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggle={() => toggleTask(item.id)}
            onPress={() => router.push(`/task/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji={overdueCount > 0 && filter === 'overdue' ? '⏰' : '☀️'}
            title={
              filter === 'overdue'
                ? 'Aucune tâche en retard'
                : filter === 'reported'
                  ? 'Aucune tâche reportée'
                  : "Rien d'aujourd'hui"
            }
            message={
              filter === 'overdue'
                ? 'Tout est à jour, bravo.'
                : filter === 'reported'
                  ? "Aucune tâche n'a été reportée."
                  : 'Ajoute une tâche avec une date du jour ou change de filtre.'
            }
          />
        }
      />

      <Sheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtres"
        action={hasActiveFilters ? { label: 'Réinitialiser', onPress: resetFilters } : undefined}
        footer={
          <SheetAction
            label={`Voir ${shown.length} tâche${shown.length !== 1 ? 's' : ''}`}
            onPress={() => setFiltersOpen(false)}
          />
        }
      >
        <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">
          Trier par
        </Text>
        <SegmentedControl items={SORT_OPTIONS} value={sort} onChange={setSort} className="mb-6" />

        <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">
          Statut
        </Text>
        <SegmentedControl
          items={TODAY_FILTERS}
          value={filter}
          onChange={setFilter}
          className="mb-6"
        />

        <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">
          Catégorie
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 8 }}
        >
          {[ALL_CATEGORIES, ...categories].map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              color={category.color}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </ScrollView>
      </Sheet>
    </SafeAreaView>
  );
}
