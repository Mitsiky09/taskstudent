import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Card from '@/components/ui/Card';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import FilterBar from '@/components/FilterBar';
import { BarChart, DonutChart } from '@/components/charts';
import { getCategory, STATUS_COLORS } from '@/constants';
import { theme } from '@/constants/theme';
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

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <Card variant="card" className="flex-1">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="mt-1 text-3xl font-bold" style={{ color }}>
        {value}
      </Text>
      {sub ? <Text className="mt-0.5 text-xs text-faint">{sub}</Text> : null}
    </Card>
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

  const hasData = stats.totalDue > 0 || trend.some((d) => d.count > 0);
  const donutData = stats.bySubject.map((entry) => {
    const subject = getCategory(settings.categories, entry.subjectId);
    return { label: subject.name, value: entry.total, color: subject.color };
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        <Header title="Statistiques" subtitle={range.label} showBack />

        <FilterBar items={PERIODS} value={period} onChange={setPeriod} />

        {period === 'custom' ? (
          <>
            <View className="mb-4 flex-row items-center gap-2">
              <Pressable
                onPress={() => setPicker('start')}
                accessibilityRole="button"
                accessibilityLabel="Choisir la date de début"
                className="h-12 flex-1 items-center justify-center rounded-2xl border border-line bg-white active:opacity-80"
              >
                <Text className="text-sm font-semibold text-primary">
                  Du {formatShortDate(customStart)}
                </Text>
              </Pressable>
              <Text className="text-sm text-faint">au</Text>
              <Pressable
                onPress={() => setPicker('end')}
                accessibilityRole="button"
                accessibilityLabel="Choisir la date de fin"
                className="h-12 flex-1 items-center justify-center rounded-2xl border border-line bg-white active:opacity-80"
              >
                <Text className="text-sm font-semibold text-primary">
                  {formatShortDate(customEnd)}
                </Text>
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
              <StatCard label="Terminées" value={`${stats.completed}`} color={STATUS_COLORS.done} />
              <StatCard
                label="En retard"
                value={`${stats.overdue}`}
                color={STATUS_COLORS.overdue}
              />
            </View>
            <View className="mb-3 flex-row gap-3">
              <StatCard label="À faire" value={`${stats.active}`} color={theme.colors.info} />
              <StatCard
                label="Taux de complétion"
                value={`${stats.completionRate} %`}
                color={theme.colors.primary}
                sub={`sur ${stats.totalDue} tâche${stats.totalDue > 1 ? 's' : ''}`}
              />
            </View>

            <Card className="mb-4">
              <Text className="mb-1 text-base font-semibold text-ink">
                Tâches terminées, jour par jour
              </Text>
              <Text className="mb-4 text-xs text-faint">
                {period === 'week'
                  ? 'vue semaine'
                  : period === 'month'
                    ? 'vue mois'
                    : 'vue personnalisée'}
              </Text>
              <BarChart data={trend.map((d) => ({ label: d.label, value: d.count }))} />
            </Card>

            <Card>
              <Text className="mb-4 text-base font-semibold text-ink">
                Répartition par catégorie
              </Text>
              {donutData.length === 0 ? (
                <Text className="py-4 text-center text-sm text-faint">
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
                        <View
                          className="mr-2 h-3 w-3 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <Text className="flex-1 text-sm text-soft" numberOfLines={1}>
                          {d.label}
                        </Text>
                        <Text className="text-sm font-semibold text-ink">{d.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
