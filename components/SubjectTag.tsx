import { Text, View } from 'react-native';
import { Subject } from '@/types';
import { withAlpha } from '@/constants/theme';

/** Étiquette de catégorie : fond teinté dérivé de la couleur de la catégorie. */
export default function SubjectTag({ category }: { category?: Subject }) {
  if (!category) return null;
  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: withAlpha(category.color, 0.14) }}
    >
      <Text className="text-xs font-semibold" style={{ color: category.color }}>
        {category.name}
      </Text>
    </View>
  );
}
