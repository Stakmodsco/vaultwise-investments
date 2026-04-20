import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  variant: 'leaf' | 'forest' | 'gold' | 'ember';
  icon: LucideIcon;
  date: Date;
  read: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  push: (n: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
  registerPriceTick: (vaultId: string, vaultName: string, prevPrice: number, nextPrice: number) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const MAX_NOTIFICATIONS = 30;
// Threshold for a "significant" tick — ±2%
const PRICE_THRESHOLD = 0.02;

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // throttle per-vault so we don't spam
  const lastFiredRef = useRef<Record<string, number>>({});

  const push = useCallback((n: Omit<Notification, 'id' | 'date' | 'read'>) => {
    setNotifications((prev) => [
      { ...n, id: Math.random().toString(36).slice(2), date: new Date(), read: false },
      ...prev,
    ].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const registerPriceTick = useCallback((vaultId: string, vaultName: string, prevPrice: number, nextPrice: number) => {
    if (!prevPrice) return;
    const change = (nextPrice - prevPrice) / prevPrice;
    if (Math.abs(change) < PRICE_THRESHOLD) return;

    // Cooldown: 30s per vault
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
      title,
      description,
      variant: positive ? 'leaf' : 'ember',
      icon: positive ? TrendingUp : TrendingDown,
    });

    toast(title, {
      description,
      className: positive ? 'border-vault-low/40' : 'border-destructive/40',
    });
  }, [push]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Seed a friendly welcome notification once per session
  useEffect(() => {
    push({
      title: 'Live price alerts enabled',
      description: 'You\'ll be notified when a vault moves ±2% in a tick.',
      variant: 'forest',
      icon: TrendingUp,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, push, markAllRead, clear, registerPriceTick }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

// Helper to format relative time
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
