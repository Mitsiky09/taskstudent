import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { readJSON, remove, writeJSON } from '@/lib/storage';
import { LocalUser } from '@/types';

/**
 * Session **locale**, volontairement sans serveur ni mot de passe vérifié :
 * l'application est hors ligne et ne détient aucune donnée sensible. Le rôle
 * de ce contexte est d'identifier l'utilisateur (prénom affiché) et de servir
 * de garde de navigation, pas d'authentifier au sens sécurité du terme. Cette
 * limite est assumée et documentée dans le README.
 */

interface SessionContextValue {
  user: LocalUser | null;
  loading: boolean;
  signIn: (user: LocalUser) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<LocalUser>) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const GUEST: LocalUser = { name: 'Invité', email: 'invite@local', isGuest: true };

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readJSON<LocalUser | null>(STORAGE_KEYS.user, null).then((stored) => {
      if (active) {
        setUser(stored);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (next: LocalUser) => {
    setUser(next);
    await writeJSON(STORAGE_KEYS.user, next);
  }, []);

  const signIn = useCallback((next: LocalUser) => persist(next), [persist]);

  const signInAsGuest = useCallback(() => persist(GUEST), [persist]);

  const signOut = useCallback(async () => {
    setUser(null);
    await remove(STORAGE_KEYS.user);
  }, []);

  const updateUser = useCallback(
    async (patch: Partial<LocalUser>) => {
      if (!user) return;
      await persist({ ...user, ...patch });
    },
    [persist, user]
  );

  const value = useMemo(
    () => ({ user, loading, signIn, signInAsGuest, signOut, updateUser }),
    [user, loading, signIn, signInAsGuest, signOut, updateUser]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession doit être utilisé dans un SessionProvider');
  return context;
}
