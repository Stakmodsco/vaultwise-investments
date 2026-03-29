import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vault, getRiskColor, getRiskBgColor, formatCurrency } from '@/lib/vaults';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface VaultCardProps {
  vault: Vault;
  index: number;
}

const VaultCard = ({ vault, index }: VaultCardProps) => {
  const riskTextClass = getRiskColor(vault.risk);
  const riskBgClass = getRiskBgColor(vault.risk);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/vault/${vault.id}`} className="block">
        <div className="glass-card group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
          <div className={`absolute inset-0 bg-gradient-to-br ${vault.color} opacity-0 transition-opacity group-hover:opacity-100`} />
          
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-1 text-2xl">{vault.icon}</div>
                <h3 className="font-display text-lg font-semibold text-foreground">{vault.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{vault.focus}</p>
              </div>
              <span className={`${riskBgClass} ${riskTextClass} rounded-full px-3 py-1 text-xs font-medium`}>
                {vault.riskLabel}
              </span>
            </div>

            <div className="mb-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vault.performanceData}>
                  <defs>
                    <linearGradient id={`gradient-${vault.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    fill={`url(#gradient-${vault.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className="font-display text-xl font-bold text-vault-low">+{vault.roi}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">TVL</p>
                <p className="font-display text-sm font-semibold text-foreground">{formatCurrency(vault.tvl)}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VaultCard;
