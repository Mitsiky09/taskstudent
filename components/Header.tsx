import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: ReactNode;
}

/**
 * En-tête d'écran unique : même taille de titre, même sous-titre, même bouton
 * retour. Les écrans ne composent plus leur propre entête.
 */
export default function Header({ title, subtitle, showBack = false, right }: HeaderProps) {
  return (
    <View className="mb-6 mt-3 flex-row items-center">
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          className="-ml-2 mr-2 h-10 w-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text className="text-[28px] font-bold tracking-tight text-ink">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
