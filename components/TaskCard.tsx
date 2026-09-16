import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getCategory } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { addDays, formatShortDate, formatTime } from '@/lib/date';
import { isOverdue, isReported } from '@/lib/tasks';
import { Task } from '@/types';
import PriorityDot from './PriorityDot';
import SubjectTag from './SubjectTag';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggle?: () => void;
  readOnly?: boolean;
}

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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tâche ${task.title}`}
      className="mb-3 flex-row rounded-2xl bg-white p-4 shadow-sm"
    >
      {readOnly ? null : (
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed }}
          accessibilityLabel={completed ? 'Marquer comme à faire' : 'Marquer comme terminée'}
          className={`mr-3 mt-1 h-6 w-6 items-center justify-center rounded-full border-2 ${
            completed ? '' : 'border-gray-300'
          }`}
          style={completed ? { borderColor: COLORS.primary, backgroundColor: COLORS.primary } : undefined}
        >
          <Text className="text-xs text-white">{completed ? '✓' : ''}</Text>
        </Pressable>
      )}

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-1 text-base font-semibold ${
              completed ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {task.title}
          </Text>
          <PriorityDot priority={task.priority} />
        </View>

        <View className="mb-2 mt-1 flex-row items-center">
          <Text className={`text-sm ${late ? 'font-semibold text-red-500' : 'text-gray-500'}`}>
            {formatShortDate(due)} · {formatTime(due)}
            {task.durationMinutes ? ` · ${task.durationMinutes} min` : ''}
          </Text>
          {late ? (
            <View className="ml-2 rounded-full bg-red-50 px-2 py-0.5">
              <Text className="text-xs font-semibold text-red-500">En retard</Text>
            </View>
          ) : null}
          {reported && !late ? (
            <View className="ml-2 rounded-full bg-amber-50 px-2 py-0.5">
              <Text className="text-xs font-semibold text-amber-600">Reporté</Text>
            </View>
          ) : null}
          {readOnly ? null : (
            <Pressable
              onPress={report}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Reporter cette tâche"
              className="ml-auto pl-2"
            >
              <Ionicons name="calendar-outline" size={15} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        <View className="flex-row items-center">
          <SubjectTag category={category} />
          {task.subtasks.length > 0 ? (
            <Text className="ml-2 text-xs text-gray-400">
              {doneSubtasks}/{task.subtasks.length} sous-tâches
            </Text>
          ) : null}
          {task.repeat !== 'none' ? (
            <Ionicons name="repeat-outline" size={14} color="#94a3b8" style={{ marginLeft: 6 }} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
