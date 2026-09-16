import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimeField from '@/components/DateTimeField';
import { COLORS, FALLBACK_PROJECT } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { fromDateKey } from '@/lib/date';

const ACCENT = COLORS.primary ?? '#4F46E5';

type PickerType = 'category' | 'date' | null;

export default function NewTask() {
  const params = useLocalSearchParams<{ date?: string; subject?: string }>();
  const { createTask } = useTasks();
  const { settings } = useSettings();

  const categories =
    settings.categories.length > 0 ? settings.categories : [FALLBACK_PROJECT];

  const [title, setTitle] = useState('');
  const [due, setDue] = useState(() => {
    if (params.date) return fromDateKey(params.date, 18);
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [subjectId, setSubjectId] = useState(() => {
    if (
      typeof params.subject === 'string' &&
      categories.some((c) => c.id === params.subject)
    ) {
      return params.subject;
    }
    return categories[0]?.id ?? FALLBACK_PROJECT.id;
  });
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<PickerType>(null);

  const selectedCategory =
    categories.find((c) => c.id === subjectId) ?? FALLBACK_PROJECT;

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
    const time = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (today) return `Auj. ${time}`;
    if (tomorrow) return `Demain ${time}`;
    return (
      date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
      ` ${time}`
    );
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
        // si ton createTask accepte les sous-tâches à la création :
        // sinon on les ajoute juste après — adapte selon ton hook
        subtasks: subtasks.map((t) => ({ title: t })),
      } as any);
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 justify-end bg-black/40">
      {/* Tap extérieur = fermer */}
      <Pressable className="flex-1" onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="rounded-t-3xl bg-white pb-6 pt-3">
          {/* Poignée */}
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-slate-200" />

          {/* TITRE — seul champ principal */}
          <View className="px-5">
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholder="Nom de la tâche"
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={200}
              className="text-lg font-semibold text-slate-900"
              style={{ maxHeight: 88, paddingVertical: 4 }}
              onSubmitEditing={save}
              returnKeyType="done"
            />
          </View>

          {/* Sous-tâches déjà ajoutées */}
          {subtasks.length > 0 && (
            <View className="mt-2 px-5">
              {subtasks.map((st, index) => (
                <View
                  key={`${st}-${index}`}
                  className="mb-1.5 flex-row items-center"
                >
                  <Feather name="minus" size={14} color="#cbd5e1" />
                  <Text
                    className="ml-2 flex-1 text-[14px] text-slate-600"
                    numberOfLines={1}
                  >
                    {st}
                  </Text>
                  <Pressable
                    onPress={() => removeSubtask(index)}
                    hitSlop={8}
                    className="p-1"
                  >
                    <Feather name="x" size={14} color="#94a3b8" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Ajout rapide sous-tâche */}
          <View className="mt-2 flex-row items-center px-5">
            <Feather name="plus" size={16} color="#94a3b8" />
            <TextInput
              value={subtaskDraft}
              onChangeText={setSubtaskDraft}
              placeholder="Sous-tâche"
              placeholderTextColor="#cbd5e1"
              className="ml-2 flex-1 text-[14px] text-slate-700"
              onSubmitEditing={addSubtask}
              returnKeyType="done"
            />
            {subtaskDraft.trim().length > 0 && (
              <Pressable onPress={addSubtask} hitSlop={8} className="p-1">
                <Feather name="check" size={16} color={ACCENT} />
              </Pressable>
            )}
          </View>

          {/* BARRE DU BAS : Catégorie · Date · Envoyer */}
          <View className="mt-4 flex-row items-center border-t border-slate-100 px-4 pt-3">
            {/* Catégorie */}
            <Pressable
              onPress={() => setPicker('category')}
              className="mr-2 flex-row items-center rounded-full bg-slate-100 px-3 py-2 active:bg-slate-200"
            >
              <View
                className="mr-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <Text
                className="max-w-[100px] text-[12px] font-semibold text-slate-700"
                numberOfLines={1}
              >
                {selectedCategory.name}
              </Text>
            </Pressable>

            {/* Date */}
            <Pressable
              onPress={() => setPicker('date')}
              className="mr-2 flex-row items-center rounded-full bg-slate-100 px-3 py-2 active:bg-slate-200"
            >
              <Feather name="calendar" size={12} color="#64748b" />
              <Text className="ml-1.5 text-[12px] font-semibold text-slate-700">
                {formatDate(due)}
              </Text>
            </Pressable>

            <View className="flex-1" />

            {/* Bouton envoyer */}
            <Pressable
              onPress={save}
              disabled={!title.trim() || saving}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: title.trim() ? ACCENT : '#e2e8f0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather
                name="arrow-up"
                size={18}
                color={title.trim() ? '#fff' : '#94a3b8'}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Picker catégorie / date */}
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
            className="rounded-t-3xl bg-white px-5 pb-10 pt-3"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-slate-200" />

            {picker === 'category' && (
              <View>
                <Text className="mb-3 text-base font-bold text-slate-900">
                  Catégorie
                </Text>
                <ScrollView style={{ maxHeight: 280 }}>
                  {categories.map((cat) => {
                    const selected = subjectId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          setSubjectId(cat.id);
                          setPicker(null);
                        }}
                        className="flex-row items-center border-b border-slate-50 py-3.5"
                      >
                        <View
                          className="mr-3 h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <Text className="flex-1 text-[15px] font-medium text-slate-800">
                          {cat.name}
                        </Text>
                        {selected && (
                          <Feather name="check" size={18} color={ACCENT} />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {picker === 'date' && (
              <View>
                <Text className="mb-3 text-base font-bold text-slate-900">
                  Date et heure
                </Text>
                <DateTimeField value={due} onChange={setDue} />
                <Pressable
                  onPress={() => setPicker(null)}
                  className="mt-4 items-center rounded-xl py-3"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Text className="font-bold text-white">OK</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}