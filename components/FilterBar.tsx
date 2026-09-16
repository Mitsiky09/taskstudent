import { Pressable, ScrollView, Text } from 'react-native';
import { COLORS } from '@/constants';

export interface FilterItem<T extends string> {
  value: T;
  label: string;
}

interface FilterBarProps<T extends string> {
  items: FilterItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function FilterBar<T extends string>({ items, value, onChange }: FilterBarProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4 max-h-12"
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Filtre ${item.label}`}
            className={`h-10 justify-center rounded-full px-4 ${selected ? '' : 'bg-gray-100'}`}
            style={selected ? { backgroundColor: COLORS.primary } : undefined}
          >
            <Text className={selected ? 'font-semibold text-white' : 'text-gray-600'}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
