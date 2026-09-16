import { Pressable, Text } from 'react-native';
import { COLORS } from '@/constants';

export default function FloatingActionButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ajouter une tâche"
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full shadow-lg"
      style={{ backgroundColor: COLORS.primary }}
    >
      <Text className="text-3xl leading-9 text-white">＋</Text>
    </Pressable>
  );
}
