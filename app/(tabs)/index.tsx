import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DonutChart } from '@/components/charts';
import EmptyState from '@/components/EmptyState';
import TaskCard from '@/components/TaskCard';
import { COLORS } from '@/constants';
import { useSession } from '@/context/SessionContext';
import { useTasks } from '@/hooks/useTasks';
import { formatDay } from '@/lib/date';
import {
  filterTasks,
  importantTasks,
  isDueToday,
  isOverdue,
  isReported,
  sortTasks,
  visibleTasks,
} from '@/lib/tasks';
import { Task } from '@/types';

const DONUT_COLORS = { todo: '#6366f1', done: '#10b981', overdue: '#f43f5e', reported: '#f59e0b' };

export default function Home() {
  const { tasks, toggleTask } = useTasks();
  const { user } = useSession();

  // Regroupement des données de tâches
  const { dueToday, overdue, overdueCount, important, reportedCount, reportedPreview } = useMemo(() => {
    const now = new Date();
    const visible = visibleTasks(tasks);
    const dueToday = visible.filter((t) => isDueToday(t, now));
    const overdueList = sortTasks(filterTasks(visible, 'overdue', now), 'date');
    const reportedList = sortTasks(
      visible.filter((t) => isReported(t)),
      'date'
    );
    return {
      dueToday,
      overdue: overdueList.slice(0, 2),
      overdueCount: overdueList.length,
      important: importantTasks(tasks, now).slice(0, 3),
      reportedCount: reportedList.length,
      reportedPreview: reportedList.slice(0, 2),
    };
  }, [tasks]);

  // Regroupement des données du graphique Donut
  const donutData = useMemo(() => {
    const overdue = dueToday.filter((t) => t.status === 'active' && isOverdue(t)).length;
    const done = dueToday.filter((t) => t.status === 'completed').length;
    const reported = dueToday.filter((t) => t.status === 'active' && isReported(t)).length;
    const todo = dueToday.filter(
      (t) => t.status === 'active' && !isOverdue(t) && !isReported(t)
    ).length;

    return {
      todo,
      done,
      overdue,
      reported,
      chartData: [
        { label: 'À faire', value: todo, color: DONUT_COLORS.todo },
        { label: 'Reportées', value: reported, color: DONUT_COLORS.reported },
        { label: 'Terminées', value: done, color: DONUT_COLORS.done },
        { label: 'En retard', value: overdue, color: DONUT_COLORS.overdue },
      ],
    };
  }, [dueToday]);

  const renderTask = (task: Task) => (
    <TaskCard
      key={task.id}
      task={task}
      onToggle={() => toggleTask(task.id)}
      onPress={() => router.push(`/task/${task.id}`)}
    />
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50/50">
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Header - Plus épuré avec un bouton "Stats" discret */}
        <View className="mb-6 mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {formatDay(new Date())}
            </Text>
            <Text className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
              Salut, {user?.name ?? 'Utilisateur'} 👋
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/stats')}
            className="rounded-full bg-slate-100 px-4 py-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Voir les statistiques"
            hitSlop={8}
          >
            <Text className="text-xs font-semibold text-slate-600">Stats</Text>
          </Pressable>
        </View>

        {/* Card Aperçu - Style moderne avec ombres et bordures légères */}
        <View className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-100">
          <Text className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            Aperçu de la journée
          </Text>
          <View className="flex-row items-center">
            <DonutChart
              data={donutData.chartData}
              size={110}
              strokeWidth={14}
              centerLabel={`${donutData.todo}`}
              centerSubLabel="à faire"
            />
            <View className="ml-6 flex-1 gap-y-2">
              {donutData.chartData.map((d) => (
                <View key={d.label} className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="mr-2.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <Text className="text-sm text-slate-600">{d.label}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-slate-900">{d.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Section: En retard */}
        {overdueCount > 0 ? (
          <View className="mb-8">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold tracking-tight text-rose-500">En retard</Text>
                <View className="rounded-full bg-rose-50 px-2 py-0.5">
                  <Text className="text-xs font-bold text-rose-600">{overdueCount}</Text>
                </View>
              </View>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(tabs)/tasks', params: { filter: 'overdue' } })
                }
                accessibilityRole="button"
                accessibilityLabel="Voir toutes les tâches en retard"
              >
                <Text className="text-xs font-semibold text-slate-500">Voir tout →</Text>
              </Pressable>
            </View>
            <View className="gap-y-2">{overdue.map(renderTask)}</View>
          </View>
        ) : null}

        {/* Section: Reportées */}
        {reportedCount > 0 ? (
          <View className="mb-8">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold tracking-tight text-amber-500">Reportées</Text>
                <View className="rounded-full bg-amber-50 px-2 py-0.5">
                  <Text className="text-xs font-bold text-amber-600">{reportedCount}</Text>
                </View>
              </View>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(tabs)/tasks', params: { filter: 'reported' } })
                }
                accessibilityRole="button"
                accessibilityLabel="Voir toutes les tâches reportées"
              >
                <Text className="text-xs font-semibold text-slate-500">Voir tout →</Text>
              </Pressable>
            </View>
            <View className="gap-y-2">{reportedPreview.map(renderTask)}</View>
          </View>
        ) : null}

        {/* Section: Prioritaires */}
        <View className="mb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold tracking-tight text-slate-900">Prioritaires</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/upcoming')}
              accessibilityRole="button"
              accessibilityLabel="Voir les tâches du jour"
            >
              <Text className="text-xs font-semibold text-slate-500">Voir tout →</Text>
            </Pressable>
          </View>
          {important.length > 0 ? (
            <View className="gap-y-2">{important.map(renderTask)}</View>
          ) : (
            <View className="rounded-2xl border border-dashed border-slate-200 py-6 items-center justify-center">
              <Text className="text-sm text-slate-400">Aucune tâche prioritaire</Text>
            </View>
          )}
        </View>

        {/* Empty State */}
        {overdue.length === 0 && important.length === 0 && overdueCount === 0 && reportedCount === 0 ? (
          <View className="mt-4">
            <EmptyState
              emoji="✨"
              title="Tout est à jour"
              message="Ajoute une tâche ou retrouve ton planning dans l'onglet Auj."
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}