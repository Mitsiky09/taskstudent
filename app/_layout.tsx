import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { SessionProvider } from '@/context/SessionContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { TasksProvider } from '@/context/TasksContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <SessionProvider>
            <TasksProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.colors.background },
                }}
              >
                {/* On déclare les onglets */}
                <Stack.Screen name="(tabs)" />

                {/* ✅ "task/new" en modal transparent pour l'effet Bottom Sheet */}
                <Stack.Screen
                  name="task/new"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'fade',
                    contentStyle: { backgroundColor: 'transparent' },
                  }}
                />
              </Stack>
            </TasksProvider>
          </SessionProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
