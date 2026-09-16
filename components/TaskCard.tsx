import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import PriorityDot from './PriorityDot';
import SubjectTag from './SubjectTag';
import { getCategory } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { addDays, formatShortDate, formatTime } from '@/lib/date';
import { isOverdue, isReported } from '@/lib/tasks';
import { theme } from '@/constants/theme';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggle?: () => void;
  readOnly?: boolean;
}

/**
 * Carte de tâche : le même rendu dans toutes les listes (Accueil, Aujourd'hui,
 * Calendrier, Tâches). Les couleurs d'état viennent des tokens sémantiques.
 */
export default function TaskCard({ task, onPress, onToggle, readOnly = false }: TaskCardProps) {
  const { settings } = useSettings();
  const { reportTask } = useTasks();
  const category = getCategory(settings.categories, task.subjectId);
  const due = new Date(task.dueDate);
  const completed = task.status === 'completed';
  const late = isOverdue(task);
  const reported = isReported(task);
  const doneSubtasks = task.subtasks.filter((s) => s.isCompleted).length;

  const report = () => {
    Alert.alert('Reporter la tâche', 'Choisir une nouvelle échéance.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Demain', onPress: () => reportTask(task.id, addDays(due, 1)) },
      { text: 'Dans 3 jours', onPress: () => reportTask(task.id, addDays(due, 3)) },
      { text: 'Dans une semaine', onPress: () => reportTask(task.id, addDays(due, 7)) },
    ]);
  };

  return (
    <Card
      variant="card"
      onPress={onPress}
      accessibilityLabel={`Tâche ${task.title}`}
      className="mb-2.5 flex-row"
    >
      {readOnly ? null : (
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed }}
          accessibilityLabel={completed ? 'Marquer comme à faire' : 'Marquer comme terminée'}
          className={`mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full border-2 ${
            completed ? 'border-primary bg-primary' : 'border-line'
          }`}
        >
          {completed ? (
            <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />
          ) : null}
        </Pressable>
      )}

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[15px] font-semibold ${
              completed ? 'text-faint line-through' : 'text-ink'
            }`}
          >
            {task.title}
          </Text>
          <PriorityDot priority={task.priority} />
        </View>

        <View className="mb-2 mt-1 flex-row items-center">
          <Text
            className={`text-[13px] ${late ? 'font-semibold text-danger' : 'text-muted'}`}
            numberOfLines={1}
          >
            {formatShortDate(due)} · {formatTime(due)}
            {task.durationMinutes ? ` · ${task.durationMinutes} min` : ''}
          </Text>
          {late ? (
            <View className="ml-2 rounded-full bg-danger-50 px-2 py-0.5">
              <Text className="text-[11px] font-bold text-danger-600">En retard</Text>
            </View>
          ) : null}
          {reported && !late ? (
            <View className="ml-2 rounded-full bg-warning-50 px-2 py-0.5">
              <Text className="text-[11px] font-bold text-warning-600">Reporté</Text>
            </View>
          ) : null}
          {readOnly ? null : (
            <Pressable
              onPress={report}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Reporter cette tâche"
              className="ml-auto pl-2 active:opacity-70"
            >
              <Ionicons name="calendar-outline" size={15} color={theme.colors.icon} />
            </Pressable>
          )}
        </View>

        <View className="flex-row items-center">
          <SubjectTag category={category} />
          {task.subtasks.length > 0 ? (
            <Text className="ml-2 text-xs text-faint">
              {doneSubtasks}/{task.subtasks.length} sous-tâches
            </Text>
          ) : null}
          {task.repeat !== 'none' ? (
            <Ionicons
              name="repeat-outline"
              size={14}
              color={theme.colors.icon}
              style={{ marginLeft: 6 }}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}
