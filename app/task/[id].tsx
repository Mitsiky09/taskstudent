import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimeField from '@/components/DateTimeField';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import {
  COLORS,
  DURATION_OPTIONS,
  FALLBACK_PROJECT,
  getCategory,
  PRIORITY_LABELS,
  REPEAT_OPTIONS,
} from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { addDays } from '@/lib/date';
import { shareTask } from '@/lib/export';
import { Priority, RepeatRule } from '@/types';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const ACCENT = '#3B82F6'; // Bleu épuré style To Do / TickTick

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

type PickerType =
  | 'category'
  | 'date'
  | 'priority'
  | 'duration'
  | 'repeat'
  | 'note'
  | null;

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
      <SafeAreaView edges={['top']} className="flex-1 bg-white px-4">
        <View className="flex-row items-center py-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <Feather name="arrow-left" size={22} color="#334155" />
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

  const categories =
    settings.categories.length > 0 ? settings.categories : [FALLBACK_PROJECT];
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
    date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Composant rangée style capture d'écran
  const Row = ({
    icon,
    label,
    value,
    onPress,
    isButton,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    isButton?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center px-5 py-3.5 active:bg-slate-50"
    >
      <Feather name={icon} size={18} color="#94a3b8" />
      <Text className="ml-3.5 flex-1 text-[15px] text-slate-700 font-medium">
        {label}
      </Text>
      {value ? (
        <View
          className={`rounded-lg px-2.5 py-1 ${
            isButton ? 'bg-transparent' : 'bg-slate-100'
          }`}
        >
          <Text
            className={`text-[13px] font-semibold ${
              isButton ? 'text-slate-400 uppercase tracking-wider' : 'text-slate-600'
            }`}
          >
            {value}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );

  const Divider = () => <View className="ml-13 h-px bg-slate-100" />;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      {/* BARRE HAUTE (Header minimaliste) */}
      <View className="flex-row items-center justify-between px-3 py-2 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="p-2 rounded-full active:bg-slate-100"
        >
          <Feather name="arrow-left" size={22} color="#334155" />
        </Pressable>

        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => void shareTask(task)}
            hitSlop={12}
            className="p-2 rounded-full active:bg-slate-100"
          >
            <Feather name="share-2" size={18} color="#64748b" />
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            hitSlop={12}
            className="p-2 rounded-full active:bg-slate-100"
          >
            <Feather name="trash-2" size={18} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* PASTILLE DE CATÉGORIE (Exactement comme la photo) */}
        <View className="px-5 pt-4 pb-2">
          <Pressable
            onPress={() => setPicker('category')}
            className="self-start flex-row items-center rounded-full bg-slate-100/80 px-3.5 py-1.5 active:bg-slate-200"
          >
            <View
              className="mr-2 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <Text className="text-[13px] font-semibold text-slate-600">
              {selectedCategory.name}
            </Text>
            <Feather
              name="chevron-down"
              size={14}
              color="#94a3b8"
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        </View>

        {/* CHECKBOX & TITRE */}
        <View className="flex-row items-start px-5 py-2">
          <Pressable
            onPress={() => toggleTask(task.id)}
            className="mr-3.5 mt-1 h-6 w-6 items-center justify-center rounded-full border-2"
            style={{
              borderColor: completed ? ACCENT : '#cbd5e1',
              backgroundColor: completed ? ACCENT : 'transparent',
            }}
          >
            {completed && <Feather name="check" size={14} color="white" />}
          </Pressable>

          <TextInput
            value={draft.title}
            onChangeText={(title) => setDraft({ ...draft, title })}
            multiline
            className={`flex-1 text-2xl font-bold text-slate-900 leading-8 ${
              completed ? 'line-through text-slate-400' : ''
            }`}
            placeholder="Titre de la tâche"
            placeholderTextColor="#cbd5e1"
          />
        </View>

        {/* DESCRIPTION COURTE */}
        <View className="px-5 pb-3">
          <TextInput
            value={draft.description}
            onChangeText={(description) => setDraft({ ...draft, description })}
            placeholder="Ajouter une description..."
            placeholderTextColor="#cbd5e1"
            multiline
            className="text-[15px] font-medium text-slate-500"
          />
        </View>

        {/* BOUTON "+ Ajouter une sous-tâche" (Exactement comme la photo) */}
        <View className="px-5 py-2">
          {showAddSubtask ? (
            <View className="flex-row items-center border-b border-blue-500 pb-1">
              <TextInput
                autoFocus
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="Nom de la sous-tâche..."
                placeholderTextColor="#cbd5e1"
                onSubmitEditing={() => {
                  if (newSubtask.trim()) {
                    addSubtask(task.id, newSubtask.trim());
                    setNewSubtask('');
                  }
                  setShowAddSubtask(false);
                }}
                className="flex-1 text-[15px] text-slate-800"
              />
              <Pressable
                onPress={() => {
                  if (newSubtask.trim()) {
                    addSubtask(task.id, newSubtask.trim());
                    setNewSubtask('');
                  }
                  setShowAddSubtask(false);
                }}
                className="px-2"
              >
                <Feather name="check" size={18} color={ACCENT} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowAddSubtask(true)}
              className="flex-row items-center py-1 active:opacity-70"
            >
              <Feather name="plus" size={18} color={ACCENT} />
              <Text className="ml-2.5 text-[15px] font-semibold text-blue-500">
                Ajouter une sous-tâche
              </Text>
            </Pressable>
          )}

          {/* LISTE DES SOUS-TÂCHES */}
          {task.subtasks.map((st) => (
            <Pressable
              key={st.id}
              onPress={() => toggleSubtask(task.id, st.id)}
              className="flex-row items-center py-2.5 pl-1 active:opacity-80"
            >
              <Feather
                name={st.isCompleted ? 'check-square' : 'square'}
                size={16}
                color={st.isCompleted ? ACCENT : '#94a3b8'}
              />
              <Text
                className={`ml-3 text-[14px] flex-1 ${
                  st.isCompleted
                    ? 'line-through text-slate-400'
                    : 'text-slate-700 font-medium'
                }`}
              >
                {st.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="h-px bg-slate-100 mx-5 my-2" />

        {/* TABLEAU DES OPTIONS (Style simple de la capture d'écran) */}
        <Row
          icon="calendar"
          label="Date prévue"
          value={formatDate(draft.dueDate)}
          onPress={() => setPicker('date')}
        />
        <Divider />

        <Row
          icon="clock"
          label="Temps et Rappel"
          value={formatTime(draft.dueDate)}
          onPress={() => setPicker('date')}
        />
        <Divider />

        <Row
          icon="flag"
          label="Priorité"
          value={PRIORITY_LABELS[draft.priority]}
          onPress={() => setPicker('priority')}
        />
        <Divider />

        <Row
          icon="watch"
          label="Durée estimée"
          value={
            draft.durationMinutes === null
              ? 'Non précisée'
              : `${draft.durationMinutes} min`
          }
          onPress={() => setPicker('duration')}
        />
        <Divider />

        <Row
          icon="repeat"
          label="Répéter la tâche"
          value={
            REPEAT_OPTIONS.find((r) => r.value === draft.repeat)?.label ?? 'Non'
          }
          onPress={() => setPicker('repeat')}
        />
        <Divider />

        <Row
          icon="file-text"
          label="Remarques"
          value={draft.note.trim() ? 'VOIR / ÉDITER' : 'AJOUTER'}
          isButton
          onPress={() => setPicker('note')}
        />
        <Divider />

        {/* SECTION REPORTER */}
        <View className="px-5 py-4">
          <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Reporter rapidement
          </Text>
          <View className="flex-row gap-2">
            {[
              { label: 'Demain', days: 1 },
              { label: '+3 jours', days: 3 },
              { label: '+1 semaine', days: 7 },
            ].map((option) => (
              <Pressable
                key={option.days}
                onPress={() => {
                  reportTask(task.id, addDays(new Date(task.dueDate), option.days));
                  router.back();
                }}
                className="flex-1 items-center rounded-xl bg-slate-100 py-2.5 active:bg-slate-200"
              >
                <Text className="text-xs font-semibold text-slate-700">
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* BOUTONS D'ENREGISTREMENT ET ACTIONS */}
        <View className="px-5 pt-2 pb-12">
          {dirty ? (
            <PrimaryButton
              label="Enregistrer les modifications"
              onPress={save}
              className="mb-3"
            />
          ) : null}

          {completed && (
            <PrimaryButton
              label="Archiver la tâche"
              variant="dark"
              onPress={() => {
                archiveTask(task.id);
                router.back();
              }}
              className="mb-3"
            />
          )}
        </View>
      </ScrollView>

      {/* MODALE SIMPLE POUR SÉLECTIONNER UNE OPTION */}
      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/30"
          onPress={() => setPicker(null)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-5 pt-3 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-slate-200" />

            {/* Catégorie */}
            {picker === 'category' && (
              <View>
                <Text className="mb-3 text-base font-bold text-slate-900">
                  Changer de catégorie
                </Text>
                {categoryOptions.map((cat) => {
                  const selected = draft.subjectId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setDraft({ ...draft, subjectId: cat.id });
                        setPicker(null);
                      }}
                      className="flex-row items-center py-3.5 border-b border-slate-50"
                    >
                      <View
                        className="mr-3 h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <Text className="flex-1 text-[15px] font-medium text-slate-800">
                        {cat.name}
                      </Text>
                      {selected && <Feather name="check" size={18} color={ACCENT} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Date / Heure */}
            {picker === 'date' && (
              <View>
                <Text className="mb-3 text-base font-bold text-slate-900">
                  Modifier la date & l'heure
                </Text>
                <DateTimeField
                  value={draft.dueDate}
                  onChange={(dueDate) => setDraft({ ...draft, dueDate })}
                />
                <Pressable
                  onPress={() => setPicker(null)}
                  className="mt-4 items-center rounded-xl py-3"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Text className="font-bold text-white">Valider</Text>
                </Pressable>
              </View>
            )}

            {/* Priorité */}
            {picker === 'priority' && (
              <View>
                <Text className="mb-2 text-base font-bold text-slate-900">
                  Priorité
                </Text>
                {PRIORITIES.map((value) => {
                  const selected = draft.priority === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => {
                        setDraft({ ...draft, priority: value });
                        setPicker(null);
                      }}
                      className="flex-row items-center py-3.5 border-b border-slate-50"
                    >
                      <Text className="flex-1 text-[15px] font-medium text-slate-800">
                        {PRIORITY_LABELS[value]}
                      </Text>
                      {selected && <Feather name="check" size={18} color={ACCENT} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Durée */}
            {picker === 'duration' && (
              <View>
                <Text className="mb-2 text-base font-bold text-slate-900">
                  Durée estimée
                </Text>
                {[null, ...DURATION_OPTIONS].map((value) => {
                  const selected = draft.durationMinutes === value;
                  return (
                    <Pressable
                      key={value ?? 'none'}
                      onPress={() => {
                        setDraft({ ...draft, durationMinutes: value });
                        setPicker(null);
                      }}
                      className="flex-row items-center py-3.5 border-b border-slate-50"
                    >
                      <Text className="flex-1 text-[15px] font-medium text-slate-800">
                        {value === null ? 'Non précisée' : `${value} minutes`}
                      </Text>
                      {selected && <Feather name="check" size={18} color={ACCENT} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Répétition */}
            {picker === 'repeat' && (
              <View>
                <Text className="mb-2 text-base font-bold text-slate-900">
                  Répétition
                </Text>
                {REPEAT_OPTIONS.map((option) => {
                  const selected = draft.repeat === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setDraft({ ...draft, repeat: option.value });
                        setPicker(null);
                      }}
                      className="flex-row items-center py-3.5 border-b border-slate-50"
                    >
                      <Text className="flex-1 text-[15px] font-medium text-slate-800">
                        {option.label}
                      </Text>
                      {selected && <Feather name="check" size={18} color={ACCENT} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Remarques */}
            {picker === 'note' && (
              <View>
                <Text className="mb-3 text-base font-bold text-slate-900">
                  Remarques personnelles
                </Text>
                <TextInput
                  autoFocus
                  multiline
                  value={draft.note}
                  onChangeText={(note) => setDraft({ ...draft, note })}
                  placeholder="Écrire une remarque..."
                  placeholderTextColor="#94a3b8"
                  textAlignVertical="top"
                  className="min-h-[100px] rounded-xl bg-slate-50 p-4 text-[15px] text-slate-700 font-medium"
                />
                <Pressable
                  onPress={() => setPicker(null)}
                  className="mt-4 items-center rounded-xl py-3"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Text className="font-bold text-white">Valider</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}