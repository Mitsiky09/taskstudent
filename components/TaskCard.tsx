import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import PriorityDot from './PriorityDot';
import SubjectTag from './SubjectTag';
import { getCategory } from '@/constants';
import { theme } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { addDays, formatDueLabel } from '@/lib/date';
import { isOverdue, isReported } from '@/lib/tasks';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggle?: () => void;
  readOnly?: boolean;
}

/**
 * Carte de tâche : deux lignes, et rien d'autre.
 *
 * Hiérarchie retenue après retour utilisateur (« trop surchargé ») :
 *
 * 1. **Ligne 1** — case à cocher, titre, point de priorité. Le point n'est
 *    affiché que pour la priorité haute : P3 est la valeur par défaut à la
 *    création, le montrer sur chaque carte n'apporte aucune information.
 * 2. **Ligne 2** — catégorie (point coloré + nom discret) et échéance
 *    compacte. L'état passe par la couleur de l'échéance : rouge si retard,
 *    ambre si reportée. Les badges « En retard » / « Reporté » répétaient
 *    cette information.
 *
 * Retiré de la carte : la durée estimée (`60 min`), l'icône « reporter »
 * permanente (remplacée par un appui long ; l'écran de détail conserve ses
 * raccourcis) et la pastille de catégorie à fond teinté. Ne restent à droite
 * que deux indicateurs utiles : la répétition et l'avancement des sous-tâches.
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

  const dueClass = late
    ? 'font-semibold text-danger'
    : reported
      ? 'font-medium text-warning-600'
      : 'text-muted';

  return (
    <Card
      variant="card"
      onPress={onPress}
      onLongPress={readOnly ? undefined : report}
      accessibilityLabel={`Tâche ${task.title}, ${formatDueLabel(due)}`}
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
          {task.priority === 'high' ? (
            <View className="ml-2">
              <PriorityDot priority={task.priority} />
            </View>
          ) : null}
        </View>

        <View className="mt-1 flex-row items-center">
          <SubjectTag category={category} className="shrink" />
          <Text className="mx-1.5 text-[13px] text-faint">·</Text>
          <Text className={`shrink-0 text-[13px] ${dueClass}`} numberOfLines={1}>
            {formatDueLabel(due)}
          </Text>

          <View className="ml-auto flex-row items-center gap-2 pl-2">
            {task.repeat !== 'none' ? (
              <Ionicons name="repeat-outline" size={13} color={theme.colors.icon} />
            ) : null}
            {task.subtasks.length > 0 ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="checkbox-outline" size={13} color={theme.colors.icon} />
                <Text className="text-xs text-faint">
                  {doneSubtasks}/{task.subtasks.length}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}
