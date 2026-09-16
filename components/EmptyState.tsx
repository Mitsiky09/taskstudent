import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  message?: string;
  emoji?: string;
}

export default function EmptyState({ title, message, emoji = '✨' }: EmptyStateProps) {
  return (
    <View className="items-center px-8 py-12" accessibilityRole="summary">
      <Text className="mb-3 text-5xl">{emoji}</Text>
      <Text className="text-center text-lg font-bold text-gray-900">{title}</Text>
      {message ? <Text className="mt-2 text-center text-gray-500">{message}</Text> : null}
    </View>
  );
}
