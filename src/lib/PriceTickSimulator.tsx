import { useEffect, useRef } from 'react';
import { usePortfolio } from '@/lib/portfolio-context';
import { useNotifications } from '@/lib/notifications-context';
import { useAuth } from '@/lib/auth-context';

/**
 * Per-vault price tick simulator that fires real-time notifications when a
 * vault moves more than ±2% in a single tick. Only runs while a user is
 * authenticated so notifications can be persisted to Cloud.
 */
const PriceTickSimulator = () => {
  const { user } = useAuth();
  const { vaults } = usePortfolio();
  const { registerPriceTick } = useNotifications();
  const pricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    vaults.forEach((v) => {
      if (pricesRef.current[v.id] === undefined) {
        pricesRef.current[v.id] = v.unitPrice;
      }
    });
  }, [vaults]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      vaults.forEach((v) => {
        const prev = pricesRef.current[v.id] ?? v.unitPrice;
        const vol =
          v.risk === 'high' ? 0.025 :
          v.risk === 'medium' ? 0.015 :
          v.risk === 'low' ? 0.008 : 0.004;
        const drift = 0.0015;
        const change = (Math.random() - 0.5) * 2 * vol + drift;
        const next = Math.max(0.01, prev * (1 + change));
        pricesRef.current[v.id] = next;
        registerPriceTick(v.id, v.name, prev, next);
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [user, vaults, registerPriceTick]);

  return null;
};

export default PriceTickSimulator;
