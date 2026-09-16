import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { COLORS, STORAGE_KEYS } from '@/constants';
import { useSession } from '@/context/SessionContext';
import { readJSON } from '@/lib/storage';

/**
 * Écran d'amorçage et **garde de navigation** : il décide de la destination
 * en fonction de l'état réel de l'application (onboarding vu, session
 * ouverte). C'est le seul endroit qui redirige vers les onglets, ce qui évite
 * qu'un utilisateur déconnecté retombe dessus au redémarrage.
 */
export default function Boot() {
  const { user, loading } = useSession();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    readJSON<boolean>(STORAGE_KEYS.onboarding, false).then(setOnboardingSeen);
  }, []);

  useEffect(() => {
    if (loading || onboardingSeen === null) return;
    if (!onboardingSeen) {
      router.replace('/onboarding/1');
    } else if (!user) {
      router.replace('/auth/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [loading, onboardingSeen, user]);

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
      <View className="mb-5 h-24 w-24 items-center justify-center rounded-3xl bg-white">
        <Text className="text-5xl">✓</Text>
      </View>
      <Text className="text-3xl font-bold text-white">TaskStudent</Text>
      <Text className="mt-2 text-white/80">Organise ta vie, simplement.</Text>
    </View>
  );
}
