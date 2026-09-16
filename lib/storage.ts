import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Accès typé à AsyncStorage.
 *
 * Toutes les lectures sont protégées : un stockage corrompu (JSON invalide,
 * écriture interrompue) renvoie la valeur par défaut au lieu de faire planter
 * l'application au démarrage.
 */

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] lecture impossible pour "${key}"`, error);
    return fallback;
  }
}

export async function writeJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] écriture impossible pour "${key}"`, error);
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] suppression impossible pour "${key}"`, error);
  }
}
