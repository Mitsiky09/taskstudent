import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatShortDate, formatTime } from '@/lib/date';
import { theme } from '@/constants/theme';

/**
 * Sur iOS le sélecteur s'affiche en ligne ; sur Android il doit être ouvert à
 * la demande, en deux temps (date puis heure). Cette différence de plateforme
 * est encapsulée ici plutôt que dans les écrans.
 */
export default function DateTimeField({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);

  if (Platform.OS === 'ios') {
    return (
      <View className="mb-4 flex-row items-center rounded-2xl bg-surface-muted px-3 py-2">
        <DateTimePicker
          value={value}
          mode="datetime"
          locale="fr-FR"
          onChange={(_, date) => date && onChange(date)}
        />
      </View>
    );
  }

  return (
    <View className="mb-4 flex-row gap-2">
      <Pressable
        onPress={() => setMode('date')}
        accessibilityRole="button"
        accessibilityLabel="Choisir la date d'échéance"
        className="h-12 flex-1 flex-row items-center rounded-2xl bg-surface-muted px-4 active:opacity-80"
      >
        <Ionicons name="calendar-outline" size={16} color={theme.colors.icon} />
        <Text className="ml-2 text-[15px] text-ink">{formatShortDate(value)}</Text>
      </Pressable>
      <Pressable
        onPress={() => setMode('time')}
        accessibilityRole="button"
        accessibilityLabel="Choisir l'heure d'échéance"
        className="h-12 w-32 flex-row items-center rounded-2xl bg-surface-muted px-4 active:opacity-80"
      >
        <Ionicons name="time-outline" size={16} color={theme.colors.icon} />
        <Text className="ml-2 text-[15px] text-ink">{formatTime(value)}</Text>
      </Pressable>

      {mode ? (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          onChange={(event, date) => {
            setMode(null);
            if (event.type === 'set' && date) onChange(date);
          }}
        />
      ) : null}
    </View>
  );
}
