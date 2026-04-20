import { useEffect, useRef } from 'react';
import { usePortfolio } from '@/lib/portfolio-context';
import { useNotifications } from '@/lib/notifications-context';

/**
 * Simulates per-vault price ticks every few seconds. When a vault moves
 * beyond the configured threshold, the notifications context fires a
 * real-time alert (toast + bell entry).
 *
 * Mounted once at the app root so it runs across routes.
 */
const PriceTickSimulator = () => {
  const { vaults } = usePortfolio();
  const { registerPriceTick } = useNotifications();
  const pricesRef = useRef<Record<string, number>>({});

  // Seed with current unit prices on mount
  useEffect(() => {
    vaults.forEach((v) => {
      if (pricesRef.current[v.id] === undefined) {
        pricesRef.current[v.id] = v.unitPrice;
      }
    });
  }, [vaults]);

  useEffect(() => {
    const interval = setInterval(() => {
      vaults.forEach((v) => {
        const prev = pricesRef.current[v.id] ?? v.unitPrice;
        // Volatility tuned per risk
        const vol =
          v.risk === 'high' ? 0.025 :
          v.risk === 'medium' ? 0.015 :
          v.risk === 'low' ? 0.008 : 0.004;
        // Bias slightly upward to mimic positive ROI vaults
        const drift = 0.0015;
        const change = (Math.random() - 0.5) * 2 * vol + drift;
        const next = Math.max(0.01, prev * (1 + change));
        pricesRef.current[v.id] = next;
        registerPriceTick(v.id, v.name, prev, next);
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [vaults, registerPriceTick]);

  return null;
};

export default PriceTickSimulator;
