import { Pressable, Text, View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import { theme } from '@/constants/theme';

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

/** Diapositive d'introduction : même mise en page et mêmes couleurs que l'app. */
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
    <View className="flex-1 bg-canvas p-5">
      <View className="flex-row items-center pt-14">
        <View className="flex-1 flex-row justify-center gap-2">
          {STEPS.map((index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${index === step ? 'w-8' : 'w-2 bg-line'}`}
              style={index === step ? { backgroundColor: theme.colors.primary } : undefined}
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
            <Text className="text-sm text-faint">Passer</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="mb-10 text-8xl">{emoji}</Text>
        <Text className="text-center text-3xl font-bold tracking-tight text-ink">{title}</Text>
        <Text className="mt-4 text-center text-base leading-6 text-muted">{text}</Text>
      </View>

      <PrimaryButton label={button} onPress={onNext} />
    </View>
  );
}
