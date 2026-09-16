import { Pressable, Text, View } from 'react-native';

export type SectionTone = 'default' | 'danger' | 'warning';

interface SectionHeaderProps {
  title: string;
  /** Compteur affiché dans une pastille à droite du titre. */
  count?: number;
  tone?: SectionTone;
  action?: { label: string; onPress: () => void; label2?: string };
  className?: string;
}

const TONE_TITLE: Record<SectionTone, string> = {
  default: 'text-ink',
  danger: 'text-danger',
  warning: 'text-warning',
};

const TONE_BADGE: Record<SectionTone, { box: string; text: string }> = {
  default: { box: 'bg-surface-muted', text: 'text-soft' },
  danger: { box: 'bg-danger-50', text: 'text-danger-600' },
  warning: { box: 'bg-warning-50', text: 'text-warning-600' },
};

/**
 * En-tête de section au-dessus d'une liste : titre, compteur optionnel et
 * raccourci « Voir tout ». Identique de l'Accueil aux Archives.
 */
export default function SectionHeader({
  title,
  count,
  tone = 'default',
  action,
  className = '',
}: SectionHeaderProps) {
  const badge = count !== undefined ? TONE_BADGE[tone] : null;

  return (
    <View className={`mb-3 flex-row items-center justify-between ${className}`}>
      <View className="flex-row items-center gap-2">
        <Text className={`text-lg font-bold tracking-tight ${TONE_TITLE[tone]}`}>{title}</Text>
        {count !== undefined && badge ? (
          <View className={`rounded-full px-2 py-0.5 ${badge.box}`}>
            <Text className={`text-xs font-bold ${badge.text}`}>{count}</Text>
          </View>
        ) : null}
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label2 ?? action.label}
          hitSlop={8}
        >
          <Text className="text-xs font-semibold text-muted">{action.label} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
