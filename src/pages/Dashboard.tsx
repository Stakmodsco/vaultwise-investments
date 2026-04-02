import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import DepositModal from '@/components/dashboard/DepositModal';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD, getRiskColor, getRiskBgColor } from '@/lib/vaults';
import { getVaultAccent, getVaultIcon3DVariant } from '@/lib/vault-colors';
import { Area, AreaChart, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, XAxis } from 'recharts';
import { Plus, TrendingUp, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Shield, Flame, Gem, Zap } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';

const CHART_COLORS = ['#4F8CFF', '#EF4444', '#22C55E', '#8B5CF6', '#5F6B7A'];

const vaultIconMap: Record<string, typeof Shield> = {
  'bluechip-growth': Shield,
  'alpha-aggressive': Flame,
  'stable-yield': Gem,
  'momentum-trader': Zap,
};

// Animated number component
const AnimatedNumber = ({ value, prefix = '', className = '' }: { value: number; prefix?: string; className?: string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className={className}>{prefix}{formatUSD(display)}</span>;
};

const Dashboard = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '7D' | '30D' | 'All'>('7D');
  const { balance, investments, transactions, vaults, getInvestmentValue, getTotalValue, getTotalPnL } = usePortfolio();

  const totalValue = getTotalValue();
  const totalPnL = getTotalPnL();
  const portfolioTotal = balance + totalValue;
  const pnlPercent = totalValue > 0 ? ((totalPnL / (totalValue - totalPnL)) * 100) : 0;

  const pieData = investments.map((inv) => {
    const vault = vaults.find(v => v.id === inv.vaultId);
    return { name: vault?.name || '', value: getInvestmentValue(inv), id: inv.vaultId };
  });
  if (balance > 0) pieData.push({ name: 'Cash', value: balance, id: 'cash' });

  const dataPoints = chartPeriod === '1D' ? 24 : chartPeriod === '7D' ? 14 : chartPeriod === '30D' ? 30 : 60;
  const portfolioHistory = Array.from({ length: dataPoints }, (_, i) => ({
    day: i + 1,
    value: portfolioTotal * (0.94 + Math.random() * 0.08) * (0.97 + (i / dataPoints) * 0.06),
  }));

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />

      <div className="container mx-auto px-6 pb-12 pt-24">
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Header */}
          <motion.div variants={item} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your crypto portfolio</p>
            </div>
            <button
              onClick={() => setDepositOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 glow-blue"
            >
              <Plus size={16} />
              Deposit
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Portfolio', value: portfolioTotal, icon: Wallet, variant: 'blue' as const, prefix: '' },
              { label: 'Cash Balance', value: balance, icon: PiggyBank, variant: 'teal' as const, prefix: '' },
              { label: 'Invested', value: totalValue, icon: TrendingUp, variant: 'green' as const, prefix: '' },
              { label: 'Profit / Loss', value: totalPnL, icon: totalPnL >= 0 ? ArrowUpRight : ArrowDownRight, variant: totalPnL >= 0 ? 'green' as const : 'red' as const, prefix: totalPnL >= 0 ? '+' : '' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <Icon3D icon={stat.icon} variant={stat.variant} size="sm" />
                </div>
                <AnimatedNumber
                  value={stat.value}
                  prefix={stat.prefix}
                  className={`font-display text-2xl font-bold ${
                    stat.label === 'Profit / Loss'
                      ? totalPnL >= 0 ? 'text-vault-low' : 'text-destructive'
                      : 'text-foreground'
                  }`}
                />
                {stat.label === 'Profit / Loss' && totalValue > 0 && (
                  <p className={`mt-1 text-xs ${totalPnL >= 0 ? 'text-vault-low' : 'text-destructive'}`}>
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </p>
                )}
              </div>
            ))}
          </motion.div>

          {/* Charts */}
          <motion.div variants={item} className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="glass-card col-span-1 rounded-2xl p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-foreground">Portfolio Performance</h3>
                <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
                  {(['1D', '7D', '30D', 'All'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        chartPeriod === period ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4F8CFF" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#4F8CFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5F6B7A' }} axisLine={false} tickLine={false} />
                    <Area type="monotone" dataKey="value" stroke="#4F8CFF" strokeWidth={2.5} fill="url(#portfolioGrad)" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(215, 28%, 10%)',
                        border: '1px solid hsl(215, 15%, 22%)',
                        borderRadius: '12px',
                        color: '#E6EDF3',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      }}
                      formatter={(value: number) => [formatUSD(value), 'Value']}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Allocation</h3>
              {pieData.length > 0 && pieData[0].value > 0 ? (
                <div className="flex h-48 items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={45} dataKey="value" paddingAngle={3} strokeWidth={0}>
                        {pieData.map((entry, i) => {
                          const color = entry.id === 'cash' ? '#5F6B7A' : (getVaultAccent(entry.id)?.stroke || CHART_COLORS[i]);
                          return <Cell key={i} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(215, 28%, 10%)',
                          border: '1px solid hsl(215, 15%, 22%)',
                          borderRadius: '12px',
                          color: '#E6EDF3',
                        }}
                        formatter={(value: number) => [formatUSD(value)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No investments yet
                </div>
              )}
              <div className="mt-3 space-y-2">
                {pieData.map((d, i) => {
                  const color = d.id === 'cash' ? '#5F6B7A' : (getVaultAccent(d.id)?.stroke || CHART_COLORS[i]);
                  return (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                        {d.name}
                      </div>
                      <span className="font-medium text-secondary-foreground">{formatUSD(d.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Active investments */}
          <motion.div variants={item} className="mb-8">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Active Investments</h3>
            {investments.length === 0 ? (
              <div className="glass-card flex flex-col items-center rounded-2xl p-14 text-center">
                <Icon3D icon={TrendingUp} variant="blue" size="xl" className="mb-4" />
                <p className="mb-2 text-foreground font-medium">No active investments</p>
                <p className="mb-4 text-sm text-muted-foreground">Start growing your portfolio by investing in a vault.</p>
                <Link to="/vaults" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110">
                  Explore Vaults →
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {investments.map((inv) => {
                  const vault = vaults.find(v => v.id === inv.vaultId);
                  if (!vault) return null;
                  const currentValue = getInvestmentValue(inv);
                  const pnl = currentValue - inv.investedAmount;
                  const IconComp = vaultIconMap[vault.id] || Shield;
                  const variant = getVaultIcon3DVariant(vault.id);
                  return (
                    <Link key={inv.vaultId} to={`/vault/${inv.vaultId}`} className="glass-card glass-card-lift rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon3D icon={IconComp} variant={variant} size="lg" animate />
                          <div>
                            <h4 className="font-display font-semibold text-foreground">{vault.name}</h4>
                            <span className={`${getRiskBgColor(vault.risk)} ${getRiskColor(vault.risk)} rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}>
                              {vault.riskLabel}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-semibold text-foreground">{formatUSD(currentValue)}</p>
                          <p className={`flex items-center justify-end gap-1 text-xs font-medium ${pnl >= 0 ? 'text-vault-low' : 'text-destructive'}`}>
                            {pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {pnl >= 0 ? '+' : ''}{formatUSD(pnl)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Transactions */}
          <motion.div variants={item}>
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Transactions</h3>
            <div className="glass-card overflow-hidden rounded-2xl">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-border/30 px-5 py-4 last:border-0 transition-colors duration-200 hover:bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Icon3D
                      icon={tx.type === 'deposit' ? ArrowDownRight :
                            tx.type === 'invest' ? ArrowUpRight :
                            tx.type === 'redeem' ? ArrowDownRight :
                            ArrowUpRight}
                      variant={tx.type === 'deposit' ? 'green' :
                               tx.type === 'invest' ? 'blue' :
                               tx.type === 'redeem' ? 'amber' : 'red'}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">{tx.type}</p>
                      {tx.vaultName && <p className="text-xs text-muted-foreground">{tx.vaultName}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatUSD(tx.amount)}</p>
                    <p className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
