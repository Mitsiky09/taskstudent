import { Text, View } from 'react-native';
import { Subject } from '@/types';

export default function SubjectTag({ category }: { category?: Subject }) {
  if (!category) return null;
  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${category.color}18` }}
    >
      <Text className="text-xs font-medium" style={{ color: category.color }}>
        {category.name}
      </Text>
    </View>
  );
}