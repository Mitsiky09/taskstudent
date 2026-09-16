import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { shadows } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'soft' | 'dark' | 'ghost' | 'danger';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const BACKGROUNDS: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  soft: 'bg-primary-50',
  dark: 'bg-ink',
  ghost: 'bg-transparent',
  danger: 'bg-danger-50',
};

const LABELS: Record<ButtonVariant, string> = {
  primary: 'text-white',
  soft: 'text-primary',
  dark: 'text-white',
  ghost: 'text-muted',
  danger: 'text-danger-600',
};

/**
 * Bouton principal de l'application : une seule hauteur, un seul rayon et
 * cinq variantes couvrant tous les cas (action, secondaire, discret,
 * destructrice).
 */
export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  className = '',
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`h-14 items-center justify-center rounded-2xl ${BACKGROUNDS[variant]} ${
        disabled ? 'opacity-50' : 'active:opacity-90'
      } ${className}`}
      style={[variant === 'primary' && !disabled ? shadows.raised : undefined, style]}
    >
      <Text className={`text-base font-semibold ${LABELS[variant]}`}>{label}</Text>
    </Pressable>
  );
}
