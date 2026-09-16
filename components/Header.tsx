import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}

export default function Header({ title, subtitle, showBack = false, right }: HeaderProps) {
  return (
    <View className="mb-5 mt-2 flex-row items-center">
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          className="mr-3"
        >
          <Text className="text-3xl leading-8 text-gray-700">‹</Text>
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
        {subtitle ? <Text className="mt-1 text-gray-500">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
