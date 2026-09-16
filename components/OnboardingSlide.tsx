import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/constants';

interface OnboardingSlideProps {
  step: number;
  emoji: string;
  title: string;
  text: string;
  button?: string;
  onNext: () => void;
  onSkip?: () => void;
}

const STEPS = [1, 2, 3];

export default function OnboardingSlide({
  step,
  emoji,
  title,
  text,
  button = 'Suivant',
  onNext,
  onSkip,
}: OnboardingSlideProps) {
  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-row items-center pt-14">
        <View className="flex-1 flex-row justify-center gap-2">
          {STEPS.map((index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${index === step ? 'w-8' : 'w-2 bg-gray-200'}`}
              style={index === step ? { backgroundColor: COLORS.primary } : undefined}
            />
          ))}
        </View>
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            hitSlop={8}
            className="absolute right-0 top-14"
          >
            <Text className="text-gray-400">Passer</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="mb-10 text-8xl">{emoji}</Text>
        <Text className="text-center text-3xl font-bold text-gray-900">{title}</Text>
        <Text className="mt-4 text-center text-base leading-6 text-gray-500">{text}</Text>
      </View>

      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        className="h-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: COLORS.primary }}
      >
        <Text className="font-semibold text-white">{button}</Text>
      </Pressable>
    </View>
  );
}
