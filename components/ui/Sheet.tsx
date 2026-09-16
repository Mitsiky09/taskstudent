import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { surfaceStyles, theme } from '@/constants/theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Action secondaire, à droite du titre (« Réinitialiser »). */
  action?: { label: string; onPress: () => void };
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Feuille modale qui remonte du bas, partagée par les filtres, la création de
 * tâche et les sélecteurs de détail : même voile, même poignée, mêmes marges.
 */
export default function Sheet({ visible, onClose, title, action, children, footer }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: theme.colors.overlay }}>
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            className={`${surfaceStyles.sheet} px-5 pt-3`}
            style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}
          >
            <View className="mb-4">
              <View className={surfaceStyles.handle} />
            </View>

            {title ? (
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-base font-bold text-ink">{title}</Text>
                {action ? (
                  <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
                    <Text className="text-sm font-medium text-primary">{action.label}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {children}
            {footer}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

interface SheetOptionProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  /** Pastille colorée à gauche (catégories). */
  color?: string;
  value?: string;
  style?: StyleProp<ViewStyle>;
}

/** Ligne de sélection dans une feuille : même hauteur, même coche partout. */
export function SheetOption({
  label,
  onPress,
  selected = false,
  color,
  value,
  style,
}: SheetOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      className="flex-row items-center border-b border-line-soft py-3.5 active:opacity-70"
      style={style}
    >
      {color ? (
        <View className="mr-3 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
      <Text
        className={`flex-1 text-[15px] ${selected ? 'font-semibold text-ink' : 'font-medium text-soft'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
      {value ? <Text className="mr-2 text-[13px] font-semibold text-faint">{value}</Text> : null}
      {selected ? <Ionicons name="checkmark" size={18} color={theme.colors.primary} /> : null}
    </Pressable>
  );
}

/** Bouton de validation en bas d'une feuille. */
export function SheetAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mt-5 h-[52px] items-center justify-center rounded-2xl bg-primary active:opacity-90"
    >
      <Text className="text-base font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
