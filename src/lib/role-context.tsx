import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-context';

interface RoleContextType {
  isAdmin: boolean;
  loading: boolean;
}

const Ctx = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) { setIsAdmin(false); setLoading(false); return; }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!cancelled) {
        setIsAdmin(!!data);
        setLoading(false);
      }
    };
    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [user]);

  return <Ctx.Provider value={{ isAdmin, loading }}>{children}</Ctx.Provider>;
};

export const useRole = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};
