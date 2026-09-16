import { router } from 'expo-router';
import OnboardingSlide from '@/components/OnboardingSlide';
import { completeOnboarding } from '@/lib/onboarding';

export default function OnboardingStepThree() {
  return (
    <OnboardingSlide
      step={3}
      emoji="📦"
      title="Archive tes tâches terminées"
      text="Garde une trace de tes progrès sans encombrer ton quotidien."
      button="Commencer"
      onNext={() => completeOnboarding().then(() => router.replace('/auth/login'))}
    />
  );
}
