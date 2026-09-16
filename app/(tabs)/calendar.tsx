import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { router } from 'expo-router';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/EmptyState';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import { getCategory } from '@/constants';
import { theme } from '@/constants/theme';
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

/** Thème du calendrier aligné sur les tokens (une seule teinte de sélection). */
const CALENDAR_THEME = {
  calendarBackground: 'transparent',
  todayTextColor: theme.colors.primary,
  arrowColor: theme.colors.textSecondary,
  monthTextColor: theme.colors.text,
  textDayFontSize: 14,
  textDayHeaderFontSize: 12,
  textMonthFontSize: 16,
  textSectionTitleColor: theme.colors.textSecondary,
  textDisabledColor: theme.colors.textMuted,
  selectedDayBackgroundColor: theme.colors.primary,
  selectedDayTextColor: theme.colors.onPrimary,
};

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
        selectedColor: theme.colors.primary,
      },
    };
  }, [tasks, selected, settings.categories]);

  const dayTasks = useMemo(() => sortTasks(tasksDueOn(tasks, selected), 'date'), [tasks, selected]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 150 }}>
        <Header title="Agenda" />

        <Card padded={false} className="mb-6 p-2">
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(day) => setSelected(day.dateString)}
            firstDay={1}
            theme={CALENDAR_THEME}
            style={{ backgroundColor: 'transparent' }}
          />
        </Card>

        <SectionHeader title={formatDay(fromDateKey(selected))} className="mt-2" />

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
          <EmptyState emoji="🗓️" title="Aucune tâche ce jour" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
