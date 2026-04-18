import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowUpRight, TrendingUp } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';
import AchievementBadge from '@/components/leaderboard/AchievementBadge';
import { computeUserRank, getUserAchievements, type LeaderUser } from '@/lib/leaderboard';
import { formatUSD } from '@/lib/vaults';

interface YourRankCardProps {
  portfolio: number;
  pnlPct: number;
}

const YourRankCard = ({ portfolio, pnlPct }: YourRankCardProps) => {
  const { rank, total, sorted } = computeUserRank(portfolio, pnlPct);
  const youIndex = sorted.findIndex((u) => u.id === 'you');
  const ahead = sorted[youIndex - 1] as LeaderUser | undefined;
  const behind = sorted[youIndex + 1] as LeaderUser | undefined;

  // Distance to next rank
  const gapToNext = ahead ? Math.max(0, ahead.pnlPct - pnlPct) : 0;

  // Synthetic "you" entry to compute achievements
  const youUser: LeaderUser = {
    id: 'you',
    name: 'You',
    handle: '@you',
    vault: 'Your Portfolio',
    portfolio,
    pnlPct,
    streak: 0,
  };
  const myBadges = getUserAchievements(youUser, rank);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card glass-card-lift relative overflow-hidden rounded-2xl p-6"
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: rank */}
        <div className="flex items-center gap-4">
          <div className="trophy-shine">
            <Icon3D icon={Trophy} variant="gold" size="xl" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your Leaderboard Rank
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold gradient-text-sun">#{rank}</span>
              <span className="text-sm text-muted-foreground">of {total}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-vault-low">
              <TrendingUp size={11} />
              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}% return
            </p>
          </div>
        </div>

        {/* Middle: badges */}
        {myBadges.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your Badges
            </p>
            <div className="flex gap-2">
              {myBadges.map((aid) => (
                <AchievementBadge key={aid} id={aid} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Right: gap + CTA */}
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {ahead ? (
            <div className="text-left sm:text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Next up</p>
              <p className="font-display text-sm font-semibold text-foreground">{ahead.name}</p>
              <p className="text-xs text-accent">+{gapToNext.toFixed(2)}% to overtake</p>
            </div>
          ) : (
            <div className="text-left sm:text-right">
              <p className="font-display text-sm font-bold text-accent">👑 Champion</p>
              <p className="text-xs text-muted-foreground">You lead the pack</p>
            </div>
          )}
          <Link
            to="/leaderboard"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 glow-blue"
          >
            View Standings
            <ArrowUpRight size={12} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Surrounding rivals strip */}
      {(ahead || behind) && (
        <div className="relative mt-5 flex items-center justify-between gap-2 rounded-xl bg-secondary/40 px-4 py-3">
          {ahead ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">↑ Ahead</p>
              <p className="truncate text-xs font-medium text-foreground">
                #{rank - 1} {ahead.name} · +{ahead.pnlPct.toFixed(2)}%
              </p>
            </div>
          ) : <div className="flex-1" />}
          <div className="h-8 w-px bg-border" />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10px] uppercase tracking-wider text-accent">You · #{rank}</p>
            <p className="truncate text-xs font-bold text-foreground">
              {formatUSD(portfolio)} · +{pnlPct.toFixed(2)}%
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          {behind ? (
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">↓ Behind</p>
              <p className="truncate text-xs font-medium text-foreground">
                #{rank + 1} {behind.name} · +{behind.pnlPct.toFixed(2)}%
              </p>
            </div>
          ) : <div className="flex-1" />}
        </div>
      )}
    </motion.div>
  );
};

export default YourRankCard;
