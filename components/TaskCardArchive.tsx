import { Alert, Pressable, Text, View } from 'react-native';
import Card from '@/components/ui/Card';
import PriorityDot from './PriorityDot';
import SubjectTag from './SubjectTag';
import { getCategory } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { formatShortDate } from '@/lib/date';
import { Task } from '@/types';

interface TaskCardArchiveProps {
  task: Task;
  onPress: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

/** Carte d'une tâche archivée : même surface que les autres listes. */
export default function TaskCardArchive({
  task,
  onPress,
  onRestore,
  onDelete,
}: TaskCardArchiveProps) {
  const { settings } = useSettings();
  const confirmDelete = () =>
    Alert.alert('Supprimer définitivement ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <Card variant="card" padded={false} className="mb-2.5 overflow-hidden">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Tâche archivée ${task.title}`}
        className="p-4 active:opacity-80"
      >
        <View className="flex-row items-center">
          <Text numberOfLines={1} className="flex-1 text-[15px] font-semibold text-muted">
            {task.title}
          </Text>
          <PriorityDot priority={task.priority} />
        </View>
        <View className="mt-2">
          <SubjectTag category={getCategory(settings.categories, task.subjectId)} />
        </View>
      </Pressable>

      <View className="flex-row items-center border-t border-line-soft px-4 py-3">
        <Text className="flex-1 text-xs text-faint">
          {task.archivedAt
            ? `Archivée le ${formatShortDate(new Date(task.archivedAt))}`
            : 'Archivée'}
        </Text>
        <Pressable
          onPress={onRestore}
          accessibilityRole="button"
          hitSlop={8}
          className="mr-5 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-primary">Restaurer</Text>
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          hitSlop={8}
          className="active:opacity-70"
        >
          <Text className="text-sm font-semibold text-danger">Supprimer</Text>
        </Pressable>
      </View>
    </Card>
  );
}
