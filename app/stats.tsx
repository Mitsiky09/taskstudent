import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import FilterBar from '@/components/FilterBar';
import { BarChart, DonutChart } from '@/components/charts';
import { getCategory } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  formatRange,
  formatShortDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '@/lib/date';
import { buildTrend, statsForRange } from '@/lib/tasks';

type Period = 'week' | 'month' | 'custom';
type PickerTarget = 'start' | 'end';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'custom', label: 'Personnalisée' },
];

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="mt-1 text-3xl font-bold" style={{ color }}>
        {value}
      </Text>
      {sub ? <Text className="mt-0.5 text-xs text-gray-400">{sub}</Text> : null}
    </View>
  );
}

export default function Stats() {
  const { tasks } = useTasks();
  const { settings } = useSettings();
  const now = useMemo(() => new Date(), []);

  const [period, setPeriod] = useState<Period>('week');
  const [customStart, setCustomStart] = useState(() => addDays(now, -6));
  const [customEnd, setCustomEnd] = useState(() => now);
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  const range = useMemo(() => {
    if (period === 'week') {
      return { start: startOfWeek(now), end: endOfWeek(now), label: 'Cette semaine' };
    }
    if (period === 'month') {
      return { start: startOfMonth(now), end: endOfMonth(now), label: 'Ce mois-ci' };
    }
    const start = customStart <= customEnd ? startOfDay(customStart) : startOfDay(customEnd);
    const end = customStart <= customEnd ? endOfDay(customEnd) : endOfDay(customStart);
    return { start, end, label: formatRange(start, end) };
  }, [period, customStart, customEnd, now]);

  const stats = useMemo(() => statsForRange(tasks, range.start, range.end), [tasks, range]);
  const trend = useMemo(() => buildTrend(tasks, range.start, range.end), [tasks, range]);

  const hasData =
    stats.totalDue > 0 || trend.some((d) => d.count > 0);
  const donutData = stats.bySubject.map((entry) => {
    const subject = getCategory(settings.categories, entry.subjectId);
    return { label: subject.name, value: entry.total, color: subject.color };
  });

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <Header title="Statistiques" subtitle={range.label} showBack />

      <FilterBar items={PERIODS} value={period} onChange={setPeriod} />

      {period === 'custom' ? (
        <>
          <View className="mb-4 flex-row items-center gap-2">
            <Pressable
              onPress={() => setPicker('start')}
              accessibilityRole="button"
              accessibilityLabel="Choisir la date de début"
              className="h-11 flex-1 items-center justify-center rounded-xl bg-white"
            >
              <Text className="font-semibold text-indigo-600">Du {formatShortDate(customStart)}</Text>
            </Pressable>
            <Text className="text-gray-400">au</Text>
            <Pressable
              onPress={() => setPicker('end')}
              accessibilityRole="button"
              accessibilityLabel="Choisir la date de fin"
              className="h-11 flex-1 items-center justify-center rounded-xl bg-white"
            >
              <Text className="font-semibold text-indigo-600">au {formatShortDate(customEnd)}</Text>
            </Pressable>
          </View>
          {picker !== null && Platform.OS === 'android' ? (
            <DateTimePicker
              value={picker === 'start' ? customStart : customEnd}
              mode="date"
              maximumDate={new Date()}
              onChange={(event, date) => {
                setPicker(null);
                if (event.type === 'set' && date) {
                  if (picker === 'start') setCustomStart(startOfDay(date));
                  else setCustomEnd(startOfDay(date));
                }
              }}
            />
          ) : null}
        </>
      ) : null}

      {!hasData ? (
        <EmptyState
          emoji="📊"
          title="Pas encore de données"
          message="Crée quelques tâches pour voir tes statistiques sur cette période."
        />
      ) : (
        <>
          <View className="mb-3 flex-row gap-3">
            <StatCard label="Terminées" value={`${stats.completed}`} color="#22c55e" />
            <StatCard label="En retard" value={`${stats.overdue}`} color="#ef4444" />
          </View>
          <View className="mb-3 flex-row gap-3">
            <StatCard label="À faire" value={`${stats.active}`} color="#0ea5e9" />
            <StatCard
              label="Taux de complétion"
              value={`${stats.completionRate} %`}
              color="#4f46e5"
              sub={`sur ${stats.totalDue} tâche${stats.totalDue > 1 ? 's' : ''}`}
            />
          </View>

          <View className="mb-4 rounded-2xl bg-white p-5">
            <Text className="mb-1 text-sm font-bold text-gray-900">
              Tâches terminées, jour par jour
            </Text>
            <Text className="mb-4 text-xs text-gray-400">
              {period === 'week' ? 'vue semaine' : period === 'month' ? 'vue mois' : 'vue personnalisée'}
            </Text>
            <BarChart data={trend.map((d) => ({ label: d.label, value: d.count }))} />
          </View>

          <View className="rounded-2xl bg-white p-5">
            <Text className="mb-4 text-sm font-bold text-gray-900">Répartition par matière</Text>
            {donutData.length === 0 ? (
              <Text className="py-4 text-center text-sm text-gray-400">
                Aucune tâche due sur cette période.
              </Text>
            ) : (
              <View className="flex-row items-center">
                <DonutChart
                  data={donutData}
                  centerLabel={`${stats.completionRate}%`}
                  centerSubLabel="terminées"
                />
                <View className="ml-4 flex-1">
                  {donutData.map((d) => (
                    <View key={d.label} className="mb-3 flex-row items-center">
                      <View className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                        {d.label}
                      </Text>
                      <Text className="text-sm font-semibold text-gray-900">{d.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}