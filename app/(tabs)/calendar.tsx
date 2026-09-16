import { useMemo, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { router } from 'expo-router';
import EmptyState from '@/components/EmptyState';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { COLORS, getCategory } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { formatDay, fromDateKey, toDateKey } from '@/lib/date';
import { sortTasks, tasksDueOn, visibleTasks } from '@/lib/tasks';

LocaleConfig.locales.fr = {
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  monthNamesShort: [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  today: "aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

interface MarkedDate {
  dots: { key: string; color: string }[];
  selected?: boolean;
  selectedColor?: string;
}

export default function CalendarScreen() {
  const { tasks, toggleTask } = useTasks();
  const { settings } = useSettings();
  const [selected, setSelected] = useState(() => toDateKey(new Date()));

  const markedDates = useMemo(() => {
    const marks: Record<string, MarkedDate> = {};
    visibleTasks(tasks).forEach((task) => {
      // Clé de jour **locale** : `toISOString()` décalerait les tâches du soir
      // d'une journée dans les fuseaux positifs.
      const key = toDateKey(new Date(task.dueDate));
      const color = getCategory(settings.categories, task.subjectId).color;
      marks[key] ??= { dots: [] };
      if (!marks[key].dots.some((dot) => dot.key === task.subjectId)) {
        marks[key].dots.push({ key: task.subjectId, color });
      }
    });
    return {
      ...marks,
      [selected]: {
        ...(marks[selected] ?? { dots: [] }),
        selected: true,
        selectedColor: COLORS.primary,
      },
    };
  }, [tasks, selected, settings.categories]);

  const dayTasks = useMemo(() => sortTasks(tasksDueOn(tasks, selected), 'date'), [tasks, selected]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-50">
      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 150 }}>
        <Header title="Calendrier" />

        <Calendar
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={(day) => setSelected(day.dateString)}
          firstDay={1}
          theme={{ todayTextColor: COLORS.primary, arrowColor: COLORS.primary }}
          style={{ borderRadius: 16, paddingBottom: 8 }}
        />

        <Text className="mb-3 mt-6 text-lg font-bold capitalize text-gray-900">
          {formatDay(fromDateKey(selected))}
        </Text>

        {dayTasks.length > 0 ? (
          dayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onPress={() => router.push(`/task/${task.id}`)}
            />
          ))
        ) : (
          <EmptyState emoji="🗓️" title="Aucun devoir ce jour" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
