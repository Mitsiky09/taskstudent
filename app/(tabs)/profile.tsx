import { ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import TextField from '@/components/ui/TextField';
import Header from '@/components/Header';
import { AUTO_ARCHIVE_DAYS, CATEGORY_COLORS } from '@/constants';
import { theme, withAlpha } from '@/constants/theme';
import { useSession } from '@/context/SessionContext';
import { useSettings } from '@/context/SettingsContext';
import { useTasks } from '@/hooks/useTasks';
import { shareTasks } from '@/lib/export';
import { requestPermission } from '@/lib/notifications';
import { resetOnboarding } from '@/lib/onboarding';
import { archivedTasks } from '@/lib/tasks';

/** Ligne de réglage : même hauteur, même séparateur et même chevron partout. */
function Row({
  title,
  right,
  onPress,
  tone = 'default',
}: {
  title: string;
  right?: ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-row items-center border-b border-line-soft py-4 active:opacity-70"
    >
      <Text
        className={`flex-1 text-base ${tone === 'danger' ? 'font-semibold text-danger' : 'text-ink'}`}
      >
        {title}
      </Text>
      {right ??
        (onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.icon} /> : null)}
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
    const exists = categories.some((c) => c.name.trim().toLowerCase() === name.toLowerCase());
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
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 120 }}>
        <Header title="Profil" />

        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-50">
            <Text className="text-3xl font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="mt-3 text-2xl font-bold tracking-tight text-ink">
            {user?.name ?? 'Invité'}
          </Text>
          <Text className="text-sm text-muted">{user?.email ?? 'Session locale'}</Text>
          {user?.isGuest ? <Text className="mt-1 text-xs text-faint">Mode invité</Text> : null}
        </View>

        <Card padded={false} className="mt-7 px-5">
          <Text className="pt-5 text-xs font-semibold uppercase tracking-wider text-faint">
            Préférences
          </Text>
          <Row
            title="Rappels avant échéance"
            right={
              <Switch
                value={settings.notifications}
                onValueChange={toggleNotifications}
                trackColor={{ true: theme.colors.primary }}
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
                trackColor={{ true: theme.colors.primary }}
                accessibilityLabel="Activer l'archivage automatique"
              />
            }
          />
        </Card>

        <Card className="mt-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-faint">
            Mes catégories
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onLongPress={() => removeCategory(category.id)}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer la catégorie ${category.name}`}
                className="flex-row items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3"
                style={{ backgroundColor: withAlpha(category.color, 0.14) }}
              >
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <Text className="text-sm font-semibold" style={{ color: category.color }}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="mt-2 text-xs text-faint">
            Touche longuement une catégorie pour la supprimer.
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2 rounded-2xl bg-surface-muted p-3">
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
                  <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />
                ) : null}
              </Pressable>
            ))}
          </View>

          <View className="mt-3 flex-row gap-2">
            <TextField
              value={newCategory}
              onChangeText={setNewCategory}
              onSubmitEditing={addCategory}
              placeholder="Nouvelle catégorie…"
              accessibilityLabel="Nom de la nouvelle catégorie"
              containerClassName="flex-1"
            />
            <Pressable
              onPress={addCategory}
              accessibilityRole="button"
              accessibilityLabel="Ajouter la catégorie"
              className="justify-center rounded-2xl bg-primary px-4 active:opacity-90"
            >
              <Text className="font-semibold text-white">Ajouter</Text>
            </Pressable>
          </View>
        </Card>

        <Card padded={false} className="mt-5 px-5">
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
          <Row title="Déconnexion" onPress={confirmSignOut} tone="danger" />
        </Card>

        <Text className="mt-6 text-center text-xs text-faint">
          TaskStudent 1.0.0 · données stockées uniquement sur cet appareil
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
