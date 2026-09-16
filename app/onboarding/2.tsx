import { router } from 'expo-router';
import OnboardingSlide from '@/components/OnboardingSlide';
import { completeOnboarding } from '@/lib/onboarding';

export default function OnboardingStepTwo() {
  return (
    <OnboardingSlide
      step={2}
      emoji="⚡"
      title="Ajoute une tâche en quelques secondes"
      text="Titre, date, priorité : comme sur Todoist, c'est rapide et simple."
      onNext={() => router.push('/onboarding/3')}
      onSkip={() => completeOnboarding().then(() => router.replace('/auth/login'))}
    />
  );
}
