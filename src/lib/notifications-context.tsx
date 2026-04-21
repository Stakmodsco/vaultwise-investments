import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Sparkles, type LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './auth-context';

export type NotifVariant = 'leaf' | 'forest' | 'gold' | 'ember';

export interface Notification {
  id: string;
  title: string;
  description: string | null;
  variant: NotifVariant;
  vault_id: string | null;
  vault_name: string | null;
  change_pct: number | null;
  read: boolean;
  date: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  push: (n: { title: string; description?: string; variant?: NotifVariant; vault_id?: string; vault_name?: string; change_pct?: number; toastIt?: boolean }) => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  registerPriceTick: (vaultId: string, vaultName: string, prevPrice: number, nextPrice: number) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const PRICE_THRESHOLD = 0.02; // ±2%

export const variantIcon = (v: NotifVariant): LucideIcon => {
  if (v === 'leaf') return TrendingUp;
  if (v === 'ember') return TrendingDown;
  return Sparkles;
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFiredRef = useRef<Record<string, number>>({});

  const mapRow = (r: any): Notification => ({
    id: r.id,
    title: r.title,
    description: r.description,
    variant: r.variant as NotifVariant,
    vault_id: r.vault_id,
    vault_name: r.vault_name,
    change_pct: r.change_pct !== null ? Number(r.change_pct) : null,
    read: r.read,
    date: new Date(r.created_at),
  });

  // Load + subscribe to realtime per user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        setNotifications((data ?? []).map(mapRow));
        setLoading(false);
      });

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = mapRow(payload.new);
          setNotifications((prev) => {
            if (prev.some((p) => p.id === n.id)) return prev;
            return [n, ...prev].slice(0, 200);
          });
          // In-app push: pop a toast for every incoming notification
          const toastFn = n.variant === 'leaf' ? toast.success : n.variant === 'ember' ? toast.error : toast;
          toastFn(n.title, {
            description: n.description ?? undefined,
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const push = useCallback(async (n: {
    title: string; description?: string; variant?: NotifVariant;
    vault_id?: string; vault_name?: string; change_pct?: number; toastIt?: boolean;
  }) => {
    if (!user) return;
    const variant = n.variant ?? 'leaf';
    const { error } = await supabase.from('notifications').insert({
      user_id: user.id,
      title: n.title,
      description: n.description ?? null,
      variant,
      vault_id: n.vault_id ?? null,
      vault_name: n.vault_name ?? null,
      change_pct: n.change_pct ?? null,
    });
    if (!error && n.toastIt) {
      toast(n.title, { description: n.description });
    }
  }, [user]);

  const registerPriceTick = useCallback((vaultId: string, vaultName: string, prevPrice: number, nextPrice: number) => {
    if (!user || !prevPrice) return;
    const change = (nextPrice - prevPrice) / prevPrice;
    if (Math.abs(change) < PRICE_THRESHOLD) return;
    const now = Date.now();
    const last = lastFiredRef.current[vaultId] || 0;
    if (now - last < 30000) return;
    lastFiredRef.current[vaultId] = now;

    const positive = change > 0;
    const pct = (change * 100).toFixed(2);
    const title = `${vaultName} ${positive ? 'surged' : 'dipped'} ${positive ? '+' : ''}${pct}%`;
    const description = positive
      ? 'Strong upward move detected this tick.'
      : 'Sharp downward move detected this tick.';

    push({
      title, description,
      variant: positive ? 'leaf' : 'ember',
      vault_id: vaultId, vault_name: vaultName, change_pct: change * 100,
      toastIt: true,
    });
  }, [user, push]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, [user]);

  const clear = useCallback(async () => {
    if (!user) return;
    setNotifications([]);
    await supabase.from('notifications').delete().eq('user_id', user.id);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, push, markAllRead, markRead, clear, registerPriceTick }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

export const formatRelative = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
};
