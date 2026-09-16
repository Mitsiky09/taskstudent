import { Text, View } from 'react-native';
import { shadows } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  emoji?: string;
}

/** État vide : même pastille, mêmes typographies sur tous les écrans. */
export default function EmptyState({ title, message, emoji = '✨' }: EmptyStateProps) {
  return (
    <View className="items-center px-8 py-12" accessibilityRole="summary">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full border border-line-soft bg-white"
        style={shadows.card}
      >
        <Text className="text-3xl">{emoji}</Text>
      </View>
      <Text className="text-center text-lg font-bold tracking-tight text-ink">{title}</Text>
      {message ? <Text className="mt-1.5 text-center text-sm text-muted">{message}</Text> : null}
    </View>
  );
}
