import { Pressable, Text } from 'react-native';
import { COLORS } from '@/constants';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
}

const BACKGROUNDS: Record<string, string> = {
  primary: '',
  dark: 'bg-gray-900',
  ghost: 'bg-transparent',
  danger: 'bg-transparent',
};

const LABELS: Record<string, string> = {
  primary: 'text-white',
  dark: 'text-white',
  ghost: 'text-gray-500',
  danger: 'text-red-500',
};

export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  className = '',
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={variant === 'primary' ? { backgroundColor: COLORS.primary } : undefined}
      className={`h-12 items-center justify-center rounded-xl ${BACKGROUNDS[variant]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
    >
      <Text className={`font-semibold ${LABELS[variant]}`}>{label}</Text>
    </Pressable>
  );
}
