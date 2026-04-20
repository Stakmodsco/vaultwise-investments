import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePortfolio } from './portfolio-context';
import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';
import { computeUserRank, getUserAchievements, achievementMeta, type AchievementId, type LeaderUser } from './leaderboard';
import { celebrate } from './celebrate';

const STORAGE_KEY = 'vaultx:earnedBadges';

/**
 * Watches the user's portfolio for newly-crossed achievement thresholds and
 * fires a confetti animation, celebratory toast, and a Cloud notification.
 * Earned-badge state is cached in localStorage per-user so we don't re-trigger.
 */
const AchievementWatcher = () => {
  const { user } = useAuth();
  const { investments, getTotalValue, getTotalPnL, loading } = usePortfolio();
  const { push } = useNotifications();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user || loading) return;

    const totalValue = getTotalValue();
    const totalPnL = getTotalPnL();
    const portfolioTotal = totalValue; // for badges, use invested+pnl basis — close enough
    const pnlPct = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    const { rank } = computeUserRank(portfolioTotal, pnlPct);
    const youUser: LeaderUser = {
      id: 'you', name: 'You', handle: '@you', vault: 'You',
      portfolio: portfolioTotal, pnlPct, streak: 0,
    };
    const earned = getUserAchievements(youUser, rank);

    const key = `${STORAGE_KEY}:${user.id}`;
    let prev: AchievementId[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) prev = JSON.parse(raw);
    } catch { /* noop */ }

    // First load after sign-in: just sync, no celebration
    if (!initializedRef.current) {
      initializedRef.current = true;
      localStorage.setItem(key, JSON.stringify(earned));
      return;
    }

    const newlyEarned = earned.filter((id) => !prev.includes(id));
    if (newlyEarned.length > 0) {
      newlyEarned.forEach((aid) => {
        const meta = achievementMeta[aid];
        celebrate();
        toast.success(`🏆 Achievement unlocked: ${meta.label}`, {
          description: meta.description,
          duration: 6000,
        });
        push({
          title: `Achievement unlocked: ${meta.label}`,
          description: meta.description,
          variant: meta.variant === 'ember' ? 'gold' : meta.variant,
        });
      });
      localStorage.setItem(key, JSON.stringify(earned));
    } else if (earned.length !== prev.length) {
      // sync if achievements were lost (e.g. portfolio reset)
      localStorage.setItem(key, JSON.stringify(earned));
    }
  }, [user, investments, loading, getTotalValue, getTotalPnL, push]);

  // Reset init flag when user changes
  useEffect(() => {
    initializedRef.current = false;
  }, [user]);

  return null;
};

export default AchievementWatcher;
