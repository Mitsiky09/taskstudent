import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimeField from '@/components/DateTimeField';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import Sheet, { SheetAction, SheetOption } from '@/components/ui/Sheet';
import TextField from '@/components/ui/TextField';
import {
  DURATION_OPTIONS,
  FALLBACK_PROJECT,
  getCategory,
  PRIORITY_LABELS,
  REPEAT_OPTIONS,
} from '@/constants';
import { theme } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { addDays } from '@/lib/date';
import { shareTask } from '@/lib/export';
import { Priority, RepeatRule } from '@/types';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

const REPORT_SHORTCUTS = [
  { label: 'Demain', days: 1 },
  { label: '+3 jours', days: 3 },
  { label: '+1 semaine', days: 7 },
];

interface Draft {
  title: string;
  description: string;
  dueDate: Date;
  priority: Priority;
  subjectId: string;
  note: string;
  durationMinutes: number | null;
  repeat: RepeatRule;
}

type PickerType = 'category' | 'date' | 'priority' | 'duration' | 'repeat' | 'note' | null;

const PICKER_TITLES: Record<Exclude<PickerType, null>, string> = {
  category: 'Changer de catégorie',
  date: "Modifier la date & l'heure",
  priority: 'Priorité',
  duration: 'Durée estimée',
  repeat: 'Répétition',
  note: 'Remarques personnelles',
};

interface OptionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isButton?: boolean;
}

/** Rangée d'option : icône, libellé, valeur ; même hauteur partout. */
function OptionRow({ icon, label, value, onPress, isButton }: OptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-row items-center px-5 py-3.5 active:bg-surface-muted"
    >
      <Ionicons name={icon} size={18} color={theme.colors.icon} />
      <Text className="ml-3.5 flex-1 text-[15px] font-medium text-soft">{label}</Text>
      {value ? (
        <View className={`rounded-lg px-2.5 py-1 ${isButton ? '' : 'bg-surface-muted'}`}>
          <Text
            className={`text-[13px] font-semibold ${
              isButton ? 'uppercase tracking-wider text-faint' : 'text-soft'
            }`}
          >
            {value}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Filet de séparation entre deux rangées, aligné sur le libellé. */
function RowDivider() {
  return <View className="ml-[50px] h-px bg-line-soft" />;
}

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  const {
    tasks,
    updateTask,
    toggleTask,
    toggleSubtask,
    addSubtask,
    archiveTask,
    deleteTask,
    reportTask,
  } = useTasks();

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [picker, setPicker] = useState<PickerType>(null);

  if (task && draftTaskId !== task.id) {
    setDraftTaskId(task.id);
    setDraft({
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate),
      priority: task.priority,
      subjectId: task.subjectId,
      note: task.note,
      durationMinutes: task.durationMinutes,
      repeat: task.repeat,
    });
  }

  if (!task) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas px-5">
        <View className="flex-row items-center py-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
          </Pressable>
        </View>
        <EmptyState
          emoji="🔍"
          title="Tâche introuvable"
          message="Elle a peut-être été supprimée."
        />
      </SafeAreaView>
    );
  }

  if (!draft) return null;

  const categories = settings.categories.length > 0 ? settings.categories : [FALLBACK_PROJECT];
  const categoryOptions =
    categories.some((c) => c.id === draft.subjectId) || !draft.subjectId
      ? categories
      : categories.concat(getCategory(categories, draft.subjectId));

  const selectedCategory =
    categoryOptions.find((c) => c.id === draft.subjectId) ?? FALLBACK_PROJECT;

  const dirty =
    draft.title !== task.title ||
    draft.description !== task.description ||
    draft.dueDate.toISOString() !== task.dueDate ||
    draft.priority !== task.priority ||
    draft.subjectId !== task.subjectId ||
    draft.note !== task.note ||
    draft.durationMinutes !== task.durationMinutes ||
    draft.repeat !== task.repeat;

  const save = () => {
    if (!draft.title.trim()) {
      Alert.alert('Titre requis', 'La tâche doit avoir un titre.');
      return;
    }
    updateTask(task.id, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      dueDate: draft.dueDate.toISOString(),
      priority: draft.priority,
      subjectId: draft.subjectId,
      note: draft.note.trim(),
      durationMinutes: draft.durationMinutes,
      repeat: draft.repeat,
    });
    router.back();
  };

  const confirmDelete = () =>
    Alert.alert('Supprimer la tâche ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteTask(task.id);
          router.back();
        },
      },
    ]);

  const completed = task.status === 'completed';

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const confirmSubtask = () => {
    if (!newSubtask.trim()) {
      setShowAddSubtask(false);
      return;
    }
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
    setShowAddSubtask(false);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      {/* Barre haute */}
      <View className="flex-row items-center justify-between border-b border-line-soft px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-muted"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>

        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => void shareTask(task)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Partager la tâche"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-muted"
          >
            <Ionicons name="share-outline" size={18} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Supprimer la tâche"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-muted"
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Catégorie */}
        <View className="px-5 pb-2 pt-4">
          <Pressable
            onPress={() => setPicker('category')}
            accessibilityRole="button"
            accessibilityLabel="Changer de catégorie"
            className="flex-row items-center self-start rounded-full bg-surface-muted px-3.5 py-1.5 active:bg-line"
          >
            <View
              className="mr-2 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <Text className="text-[13px] font-semibold text-soft">{selectedCategory.name}</Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={theme.colors.icon}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </View>

        {/* Case à cocher & titre */}
        <View className="flex-row items-start px-5 py-2">
          <Pressable
            onPress={() => toggleTask(task.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completed }}
            accessibilityLabel={completed ? 'Marquer comme à faire' : 'Marquer comme terminée'}
            className={`mr-3.5 mt-1.5 h-6 w-6 items-center justify-center rounded-full border-2 ${
              completed ? 'border-primary bg-primary' : 'border-line'
            }`}
          >
            {completed ? (
              <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />
            ) : null}
          </Pressable>

          <TextInput
            value={draft.title}
            onChangeText={(title) => setDraft({ ...draft, title })}
            multiline
            className={`flex-1 text-2xl font-bold leading-8 ${
              completed ? 'text-faint line-through' : 'text-ink'
            }`}
            placeholder="Titre de la tâche"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        {/* Description */}
        <View className="px-5 pb-3">
          <TextInput
            value={draft.description}
            onChangeText={(description) => setDraft({ ...draft, description })}
            placeholder="Ajouter une description..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
            className="text-[15px] font-medium text-muted"
          />
        </View>

        {/* Sous-tâches */}
        <View className="px-5 py-2">
          {showAddSubtask ? (
            <View className="flex-row items-center border-b border-primary pb-1">
              <TextInput
                autoFocus
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="Nom de la sous-tâche..."
                placeholderTextColor={theme.colors.placeholder}
                onSubmitEditing={confirmSubtask}
                className="flex-1 text-[15px] text-ink"
              />
              <Pressable onPress={confirmSubtask} className="px-2" hitSlop={8}>
                <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowAddSubtask(true)}
              accessibilityRole="button"
              className="flex-row items-center py-1 active:opacity-70"
            >
              <Ionicons name="add" size={18} color={theme.colors.primary} />
              <Text className="ml-2.5 text-[15px] font-semibold text-primary">
                Ajouter une sous-tâche
              </Text>
            </Pressable>
          )}

          {task.subtasks.map((st) => (
            <Pressable
              key={st.id}
              onPress={() => toggleSubtask(task.id, st.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: st.isCompleted }}
              className="flex-row items-center py-2.5 pl-1 active:opacity-80"
            >
              <Ionicons
                name={st.isCompleted ? 'checkbox' : 'square-outline'}
                size={16}
                color={st.isCompleted ? theme.colors.primary : theme.colors.icon}
              />
              <Text
                className={`ml-3 flex-1 text-[14px] ${
                  st.isCompleted ? 'text-faint line-through' : 'font-medium text-soft'
                }`}
              >
                {st.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mx-5 my-2 h-px bg-line-soft" />

        {/* Options */}
        <OptionRow
          icon="calendar-outline"
          label="Date prévue"
          value={formatDate(draft.dueDate)}
          onPress={() => setPicker('date')}
        />
        <RowDivider />
        <OptionRow
          icon="alarm-outline"
          label="Heure et rappel"
          value={formatTime(draft.dueDate)}
          onPress={() => setPicker('date')}
        />
        <RowDivider />
        <OptionRow
          icon="flag-outline"
          label="Priorité"
          value={PRIORITY_LABELS[draft.priority]}
          onPress={() => setPicker('priority')}
        />
        <RowDivider />
        <OptionRow
          icon="time-outline"
          label="Durée estimée"
          value={draft.durationMinutes === null ? 'Non précisée' : `${draft.durationMinutes} min`}
          onPress={() => setPicker('duration')}
        />
        <RowDivider />
        <OptionRow
          icon="repeat-outline"
          label="Répéter la tâche"
          value={REPEAT_OPTIONS.find((r) => r.value === draft.repeat)?.label ?? 'Non'}
          onPress={() => setPicker('repeat')}
        />
        <RowDivider />
        <OptionRow
          icon="document-text-outline"
          label="Remarques"
          value={draft.note.trim() ? 'Voir / éditer' : 'Ajouter'}
          isButton
          onPress={() => setPicker('note')}
        />

        {/* Reporter rapidement */}
        <View className="px-5 py-4">
          <Text className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
            Reporter rapidement
          </Text>
          <View className="flex-row gap-2">
            {REPORT_SHORTCUTS.map((option) => (
              <Pressable
                key={option.days}
                onPress={() => {
                  reportTask(task.id, addDays(new Date(task.dueDate), option.days));
                  router.back();
                }}
                accessibilityRole="button"
                className="flex-1 items-center rounded-2xl bg-surface-muted py-2.5 active:bg-line"
              >
                <Text className="text-xs font-semibold text-soft">{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="px-5 pb-12 pt-2">
          {dirty ? (
            <PrimaryButton label="Enregistrer les modifications" onPress={save} className="mb-3" />
          ) : null}

          {completed ? (
            <PrimaryButton
              label="Archiver la tâche"
              variant="dark"
              onPress={() => {
                archiveTask(task.id);
                router.back();
              }}
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Sélecteurs */}
      <Sheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker ? PICKER_TITLES[picker] : undefined}
      >
        {picker === 'category'
          ? categoryOptions.map((cat) => (
              <SheetOption
                key={cat.id}
                label={cat.name}
                color={cat.color}
                selected={draft.subjectId === cat.id}
                onPress={() => {
                  setDraft({ ...draft, subjectId: cat.id });
                  setPicker(null);
                }}
              />
            ))
          : null}

        {picker === 'priority'
          ? PRIORITIES.map((value) => (
              <SheetOption
                key={value}
                label={PRIORITY_LABELS[value]}
                selected={draft.priority === value}
                onPress={() => {
                  setDraft({ ...draft, priority: value });
                  setPicker(null);
                }}
              />
            ))
          : null}

        {picker === 'duration'
          ? [null, ...DURATION_OPTIONS].map((value) => (
              <SheetOption
                key={value ?? 'none'}
                label={value === null ? 'Non précisée' : `${value} minutes`}
                selected={draft.durationMinutes === value}
                onPress={() => {
                  setDraft({ ...draft, durationMinutes: value });
                  setPicker(null);
                }}
              />
            ))
          : null}

        {picker === 'repeat'
          ? REPEAT_OPTIONS.map((option) => (
              <SheetOption
                key={option.value}
                label={option.label}
                selected={draft.repeat === option.value}
                onPress={() => {
                  setDraft({ ...draft, repeat: option.value });
                  setPicker(null);
                }}
              />
            ))
          : null}

        {picker === 'date' ? (
          <>
            <DateTimeField
              value={draft.dueDate}
              onChange={(dueDate) => setDraft({ ...draft, dueDate })}
            />
            <SheetAction label="Valider" onPress={() => setPicker(null)} />
          </>
        ) : null}

        {picker === 'note' ? (
          <>
            <TextField
              autoFocus
              multiline
              value={draft.note}
              onChangeText={(note) => setDraft({ ...draft, note })}
              placeholder="Écrire une remarque..."
              accessibilityLabel="Remarque personnelle"
              textAlignVertical="top"
              className="min-h-[100px] p-4 text-[15px]"
            />
            <SheetAction label="Valider" onPress={() => setPicker(null)} />
          </>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}
