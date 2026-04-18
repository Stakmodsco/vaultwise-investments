import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Icon3D from '@/components/ui/Icon3D';
import AchievementBadge from '@/components/leaderboard/AchievementBadge';
import { Trophy, Medal, Award, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { formatUSD } from '@/lib/vaults';
import { seedUsers, getUserAchievements, type LeaderUser } from '@/lib/leaderboard';

const periods = ['24h', '7d', '30d', 'All'] as const;
type Period = typeof periods[number];

const Leaderboard = () => {
  const [period, setPeriod] = useState<Period>('7d');
  const [users, setUsers] = useState<LeaderUser[]>(seedUsers);

  // Simulate live shuffle of rankings every few seconds
  useEffect(() => {
    const tick = setInterval(() => {
      setUsers(prev => {
        const next = prev.map(u => ({
          ...u,
          pnlPct: Math.max(2, u.pnlPct + (Math.random() - 0.5) * 1.4),
          portfolio: u.portfolio * (1 + (Math.random() - 0.5) * 0.012),
        }));
        return next.sort((a, b) => b.pnlPct - a.pnlPct);
      });
    }, 3500);
    return () => clearInterval(tick);
  }, [period]);

  const podiumIcons = [Crown, Trophy, Medal] as const;
  const podiumVariants = ['gold', 'forest', 'leaf'] as const;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <Navbar />
      <div className="container mx-auto px-6 pt-[88px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="trophy-shine">
              <Icon3D icon={Trophy} variant="gold" size="xl" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Top <span className="gradient-text-sun">Performers</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Live rankings — simulated competitive returns across all vaults
              </p>
            </div>
          </div>

          <div className="flex gap-1 rounded-2xl bg-secondary/60 p-1 self-start sm:self-auto">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  period === p
                    ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.4)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Podium - top 3 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-10 grid gap-4 sm:grid-cols-3"
        >
          {users.slice(0, 3).map((u, i) => {
            const Icon = podiumIcons[i];
            const variant = podiumVariants[i];
            const order = [1, 0, 2][i]; // 2nd, 1st, 3rd visual order on desktop
            return (
              <motion.div
                key={u.id}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`glass-card glass-card-lift relative rounded-3xl p-6 text-center sm:order-${order} ${
                  i === 0 ? 'sm:scale-105 ring-2 ring-accent/40' : ''
                }`}
              >
                {i === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-md">
                    #1 Champion
                  </div>
                )}
                <div className="mb-3 flex justify-center">
                  <Icon3D icon={Icon} variant={variant} size="xl" animate />
                </div>
                <p className="font-display text-lg font-bold text-foreground">{u.name}</p>
                <p className="mb-3 text-xs text-muted-foreground">{u.handle}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={u.pnlPct.toFixed(1)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="font-display text-3xl font-bold gradient-text-sun"
                  >
                    +{u.pnlPct.toFixed(2)}%
                  </motion.p>
                </AnimatePresence>
                <p className="mt-1 text-xs text-muted-foreground">{formatUSD(u.portfolio)} portfolio</p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-vault-low/10 px-2.5 py-1 text-[10px] font-semibold text-vault-low">
                  <Sparkles size={10} />
                  {u.streak}d streak
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  {getUserAchievements(u, i + 1).map((aid) => (
                    <AchievementBadge key={aid} id={aid} size="sm" />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Full ranking list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card overflow-hidden rounded-2xl"
        >
          <div className="hidden grid-cols-12 gap-4 border-b border-border/40 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Investor</div>
            <div className="col-span-3">Top Vault</div>
            <div className="col-span-2 text-right">Portfolio</div>
            <div className="col-span-2 text-right">Return</div>
          </div>

          <motion.ul layout className="divide-y divide-border/30">
            <AnimatePresence>
              {users.map((u, i) => (
                <motion.li
                  key={u.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-secondary/30"
                >
                  <div className="col-span-2 sm:col-span-1">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-bold ${
                        i === 0
                          ? 'bg-accent text-accent-foreground glow-gold'
                          : i === 1
                          ? 'bg-primary/20 text-primary'
                          : i === 2
                          ? 'bg-vault-low/20 text-vault-low'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <p className="font-display text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.handle}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {getUserAchievements(u, i + 1).map((aid) => (
                        <AchievementBadge key={aid} id={aid} size="sm" />
                      ))}
                    </div>
                  </div>

                  <div className="col-span-12 hidden sm:col-span-3 sm:block">
                    <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                      {u.vault}
                    </span>
                  </div>

                  <div className="col-span-4 text-right sm:col-span-2">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {formatUSD(u.portfolio)}
                    </p>
                    <p className="text-[10px] text-muted-foreground sm:hidden">{u.vault}</p>
                  </div>

                  <div className="col-span-12 sm:col-span-2 sm:text-right">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={u.pnlPct.toFixed(1)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center gap-1 rounded-lg bg-vault-low/10 px-2.5 py-1 text-sm font-bold text-vault-low"
                      >
                        <TrendingUp size={12} />
                        +{u.pnlPct.toFixed(2)}%
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card flex items-center justify-center gap-3 rounded-2xl p-5 text-center"
        >
          <Icon3D icon={Award} variant="gold" size="sm" />
          <p className="text-xs text-muted-foreground">
            Rankings are simulated for demonstration. Returns are variable and based on market performance.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
