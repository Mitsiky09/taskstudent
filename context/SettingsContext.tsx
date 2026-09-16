import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/constants';
import { readJSON, writeJSON } from '@/lib/storage';
import { cancelAll } from '@/lib/notifications';
import { Settings } from '@/types';

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readJSON<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS).then((stored) => {
      if (active) {
        setSettings({ ...DEFAULT_SETTINGS, ...stored });
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((previous) => {
      const next = { ...previous, [key]: value };
      void writeJSON(STORAGE_KEYS.settings, next);
      return next;
    });
    if (key === 'notifications' && value === false) {
      void cancelAll();
    }
  }, []);

  const value = useMemo(
    () => ({ settings, loading, updateSetting }),
    [settings, loading, updateSetting]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings doit être utilisé dans un SettingsProvider');
  return context;
}
