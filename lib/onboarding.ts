import { STORAGE_KEYS } from '@/constants';
import { remove, writeJSON } from '@/lib/storage';

export function completeOnboarding(): Promise<void> {
  return writeJSON(STORAGE_KEYS.onboarding, true);
}

export function resetOnboarding(): Promise<void> {
  return remove(STORAGE_KEYS.onboarding);
}
