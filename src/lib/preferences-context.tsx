import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-context';

export interface UserPreferences {
  email_alerts: boolean;
  push_alerts: boolean;
  marketing: boolean;
}

const DEFAULTS: UserPreferences = {
  email_alerts: true,
  push_alerts: true,
  marketing: false,
};

interface PreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  update: (patch: Partial<UserPreferences>) => Promise<{ error: string | null }>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULTS);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('email_alerts, push_alerts, marketing')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!data) {
        await supabase.from('user_preferences').insert({ user_id: user.id });
        setPreferences(DEFAULTS);
      } else {
        setPreferences({
          email_alerts: data.email_alerts,
          push_alerts: data.push_alerts,
          marketing: data.marketing,
        });
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  const update = useCallback(async (patch: Partial<UserPreferences>) => {
    if (!user) return { error: 'Not signed in' };
    setPreferences((prev) => ({ ...prev, ...patch }));
    const { error } = await supabase
      .from('user_preferences')
      .update(patch)
      .eq('user_id', user.id);
    return { error: error?.message ?? null };
  }, [user]);

  return (
    <PreferencesContext.Provider value={{ preferences, loading, update }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};
