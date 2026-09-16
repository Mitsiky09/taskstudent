import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Rappels locaux.
 *
 * Le module `expo-notifications` est chargé paresseusement : s'il n'est pas
 * disponible (notamment dans Expo Go sur Android), l'application continue
 * de fonctionner normalement sans bloquer la création de tâches.
 */

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

// Détecte si l'app tourne dans Expo Go sur Android
const isExpoGoAndroid =
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function load(): NotificationsModule | null {
  if (cached !== undefined) return cached;

  // On ignore complètement les notifications dans Expo Go sur Android pour éviter le crash
  if (isExpoGoAndroid || Platform.OS === 'web') {
    cached = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    console.warn('[notifications] module indisponible : rappels désactivés');
    cached = null;
  }
  return cached;
}

export async function requestPermission(): Promise<boolean> {
  const Notifications = load();
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Programme un rappel et renvoie son identifiant, ou `null` si la date est
 * déjà passée ou si la permission est refusée.
 */
export async function scheduleReminder(title: string, date: Date): Promise<string | null> {
  const Notifications = load();
  if (!Notifications) return null;
  if (date.getTime() <= Date.now()) return null;

  try {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    const trigger = Notifications.SchedulableTriggerInputTypes
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        }
      : date;

    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Échéance proche', body: title },
      trigger: trigger as any,
    });
  } catch (error) {
    console.warn('[notifications] programmation impossible', error);
    return null;
  }
}

export async function cancelAll(): Promise<void> {
  const Notifications = load();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[notifications] annulation impossible', error);
  }
}