import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-context';

export interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ error: string | null; url?: string }>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile(data ?? { display_name: null, avatar_url: null });
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!user) return { error: 'Not signed in' };
    const { error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('user_id', user.id);
    if (error) return { error: error.message };
    setProfile((prev) => ({ ...(prev ?? { display_name: null, avatar_url: null }), ...patch }));
    return { error: null };
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { error: 'Not signed in' };
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return { error: upErr.message };
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: updErr } = await updateProfile({ avatar_url: publicUrl });
    if (updErr) return { error: updErr };
    return { error: null, url: publicUrl };
  }, [user, updateProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, updateProfile, uploadAvatar }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
};
