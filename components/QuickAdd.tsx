import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimeField from '@/components/DateTimeField';
import { COLORS, FALLBACK_PROJECT, getCategory, PRIORITY_COLORS, PRIORITY_LABELS } from '@/constants';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { addDays, endOfDay, formatShortDate } from '@/lib/date';
import { dueToDate, parseQuickAdd, QuickChip } from '@/lib/quickadd';
import { Priority, Subject } from '@/types';

/**
 * Ajout rapide façon Todoist : champ unique, bouton rouge, barre d'icônes.
 */

const ONE_HOUR_MS = 3_600_000;
const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

type DateQuick = 'today' | 'tomorrow' | 'week' | 'none' | 'custom';
type Panel = 'date' | 'priority' | 'project' | null;

interface QuickAddProps {
  visible: boolean;
  onClose: () => void;
}

const DATE_CHOICES: { value: DateQuick; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'tomorrow', label: 'Demain' },
  { value: 'week', label: 'Dans 3 jours' },
  { value: 'none', label: 'Sans date' },
  { value: 'custom', label: 'Choisir…' },
];

function chipColor(chip: QuickChip, categories: Subject[]): string {
  if (chip.kind === 'date') return COLORS.primary;
  if (chip.kind === 'priority') return PRIORITY_COLORS[chip.priority ?? 'medium'];
  if (chip.unknown) return '#d97706';
  return getCategory(categories, chip.subjectId ?? '').color;
}

export default function QuickAdd({ visible, onClose }: QuickAddProps) {
  const { createTask } = useTasks();
  const { settings } = useSettings();

  const [title, setTitle] = useState('');
  const [dateQuick, setDateQuick] = useState<DateQuick>('today');
  const [customDue, setCustomDue] = useState(() => addDays(new Date(), 1));
  const [manualPriority, setManualPriority] = useState<Priority>('medium');
  const [manualProjectId, setManualProjectId] = useState(
    () => settings.categories[0]?.id ?? FALLBACK_PROJECT.id
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parseQuickAdd(title, { subjects: settings.categories }), [
    title,
    settings.categories,
  ]);

  const due = useMemo(() => {
    if (parsed.due) return dueToDate(parsed.due);
    const now = new Date();
    switch (dateQuick) {
      case 'tomorrow':
        return endOfDay(addDays(now, 1));
      case 'week':
        return endOfDay(addDays(now, 3));
      case 'custom':
        return customDue;
      case 'none':
        return endOfDay(addDays(now, 365));
      case 'today':
      default:
        return endOfDay(now);
    }
  }, [parsed.due, dateQuick, customDue]);

  const priority = parsed.priorityToken ? parsed.priority : manualPriority;
  const projectId = parsed.subject?.id ?? manualProjectId;

  const hasDateToken = parsed.chips.some((c) => c.kind === 'date');
  const hasPriorityToken = parsed.priorityToken;
  const hasProjectToken = parsed.subjectToken;

  const hasExplicitDate =
    parsed.due != null || dateQuick === 'tomorrow' || dateQuick === 'week' || dateQuick === 'custom';

  const canSubmit = parsed.title.trim().length > 0 && !saving;

  const resetAndClose = () => {
    setTitle('');
    setDateQuick('today');
    setPanel(null);
    onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await createTask({
        title: parsed.title.trim(),
        description: parsed.description,
        dueDate: due.toISOString(),
        priority,
        subjectId: projectId,
        reminders:
          settings.notifications && hasExplicitDate && dateQuick !== 'none'
            ? [new Date(due.getTime() - ONE_HOUR_MS).toISOString()]
            : [],
      });
      setTitle('');
      setDateQuick('today');
      setPanel(null);
    } finally {
      setSaving(false);
    }
  };

  const moreOptions = () => {
    onClose();
    router.push({
      pathname: '/task/new',
      params: {
        title: parsed.title.trim(),
        description: parsed.description,
        date: parsed.due ? parsed.due.date : '',
        priority: parsed.priorityToken ? parsed.priority : '',
        subject: parsed.subject?.id ?? '',
      },
    });
  };

  const dateLabel =
    hasDateToken && parsed.due
      ? parsed.chips.find((c) => c.kind === 'date')?.label
      : dateQuick === 'custom'
        ? formatShortDate(customDue)
        : DATE_CHOICES.find((c) => c.value === dateQuick)?.label ?? "Aujourd'hui";

  const project = getCategory(settings.categories, projectId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View className="flex-1 justify-end bg-black/30">
        <Pressable
          onPress={resetAndClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer l'ajout rapide"
          className="absolute inset-0"
        />

        <KeyboardAvoidingView behavior="padding" className="justify-end">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-3 shadow-2xl">
            <View className="mb-1 h-1 w-10 self-center rounded-full bg-gray-300" />

            <View className="flex-row items-start">
              <View className="min-h-[52px] flex-1 border-b border-gray-200 pb-2">
                <TextInput
                  autoFocus
                  value={title}
                  onChangeText={setTitle}
                  onSubmitEditing={() => void submit()}
                  placeholder="Nom de la tâche"
                  accessibilityLabel="Nom de la tâche"
                  returnKeyType="done"
                  multiline
                  maxLength={200}
                  placeholderTextColor="#b3b3b3"
                  className="text-base text-gray-900"
                  style={{ minHeight: 28, paddingVertical: 4 }}
                />

                {parsed.chips.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-2"
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {parsed.chips.map((chip, index) => {
                      const color = chipColor(chip, settings.categories);
                      return (
                        <View
                          key={`${chip.kind}-${chip.label}-${index}`}
                          className="flex-row items-center rounded-md px-2 py-1"
                          style={{ backgroundColor: `${color}18` }}
                        >
                          <Text className="text-xs font-medium" style={{ color }}>
                            {chip.label}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>

              <Pressable
                onPress={() => void submit()}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityLabel="Ajouter la tâche"
                className="ml-3 mt-1 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: canSubmit ? COLORS.primary : '#e5e5e5' }}
              >
                <Ionicons name="arrow-up" size={20} color={canSubmit ? '#fff' : '#a3a3a3'} />
              </Pressable>
            </View>

            <View className="mt-4 flex-row items-center gap-5">
              <Pressable
                onPress={() => setPanel(panel === 'date' ? null : 'date')}
                accessibilityRole="button"
                accessibilityLabel="Choisir une date"
                className="flex-row items-center gap-1.5"
              >
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={hasDateToken || dateQuick !== 'today' ? COLORS.primary : '#808080'}
                />
                {!hasDateToken ? (
                  <Text className="text-sm text-gray-500">{dateLabel}</Text>
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => setPanel(panel === 'priority' ? null : 'priority')}
                accessibilityRole="button"
                accessibilityLabel="Choisir une priorité"
                className="flex-row items-center gap-1.5"
              >
                <Ionicons
                  name="flag-outline"
                  size={22}
                  color={hasPriorityToken || priority !== 'medium' ? PRIORITY_COLORS[priority] : '#808080'}
                />
                {!hasPriorityToken && priority !== 'medium' ? (
                  <Text className="text-sm" style={{ color: PRIORITY_COLORS[priority] }}>
                    {PRIORITY_LABELS[priority]}
                  </Text>
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => setPanel(panel === 'project' ? null : 'project')}
                accessibilityRole="button"
                accessibilityLabel="Choisir une catégorie"
                className="flex-row items-center gap-1.5"
              >
                <Ionicons
                  name="folder-outline"
                  size={22}
                  color={hasProjectToken ? project.color : '#808080'}
                />
                {!hasProjectToken ? (
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {project.name}
                  </Text>
                ) : null}
              </Pressable>
            </View>

            {panel === 'date' && !hasDateToken ? (
              <View className="mt-4">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {DATE_CHOICES.map((choice) => {
                    const selected = dateQuick === choice.value;
                    return (
                      <Pressable
                        key={choice.value}
                        onPress={() => setDateQuick(choice.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className="rounded-lg px-3 py-2"
                        style={{
                          backgroundColor: selected ? `${COLORS.primary}15` : '#f5f5f5',
                          borderWidth: selected ? 1 : 0,
                          borderColor: COLORS.primary,
                        }}
                      >
                        <Text
                          className="text-sm"
                          style={{ color: selected ? COLORS.primary : '#666', fontWeight: selected ? '600' : '400' }}
                        >
                          {choice.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {dateQuick === 'custom' ? (
                  <View className="mt-3">
                    <DateTimeField value={customDue} onChange={setCustomDue} />
                  </View>
                ) : null}
              </View>
            ) : null}

            {panel === 'priority' && !hasPriorityToken ? (
              <View className="mt-4 flex-row gap-2">
                {PRIORITIES.map((value) => {
                  const selected = priority === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setManualPriority(value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5"
                      style={{
                        backgroundColor: selected ? `${PRIORITY_COLORS[value]}15` : '#f5f5f5',
                        borderWidth: selected ? 1 : 0,
                        borderColor: PRIORITY_COLORS[value],
                      }}
                    >
                      <Ionicons name="flag" size={14} color={PRIORITY_COLORS[value]} />
                      <Text
                        className="text-sm"
                        style={{ color: PRIORITY_COLORS[value], fontWeight: selected ? '600' : '400' }}
                      >
                        {PRIORITY_LABELS[value]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {panel === 'project' && !hasProjectToken ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {settings.categories.map((item) => {
                  const selected = projectId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setManualProjectId(item.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className="flex-row items-center gap-2 rounded-lg px-3 py-2"
                      style={{
                        backgroundColor: selected ? `${item.color}18` : '#f5f5f5',
                        borderWidth: selected ? 1 : 0,
                        borderColor: item.color,
                      }}
                    >
                      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <Text
                        className="text-sm"
                        style={{ color: selected ? item.color : '#666', fontWeight: selected ? '600' : '400' }}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            <Pressable
              onPress={moreOptions}
              accessibilityRole="button"
              className="mt-5 items-center py-1"
              hitSlop={8}
            >
              <Text className="text-sm text-gray-400">Plus d&apos;options</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
