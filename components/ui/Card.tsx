import { ReactNode } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { shadows, surfaceStyles } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  /** `panel` : grande carte (24 px). `card` : carte de liste (16 px). */
  variant?: 'panel' | 'card';
  padded?: boolean;
  onPress?: () => void;
  /** Libellé d'accessibilité, requis dès que la carte est cliquable. */
  accessibilityLabel?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Surface blanche unique de l'application : même bordure, même rayon et même
 * ombre partout. Les écrans ne doivent plus recomposer ces styles à la main.
 */
export default function Card({
  children,
  variant = 'panel',
  padded = true,
  onPress,
  accessibilityLabel,
  className = '',
  style,
}: CardProps) {
  const shape = variant === 'panel' ? surfaceStyles.card : surfaceStyles.listItem;
  const padding = padded ? (variant === 'panel' ? 'p-5' : 'p-4') : '';
  const classes = `${shape} ${padding} ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={`${classes} active:opacity-90`}
        style={[shadows.card, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={classes} style={[shadows.card, style]}>
      {children}
    </View>
  );
}
