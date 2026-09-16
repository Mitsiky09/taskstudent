import { Text, View } from 'react-native';
import { Subject } from '@/types';

/**
 * Mention de catégorie dans une liste : point coloré + nom discret.
 *
 * L'ancienne pastille à fond teinté occupait toute une ligne de la carte pour
 * une information secondaire ; la couleur de la catégorie suffit à la
 * reconnaître, le nom reste lisible sans attirer l'œil.
 */
export default function SubjectTag({
  category,
  className = '',
}: {
  category?: Subject;
  className?: string;
}) {
  if (!category) return null;
  return (
    <View className={`flex-row items-center ${className}`}>
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
      <Text className="ml-1.5 text-[13px] text-faint" numberOfLines={1}>
        {category.name}
      </Text>
    </View>
  );
}
