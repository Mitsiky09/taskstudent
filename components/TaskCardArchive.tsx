import { Alert, Pressable, Text, View } from 'react-native';
import { getCategory } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { formatShortDate } from '@/lib/date';
import { Task } from '@/types';
import PriorityDot from './PriorityDot';
import SubjectTag from './SubjectTag';

interface TaskCardArchiveProps {
  task: Task;
  onPress: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

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
    <View className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Tâche archivée ${task.title}`}
        className="p-4"
      >
        <View className="flex-row items-center">
          <Text numberOfLines={1} className="flex-1 text-base font-semibold text-gray-500">
            {task.title}
          </Text>
          <PriorityDot priority={task.priority} />
        </View>
        <View className="mt-2">
          <SubjectTag category={getCategory(settings.categories, task.subjectId)} />
        </View>
      </Pressable>

      <View className="flex-row items-center border-t border-gray-100 px-4 py-3">
        <Text className="flex-1 text-xs text-gray-400">
          {task.archivedAt
            ? `Archivée le ${formatShortDate(new Date(task.archivedAt))}`
            : 'Archivée'}
        </Text>
        <Pressable onPress={onRestore} accessibilityRole="button" hitSlop={8} className="mr-5">
          <Text className="font-semibold text-indigo-600">Restaurer</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} accessibilityRole="button" hitSlop={8}>
          <Text className="font-semibold text-red-500">Supprimer</Text>
        </Pressable>
      </View>
    </View>
  );
}
