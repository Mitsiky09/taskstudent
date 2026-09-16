import { View } from 'react-native';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/constants';
import { Priority } from '@/types';

export default function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Priorité ${PRIORITY_LABELS[priority].toLowerCase()}`}
      className="h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: PRIORITY_COLORS[priority] }}
    />
  );
}
