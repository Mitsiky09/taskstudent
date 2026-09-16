import { ScrollView } from 'react-native';
import Chip from '@/components/ui/Chip';

export interface FilterItem<T extends string> {
  value: T;
  label: string;
}

interface FilterBarProps<T extends string> {
  items: FilterItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Barre de filtres horizontale, construite sur la pastille partagée. */
export default function FilterBar<T extends string>({
  items,
  value,
  onChange,
  className = 'mb-4',
}: FilterBarProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={className}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {items.map((item) => (
        <Chip
          key={item.value}
          label={item.label}
          selected={item.value === value}
          onPress={() => onChange(item.value)}
        />
      ))}
    </ScrollView>
  );
}
