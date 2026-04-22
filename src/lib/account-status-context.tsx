import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-context';

export type AccountState = 'active' | 'locked' | 'blacklisted';
export type KycState = 'not_submitted' | 'pending' | 'approved' | 'rejected';

interface AccountStatus {
  status: AccountState;
  kyc_status: KycState;
  failed_kyc_attempts: number;
  blacklist_reason: string | null;
  locked_at: string | null;
}

interface AccountStatusContextType {
  status: AccountStatus | null;
  loading: boolean;
  isLocked: boolean;
  isBlacklisted: boolean;
  isRestricted: boolean; // locked OR blacklisted
  refresh: () => Promise<void>;
}

const Ctx = createContext<AccountStatusContextType | undefined>(undefined);

export const AccountStatusProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setStatus(null); setLoading(false); return; }
    const { data } = await supabase
      .from('account_status')
      .select('status, kyc_status, failed_kyc_attempts, blacklist_reason, locked_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setStatus(data as AccountStatus);
    else setStatus({ status: 'active', kyc_status: 'not_submitted', failed_kyc_attempts: 0, blacklist_reason: null, locked_at: null });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Realtime so admins flipping status reflects instantly for the user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`account-status-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'account_status', filter: `user_id=eq.${user.id}` },
        () => { refresh(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  const isLocked = status?.status === 'locked';
  const isBlacklisted = status?.status === 'blacklisted';
  const isRestricted = isLocked || isBlacklisted;

  return (
    <Ctx.Provider value={{ status, loading, isLocked, isBlacklisted, isRestricted, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAccountStatus = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAccountStatus must be used within AccountStatusProvider');
  return ctx;
};
