import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { shadows } from '@/constants/theme';

export interface SegmentItem<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  items: SegmentItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Sélecteur à segments (tri, statut, période) : le même contrôle partout,
 * avec la même ombre sur l'option active.
 */
export default function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className = '',
  style,
}: SegmentedControlProps<T>) {
  return (
    <View className={`flex-row rounded-2xl bg-surface-muted p-1 ${className}`} style={style}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            className={`flex-1 items-center justify-center rounded-xl py-3 ${selected ? 'bg-white' : ''}`}
            style={selected ? shadows.card : undefined}
          >
            <Text
              className={`text-sm ${selected ? 'font-semibold text-ink' : 'font-medium text-muted'}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
