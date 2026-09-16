import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimeField from '@/components/DateTimeField';
import Sheet, { SheetAction, SheetOption } from '@/components/ui/Sheet';
import { FALLBACK_PROJECT } from '@/constants';
import { surfaceStyles, theme } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { fromDateKey } from '@/lib/date';
import { createId } from '@/lib/id';

type PickerType = 'category' | 'date' | null;

/**
 * Création de tâche en feuille modale (route `transparentModal`) : le même
 * vocabulaire visuel que les autres feuilles de l'application.
 */
export default function NewTask() {
  const params = useLocalSearchParams<{ date?: string; subject?: string }>();
  const { createTask } = useTasks();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  const categories = settings.categories.length > 0 ? settings.categories : [FALLBACK_PROJECT];

  const [title, setTitle] = useState('');
  const [due, setDue] = useState(() => {
    if (params.date) return fromDateKey(params.date, 18);
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [subjectId, setSubjectId] = useState(() => {
    if (typeof params.subject === 'string' && categories.some((c) => c.id === params.subject)) {
      return params.subject;
    }
    return categories[0]?.id ?? FALLBACK_PROJECT.id;
  });
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<PickerType>(null);

  const selectedCategory = categories.find((c) => c.id === subjectId) ?? FALLBACK_PROJECT;
  const canSave = title.trim().length > 0 && !saving;

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = now.toDateString() === date.toDateString();
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const tomorrow = tomorrowDate.toDateString() === date.toDateString();
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (today) return `Auj. ${time}`;
    if (tomorrow) return `Demain ${time}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` ${time}`;
  };

  const addSubtask = () => {
    const t = subtaskDraft.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, t]);
    setSubtaskDraft('');
  };

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        description: '',
        dueDate: due.toISOString(),
        priority: 'medium',
        subjectId,
        reminders: [],
        note: '',
        durationMinutes: null,
        repeat: 'none',
        subtasks: subtasks.map((title) => ({
          id: createId('st'),
          title,
          isCompleted: false,
        })),
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 justify-end" style={{ backgroundColor: theme.colors.overlay }}>
      {/* Tap extérieur = fermer */}
      <Pressable className="flex-1" onPress={handleClose} accessibilityRole="button" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          className={`${surfaceStyles.sheet} pb-6 pt-3`}
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <View className="mb-3">
            <View className={surfaceStyles.handle} />
          </View>

          {/* TITRE — seul champ principal */}
          <View className="px-5">
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholder="Nom de la tâche"
              placeholderTextColor={theme.colors.placeholder}
              multiline
              maxLength={200}
              className="text-lg font-semibold text-ink"
              style={{ maxHeight: 88, paddingVertical: 4 }}
              onSubmitEditing={save}
              returnKeyType="done"
            />
          </View>

          {/* Sous-tâches déjà ajoutées */}
          {subtasks.length > 0 ? (
            <View className="mt-2 px-5">
              {subtasks.map((st, index) => (
                <View key={`${st}-${index}`} className="mb-1.5 flex-row items-center">
                  <Ionicons name="remove-outline" size={14} color={theme.colors.iconSoft} />
                  <Text className="ml-2 flex-1 text-[14px] text-soft" numberOfLines={1}>
                    {st}
                  </Text>
                  <Pressable onPress={() => removeSubtask(index)} hitSlop={8} className="p-1">
                    <Ionicons name="close" size={14} color={theme.colors.icon} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {/* Ajout rapide sous-tâche */}
          <View className="mt-2 flex-row items-center px-5">
            <Ionicons name="add" size={16} color={theme.colors.icon} />
            <TextInput
              value={subtaskDraft}
              onChangeText={setSubtaskDraft}
              placeholder="Sous-tâche"
              placeholderTextColor={theme.colors.placeholder}
              className="ml-2 flex-1 text-[14px] text-soft"
              onSubmitEditing={addSubtask}
              returnKeyType="done"
            />
            {subtaskDraft.trim().length > 0 ? (
              <Pressable onPress={addSubtask} hitSlop={8} className="p-1">
                <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
              </Pressable>
            ) : null}
          </View>

          {/* BARRE DU BAS : Catégorie · Date · Envoyer */}
          <View className="mt-4 flex-row items-center border-t border-line-soft px-5 pt-3">
            <Pressable
              onPress={() => setPicker('category')}
              className="mr-2 flex-row items-center rounded-full bg-surface-muted px-3 py-2 active:bg-line"
              accessibilityRole="button"
              accessibilityLabel="Choisir une catégorie"
            >
              <View
                className="mr-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <Text className="max-w-[100px] text-[12px] font-semibold text-soft" numberOfLines={1}>
                {selectedCategory.name}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPicker('date')}
              className="mr-2 flex-row items-center rounded-full bg-surface-muted px-3 py-2 active:bg-line"
              accessibilityRole="button"
              accessibilityLabel="Choisir la date d'échéance"
            >
              <Ionicons name="calendar-outline" size={12} color={theme.colors.icon} />
              <Text className="ml-1.5 text-[12px] font-semibold text-soft">{formatDate(due)}</Text>
            </Pressable>

            <View className="flex-1" />

            <Pressable
              onPress={save}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel="Ajouter la tâche"
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-90"
              style={{
                backgroundColor: canSave ? theme.colors.primary : theme.colors.surfaceMuted,
              }}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={canSave ? theme.colors.onPrimary : theme.colors.placeholder}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sélecteurs catégorie / date */}
      <Sheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === 'date' ? 'Date et heure' : 'Catégorie'}
      >
        {picker === 'category' ? (
          <ScrollView style={{ maxHeight: 280 }}>
            {categories.map((cat) => (
              <SheetOption
                key={cat.id}
                label={cat.name}
                color={cat.color}
                selected={subjectId === cat.id}
                onPress={() => {
                  setSubjectId(cat.id);
                  setPicker(null);
                }}
              />
            ))}
          </ScrollView>
        ) : null}

        {picker === 'date' ? (
          <>
            <DateTimeField value={due} onChange={setDue} />
            <SheetAction label="Valider" onPress={() => setPicker(null)} />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
