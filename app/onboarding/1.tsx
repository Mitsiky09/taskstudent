import { router } from 'expo-router';
import OnboardingSlide from '@/components/OnboardingSlide';
import { completeOnboarding } from '@/lib/onboarding';

export default function OnboardingStepOne() {
  return (
    <OnboardingSlide
      step={1}
      emoji="🧘"
      title="Organise ta vie sans stress"
      text="Toutes tes tâches et échéances, clairement regroupées au même endroit."
      onNext={() => router.push('/onboarding/2')}
      onSkip={() => completeOnboarding().then(() => router.replace('/auth/login'))}
    />
  );
}
