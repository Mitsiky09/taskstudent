import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, router } from 'expo-router'; // 👈 Importe "router" ici
import { Ionicons } from '@expo/vector-icons';
import { shadows, theme, withAlpha } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: string;
  label: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
}

const VISIBLE_TABS: TabConfig[] = [
  { name: 'index', label: 'Accueil', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { name: 'upcoming', label: 'Auj', activeIcon: 'today', inactiveIcon: 'today-outline' },
  { name: 'calendar', label: 'Agenda', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  { name: 'profile', label: 'Profil', activeIcon: 'person', inactiveIcon: 'person-outline' },
];

/**
 * Couleurs de la barre d'onglets, reprises des tokens du design system.
 * La structure et les animations de cette barre sont figées : seule la
 * palette est centralisée ici (l'ancien `#5f58ea` du bouton « + » est
 * désormais exactement la couleur de marque).
 */
const PRIMARY_COLOR = theme.colors.primary;
const ACTIVE_BG_TINT = theme.colors.primarySoft;
const FAB_COLOR = theme.colors.primary;
const INACTIVE_COLOR = theme.colors.textMuted;

type TabBarProps = ComponentProps<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>;

function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]}
    >
      {/* Barre d'onglets principale */}
      <View style={styles.capsule} onStartShouldSetResponder={() => true}>
        {VISIBLE_TABS.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;

          const index = state.routes.indexOf(route);
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? tab.label}
              style={({ pressed }) => [
                styles.tabButton,
                isFocused && styles.tabButtonActive,
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
            >
              <Ionicons
                name={isFocused ? tab.activeIcon : tab.inactiveIcon}
                size={28}
                color={isFocused ? PRIMARY_COLOR : INACTIVE_COLOR}
                style={styles.iconCenter}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Bouton "+" qui ouvre le Bottom Sheet Todoist */}
      <View style={styles.fabContainer} onStartShouldSetResponder={() => true}>
        <Pressable
          onPress={() => router.push('/task/new')} // 👈 Redirige vers notre superbe écran de création !
          accessibilityRole="button"
          accessibilityLabel="Ajouter une tâche"
          style={({ pressed }) => [
            styles.fabPressable,
            pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 },
          ]}
        >
          <Ionicons name="add" size={36} color={theme.colors.onPrimary} style={styles.iconCenter} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 1000,
  },
  capsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 20,
    marginRight: 12,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.border, 0.8),
    ...shadows.raised,
  },
  tabButton: {
    padding: 8,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: ACTIVE_BG_TINT,
  },
  fabContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FAB_COLOR,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.floating,
  },
  fabPressable: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FAB_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenter: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="upcoming" options={{ title: 'Auj' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="archives" options={{ href: null }} />
    </Tabs>
  );
}
