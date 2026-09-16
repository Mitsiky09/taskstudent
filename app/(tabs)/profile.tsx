import { ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Header from '@/components/Header';
import { AUTO_ARCHIVE_DAYS, CATEGORY_COLORS, COLORS } from '@/constants';
import { useSession } from '@/context/SessionContext';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { shareTasks } from '@/lib/export';
import { requestPermission } from '@/lib/notifications';
import { resetOnboarding } from '@/lib/onboarding';
import { archivedTasks } from '@/lib/tasks';

function Row({
  title,
  right,
  onPress,
}: {
  title: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-row items-center border-b border-gray-100 py-4"
    >
      <Text className="flex-1 text-base text-gray-900">{title}</Text>
      {right ?? (onPress ? <Text className="text-gray-400">›</Text> : null)}
    </Pressable>
  );
}

export default function Profile() {
  const { user, signOut } = useSession();
  const { settings, updateSetting } = useSettings();
  const { tasks } = useTasks();
  const archives = archivedTasks(tasks);
  const [newCategory, setNewCategory] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);

  const categories = settings.categories;

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    const exists = categories.some(
      (c) => c.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      Alert.alert('Déjà existante', 'Une catégorie porte déjà ce nom.');
      return;
    }
    updateSetting('categories', [
      ...categories,
      { id: `cat-${Math.random().toString(36).slice(2, 9)}`, name, color: newColor },
    ]);
    setNewCategory('');
    setNewColor(CATEGORY_COLORS[(CATEGORY_COLORS.indexOf(newColor) + 1) % CATEGORY_COLORS.length]);
  };

  const removeCategory = (categoryId: string) => {
    const affected = tasks.filter((t) => t.subjectId === categoryId).length;
    if (affected > 0) {
      Alert.alert(
        'Suppression impossible',
        `${affected} tâche${affected > 1 ? 's' : ''} utilisent encore cette catégorie. Déplace-les d'abord vers une autre catégorie.`
      );
      return;
    }
    Alert.alert('Supprimer la catégorie ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          updateSetting(
            'categories',
            categories.filter((c) => c.id !== categoryId)
          ),
      },
    ]);
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Autorisation refusée',
          'Active les notifications dans les réglages du système pour recevoir tes rappels.'
        );
        return;
      }
    }
    updateSetting('notifications', value);
  };

  const exportTasks = () =>
    Alert.alert('Exporter mes tâches', 'Choisis un format :', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'JSON', onPress: () => void shareTasks(tasks, 'json') },
      { text: 'CSV', onPress: () => void shareTasks(tasks, 'csv') },
    ]);

  const confirmSignOut = () =>
    Alert.alert('Se déconnecter ?', 'Tes tâches restent enregistrées sur cet appareil.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#fafafa]">
      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Header title="Profil" />

        <View className="items-center">
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${COLORS.primary}18` }}
          >
            <Text className="text-3xl font-bold" style={{ color: COLORS.primary }}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="mt-3 text-2xl font-bold text-gray-900">{user?.name ?? 'Invité'}</Text>
          <Text className="text-gray-500">{user?.email ?? 'Session locale'}</Text>
          {user?.isGuest ? <Text className="mt-1 text-xs text-gray-400">Mode invité</Text> : null}
        </View>

        <View className="mt-7 rounded-2xl bg-white px-4">
          <Text className="pt-4 text-sm font-bold uppercase text-gray-400">Préférences</Text>
          <Row
            title="Rappels avant échéance"
            right={
              <Switch
                value={settings.notifications}
                onValueChange={toggleNotifications}
                trackColor={{ true: COLORS.primary }}
                accessibilityLabel="Activer les rappels"
              />
            }
          />
          <Row
            title={`Archivage auto après ${AUTO_ARCHIVE_DAYS} jours`}
            right={
              <Switch
                value={settings.autoArchive}
                onValueChange={(value) => updateSetting('autoArchive', value)}
                trackColor={{ true: COLORS.primary }}
                accessibilityLabel="Activer l'archivage automatique"
              />
            }
          />
        </View>

        <View className="mt-7 rounded-2xl bg-white px-4 py-4">
          <Text className="text-sm font-bold uppercase text-gray-400">Mes catégories</Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onLongPress={() => removeCategory(category.id)}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer la catégorie ${category.name}`}
                className="flex-row items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <Text className="text-sm font-medium" style={{ color: category.color }}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="mt-2 text-xs text-gray-400">
            Touche longuement une catégorie pour la supprimer.
          </Text>

          <View className="mt-3 flex-row gap-2">
            <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-gray-100 px-3">
              {CATEGORY_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setNewColor(color)}
                  accessibilityRole="button"
                  accessibilityLabel={`Couleur ${color}`}
                  className="h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  {newColor === color ? (
                    <Text className="text-xs leading-none text-white">✓</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={addCategory}
              accessibilityRole="button"
              accessibilityLabel="Ajouter la catégorie"
              className="justify-center rounded-xl px-4"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="font-semibold text-white">Ajouter</Text>
            </Pressable>
          </View>
          <TextInput
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={addCategory}
            placeholder="Nouvelle catégorie…"
            accessibilityLabel="Nom de la nouvelle catégorie"
            className="mt-3 h-11 rounded-xl bg-gray-100 px-4"
          />
        </View>

        <View className="mt-4 rounded-2xl bg-white px-4">
          <Row title="Statistiques" onPress={() => router.push('/stats')} />
          <Row
            title={`Archives (${archives.length})`}
            onPress={() => router.push('/(tabs)/archives')}
          />
          <Row title="Exporter mes tâches (JSON / CSV)" onPress={exportTasks} />
          <Row
            title="Revoir l'introduction"
            onPress={async () => {
              await resetOnboarding();
              router.replace('/onboarding/1');
            }}
          />
          <Row
            title="Déconnexion"
            right={<Text className="font-semibold text-red-500">Se déconnecter</Text>}
            onPress={confirmSignOut}
          />
        </View>

        <Text className="mt-6 text-center text-xs text-gray-400">
          TaskStudent 1.0.0 · données stockées uniquement sur cet appareil
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
