import { ReactNode } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { surfaceStyles, theme } from '@/constants/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  /** `muted` : sur une carte blanche. `surface` : directement sur le fond. */
  variant?: 'muted' | 'surface';
  /** Icône à gauche du champ (recherche). */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Élément à droite du champ (bouton d'effacement). */
  right?: ReactNode;
  error?: string | null;
  className?: string;
  containerClassName?: string;
}

/**
 * Champ de saisie unique : même hauteur, même rayon, même couleur de
 * placeholder et message d'erreur au même endroit sur tous les écrans.
 */
export default function TextField({
  label,
  variant = 'muted',
  icon,
  right,
  error,
  className = '',
  containerClassName = '',
  style,
  ...input
}: TextFieldProps) {
  const shape = variant === 'muted' ? surfaceStyles.field : surfaceStyles.fieldOnCanvas;
  const decorated = Boolean(icon || right);

  const field = decorated ? (
    <View className={`flex-row items-center ${shape} ${className}`}>
      {icon ? <Ionicons name={icon} size={18} color={theme.colors.icon} /> : null}
      <TextInput
        placeholderTextColor={theme.colors.placeholder}
        className={`h-full flex-1 text-[15px] text-ink ${icon ? 'ml-2.5' : ''}`}
        style={style}
        {...input}
      />
      {right}
    </View>
  ) : (
    <TextInput
      placeholderTextColor={theme.colors.placeholder}
      className={`${shape} ${className}`}
      style={style}
      {...input}
    />
  );

  return (
    <View className={containerClassName}>
      {label ? <Text className="mb-1.5 text-[13px] font-medium text-soft">{label}</Text> : null}
      {field}
      {error ? <Text className="mt-1.5 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

/** Bouton d'effacement réutilisable dans un champ. */
export function ClearButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Effacer"
    >
      <Ionicons name="close-circle" size={18} color={theme.colors.icon} />
    </Pressable>
  );
}
