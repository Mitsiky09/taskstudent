import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Libellé d'accessibilité, obligatoire : le bouton n'a pas de texte. */
  label: string;
  color?: string;
  /** `outline` : pastille blanche cerclée. `bare` : icône seule. */
  variant?: 'outline' | 'bare';
  size?: number;
}

/** Bouton d'icône : la même cible tactile et le même cerclage partout. */
export default function IconButton({
  icon,
  onPress,
  label,
  color = theme.colors.textSecondary,
  variant = 'outline',
  size = 20,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${
        variant === 'outline' ? 'border border-line bg-white' : ''
      }`}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}
