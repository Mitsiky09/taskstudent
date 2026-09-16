import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, withAlpha } from '@/constants/theme';

export type ChipTone = 'solid' | 'soft';

interface ChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  /** Couleur propre de l'élément (catégorie, priorité). */
  color?: string;
  /** `solid` : fond plein à la sélection. `soft` : fond teinté permanent. */
  tone?: ChipTone;
  closable?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pastille unique de l'application : filtres, catégories, étiquettes actives.
 * La pastille colorée et l'état sélectionné dérivent de la même couleur, ce qui
 * évite les variantes codées écran par écran.
 */
export default function Chip({
  label,
  onPress,
  selected = false,
  color,
  tone = 'solid',
  closable = false,
  icon,
  size = 'md',
  className = '',
  style,
}: ChipProps) {
  const accent = color ?? theme.colors.primary;
  const soft = tone === 'soft';
  const filled = !soft && selected;
  const height = size === 'sm' ? 'h-9' : 'h-10';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      className={`${height} flex-row items-center gap-1.5 rounded-full px-4 active:opacity-80 ${
        soft || filled ? '' : 'border border-line bg-white'
      } ${className}`}
      style={[
        soft
          ? { backgroundColor: withAlpha(accent, 0.14) }
          : filled
            ? { backgroundColor: accent }
            : undefined,
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={filled ? theme.colors.onPrimary : accent} />
      ) : null}
      {color && !filled ? (
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
      <Text
        className={`text-sm ${filled ? 'font-semibold text-white' : soft ? 'font-semibold' : 'font-medium text-soft'}`}
        style={soft ? { color: accent } : undefined}
        numberOfLines={1}
      >
        {label}
      </Text>
      {closable ? (
        <Ionicons
          name="close"
          size={14}
          color={filled ? theme.colors.onPrimary : soft ? accent : theme.colors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}
