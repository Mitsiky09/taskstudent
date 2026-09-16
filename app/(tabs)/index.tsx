import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { DonutChart } from '@/components/charts';
import EmptyState from '@/components/EmptyState';
import TaskCard from '@/components/TaskCard';
import { STATUS_COLORS } from '@/constants';
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

export default function Home() {
  const { tasks, toggleTask } = useTasks();
  const { user } = useSession();

  // Regroupement des données de tâches
  const { dueToday, overdue, overdueCount, important, reportedCount, reportedPreview } =
    useMemo(() => {
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
      chartData: [
        { label: 'À faire', value: todo, color: STATUS_COLORS.todo },
        { label: 'Reportées', value: reported, color: STATUS_COLORS.reported },
        { label: 'Terminées', value: done, color: STATUS_COLORS.done },
        { label: 'En retard', value: overdue, color: STATUS_COLORS.overdue },
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

  const isEmpty =
    overdue.length === 0 && important.length === 0 && overdueCount === 0 && reportedCount === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* En-tête */}
        <View className="mb-6 mt-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-wider text-faint">
              {formatDay(new Date())}
            </Text>
            <Text className="mt-0.5 text-[28px] font-bold tracking-tight text-ink">
              Salut, {user?.name ?? 'Utilisateur'} 👋
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/stats')}
            className="rounded-full border border-line bg-white px-4 py-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Voir les statistiques"
            hitSlop={8}
          >
            <Text className="text-xs font-semibold text-soft">Stats</Text>
          </Pressable>
        </View>

        {/* Aperçu de la journée */}
        <Card className="mb-7">
          <Text className="mb-4 text-xs font-semibold uppercase tracking-wider text-faint">
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
                    <View
                      className="mr-2.5 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <Text className="text-sm text-soft">{d.label}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-ink">{d.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* En retard */}
        {overdueCount > 0 ? (
          <View className="mb-7">
            <SectionHeader
              title="En retard"
              count={overdueCount}
              tone="danger"
              action={{
                label: 'Voir tout',
                label2: 'Voir toutes les tâches en retard',
                onPress: () =>
                  router.push({ pathname: '/(tabs)/tasks', params: { filter: 'overdue' } }),
              }}
            />
            <View>{overdue.map(renderTask)}</View>
          </View>
        ) : null}

        {/* Reportées */}
        {reportedCount > 0 ? (
          <View className="mb-7">
            <SectionHeader
              title="Reportées"
              count={reportedCount}
              tone="warning"
              action={{
                label: 'Voir tout',
                label2: 'Voir toutes les tâches reportées',
                onPress: () =>
                  router.push({ pathname: '/(tabs)/tasks', params: { filter: 'reported' } }),
              }}
            />
            <View>{reportedPreview.map(renderTask)}</View>
          </View>
        ) : null}

        {/* Prioritaires */}
        <View className="mb-7">
          <SectionHeader
            title="Prioritaires"
            action={{
              label: 'Voir tout',
              label2: 'Voir les tâches du jour',
              onPress: () => router.push('/(tabs)/upcoming'),
            }}
          />
          {important.length > 0 ? (
            <View>{important.map(renderTask)}</View>
          ) : (
            <View className="items-center justify-center rounded-2xl border border-dashed border-line py-6">
              <Text className="text-sm text-faint">Aucune tâche prioritaire</Text>
            </View>
          )}
        </View>

        {isEmpty ? (
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
