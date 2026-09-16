import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows, theme } from '@/constants/theme';

/**
 * Bouton d'action flottant, couleur et ombre reprises des tokens.
 * (La barre d'onglets flottante possède son propre bouton « + » : ce
 * composant sert aux écrans sans barre d'onglets.)
 */
export default function FloatingActionButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ajouter une tâche"
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-90"
      style={shadows.floating}
    >
      <Ionicons name="add" size={30} color={theme.colors.onPrimary} />
    </Pressable>
  );
}
