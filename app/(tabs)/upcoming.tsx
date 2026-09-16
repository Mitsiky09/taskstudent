import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { COLORS, FALLBACK_PROJECT, getCategory } from '@/constants';
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

const ALL_CATEGORIES: Subject = { id: 'all', name: 'Toutes', color: '#64748b' };

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
    const dueToday = sortTasks(visibleTasks(tasks).filter((t) => isDueToday(t, now)), 'date');
    const byStatus = filterTasks(dueToday, filter, now);
    const byCategory =
      categoryId === 'all' ? byStatus : byStatus.filter((t) => t.subjectId === categoryId);
    const searched = searchTasks(byCategory, query, (t) =>
      getCategory(categories, t.subjectId).name
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
      visibleTasks(tasks).filter(
        (t) => isDueToday(t, new Date()) && t.status === 'active'
      ).length,
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
        : categories.find((c) => c.id === categoryId) ?? ALL_CATEGORIES,
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
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <View className="px-4 pt-1">
        <Header
          title="Aujourd'hui"
          subtitle={`${formatShortDate(new Date())} · ${remainingCount} restante${remainingCount !== 1 ? 's' : ''}`}
          right={
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => setSearchOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityLabel={searchOpen ? 'Fermer la recherche' : 'Rechercher'}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
              >
                <Ionicons
                  name={searchOpen || query.length > 0 ? 'close' : 'search'}
                  size={20}
                  color="#64748b"
                />
              </Pressable>

              <Pressable
                onPress={() => setFiltersOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir les filtres"
                hitSlop={8}
                className={`h-10 w-10 items-center justify-center rounded-full border ${
                  hasActiveFilters
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={hasActiveFilters ? '#4f46e5' : '#64748b'}
                />
                {activeFilterCount > 0 && (
                  <View className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1">
                    <Text className="text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          }
        />

        {searchOpen && (
          <View className="mt-3 h-12 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3.5">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher…"
              placeholderTextColor="#94a3b8"
              accessibilityLabel="Rechercher une tâche du jour"
              autoFocus
              className="ml-2.5 flex-1 text-base text-slate-800"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        )}

        {hasActiveFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {filter !== 'all' && (
              <Pressable
                onPress={() => setFilter('all')}
                className="h-9 flex-row items-center gap-1.5 rounded-full bg-indigo-100 px-3.5"
              >
                <Text className="text-sm font-medium text-indigo-700">
                  {TODAY_FILTERS.find((f) => f.value === filter)?.label}
                </Text>
                <Ionicons name="close" size={14} color="#4f46e5" />
              </Pressable>
            )}
            {categoryId !== 'all' && (
              <Pressable
                onPress={() => setCategoryId('all')}
                className="h-9 flex-row items-center gap-1.5 rounded-full px-3.5"
                style={{ backgroundColor: `${activeCategory.color}22` }}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: activeCategory.color }}
                />
                <Text
                  className="text-sm font-medium"
                  style={{ color: activeCategory.color }}
                >
                  {activeCategory.name}
                </Text>
                <Ionicons name="close" size={14} color={activeCategory.color} />
              </Pressable>
            )}
            {sort !== 'date' && (
              <Pressable
                onPress={() => setSort('date')}
                className="h-9 flex-row items-center gap-1.5 rounded-full bg-slate-200 px-3.5"
              >
                <Text className="text-sm font-medium text-slate-700">Priorité</Text>
                <Ionicons name="close" size={14} color="#475569" />
              </Pressable>
            )}
            <Pressable
              onPress={resetFilters}
              className="h-9 items-center justify-center rounded-full px-3"
            >
              <Text className="text-sm font-medium text-slate-500">Tout effacer</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(task) => task.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 150 }}
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

      <Modal
        visible={filtersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setFiltersOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-5 pb-10 pt-3"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-200" />
            </View>

            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-slate-900">Filtres</Text>
              {hasActiveFilters && (
                <Pressable onPress={resetFilters} hitSlop={8}>
                  <Text className="text-sm font-medium text-indigo-600">Réinitialiser</Text>
                </Pressable>
              )}
            </View>

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Trier par
            </Text>
            <View className="mb-6 flex-row rounded-2xl bg-slate-100 p-1">
              {SORT_OPTIONS.map((item) => {
                const selected = sort === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setSort(item.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={`flex-1 items-center justify-center rounded-xl py-3.5 ${
                      selected ? 'bg-white' : ''
                    }`}
                    style={
                      selected
                        ? {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.06,
                            shadowRadius: 2,
                            elevation: 1,
                          }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm ${
                        selected
                          ? 'font-semibold text-slate-900'
                          : 'font-medium text-slate-500'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Statut
            </Text>
            <View className="mb-6 flex-row rounded-2xl bg-slate-100 p-1">
              {TODAY_FILTERS.map((item) => {
                const selected = filter === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilter(item.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={`flex-1 items-center justify-center rounded-xl py-3.5 ${
                      selected ? 'bg-white' : ''
                    }`}
                    style={
                      selected
                        ? {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.06,
                            shadowRadius: 2,
                            elevation: 1,
                          }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-sm ${
                        selected
                          ? 'font-semibold text-slate-900'
                          : 'font-medium text-slate-500'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Catégorie
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 8 }}
            >
              {[ALL_CATEGORIES, ...categories].map((category) => {
                const selected = categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={`h-11 flex-row items-center gap-2.5 rounded-full px-5 ${
                      selected ? '' : 'border border-slate-200 bg-slate-50'
                    }`}
                    style={selected ? { backgroundColor: category.color } : undefined}
                  >
                    {!selected && (
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <Text
                      className={`text-sm ${
                        selected
                          ? 'font-semibold text-white'
                          : 'font-medium text-slate-600'
                      }`}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => setFiltersOpen(false)}
              className="mt-8 items-center rounded-2xl bg-indigo-600 py-4"
            >
              <Text className="text-base font-semibold text-white">
                Voir {shown.length} tâche{shown.length !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}