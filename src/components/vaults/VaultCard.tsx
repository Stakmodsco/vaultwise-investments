import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Flame, Gem, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Vault, getRiskColor, getRiskBgColor, formatCurrency } from '@/lib/vaults';
import { getVaultAccent, getVaultIcon3DVariant } from '@/lib/vault-colors';
import { usePortfolio } from '@/lib/portfolio-context';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import Icon3D from '@/components/ui/Icon3D';

const vaultIconMap: Record<string, typeof Shield> = {
  'bluechip-growth': Shield,
  'alpha-aggressive': Flame,
  'stable-yield': Gem,
  'momentum-trader': Zap,
};

const formatAgo = (date?: Date): string => {
  if (!date) return 'syncing…';
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
};

interface VaultCardProps {
  vault: Vault;
  index: number;
}

const VaultCard = ({ vault, index }: VaultCardProps) => {
  const riskTextClass = getRiskColor(vault.risk);
  const riskBgClass = getRiskBgColor(vault.risk);
  const accent = getVaultAccent(vault.id);
  const IconComp = vaultIconMap[vault.id] || Shield;
  const icon3DVariant = getVaultIcon3DVariant(vault.id);
  const { priceUpdatedAt } = usePortfolio();
  const updatedAt = priceUpdatedAt[vault.id];
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const isFresh = updatedAt && Date.now() - updatedAt.getTime() < 90_000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/vault/${vault.id}`} className="block group">
        <div
          className="glass-card glass-card-lift relative overflow-hidden rounded-2xl p-6"
          style={{ '--card-glow': accent.glow } as React.CSSProperties}
        >
          {/* Accent glow on hover */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
            style={{ background: accent.stroke }}
          />

          <div className="relative z-10">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Icon3D icon={IconComp} variant={icon3DVariant} size="lg" animate />
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{vault.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{vault.focus}</p>
                </div>
              </div>
              <span className={`${riskBgClass} ${riskTextClass} rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide`}>
                {vault.riskLabel}
              </span>
            </div>

            <div className="mb-5 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vault.performanceData}>
                  <defs>
                    <linearGradient id={`gradient-${vault.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent.stroke} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={accent.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={accent.stroke}
                    strokeWidth={2}
                    fill={`url(#gradient-${vault.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ROI</p>
                <p className={`font-display text-2xl font-bold ${accent.text}`}>+{vault.roi}%</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">TVL</p>
                <p className="font-display text-sm font-semibold text-foreground">{formatCurrency(vault.tvl)}</p>
              </div>
            </div>

            <button
              className="mt-5 w-full rounded-xl bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground"
            >
              Invest
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VaultCard;
