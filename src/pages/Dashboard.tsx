import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import DepositModal from '@/components/dashboard/DepositModal';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD, getRiskColor, getRiskBgColor } from '@/lib/vaults';
import { Area, AreaChart, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CHART_COLORS = ['#3B82F6', '#F97316', '#14B8A6', '#EAB308'];

const Dashboard = () => {
  const [depositOpen, setDepositOpen] = useState(false);
  const { balance, investments, transactions, vaults, getInvestmentValue, getTotalValue, getTotalPnL } = usePortfolio();

  const totalValue = getTotalValue();
  const totalPnL = getTotalPnL();
  const portfolioTotal = balance + totalValue;

  const pieData = investments.map((inv) => {
    const vault = vaults.find(v => v.id === inv.vaultId);
    return { name: vault?.name || '', value: getInvestmentValue(inv) };
  });

  if (balance > 0 && pieData.length === 0) {
    pieData.push({ name: 'Cash', value: balance });
  } else if (balance > 0) {
    pieData.push({ name: 'Cash', value: balance });
  }

  // Generate simple portfolio value history
  const portfolioHistory = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    value: portfolioTotal * (0.95 + Math.random() * 0.1) * (0.97 + (i / 14) * 0.06),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />

      <div className="container mx-auto px-6 pb-12 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your crypto portfolio</p>
            </div>
            <button
              onClick={() => setDepositOpen(true)}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              + Deposit
            </button>
          </div>

          {/* Stats row */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Portfolio', value: formatUSD(portfolioTotal), sub: null },
              { label: 'Cash Balance', value: formatUSD(balance), sub: null },
              { label: 'Invested', value: formatUSD(totalValue), sub: null },
              { label: 'Profit / Loss', value: `${totalPnL >= 0 ? '+' : ''}${formatUSD(totalPnL)}`, sub: totalPnL >= 0 ? 'text-vault-low' : 'text-destructive' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-5">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`mt-1 font-display text-2xl font-bold ${stat.sub || 'text-foreground'}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="glass-card col-span-2 rounded-xl p-6">
              <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Portfolio Performance</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#portfolioGrad)" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 20%, 22%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }}
                      formatter={(value: number) => [formatUSD(value), 'Value']}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Allocation</h3>
              {pieData.length > 0 && pieData[0].value > 0 ? (
                <div className="flex h-48 items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" paddingAngle={2}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 20%, 22%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }}
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
              <div className="mt-2 space-y-1">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active investments */}
          <div className="mb-8">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Active Investments</h3>
            {investments.length === 0 ? (
              <div className="glass-card flex flex-col items-center rounded-xl p-12 text-center">
                <p className="mb-2 text-muted-foreground">No active investments</p>
                <Link to="/vaults" className="text-sm font-medium text-primary hover:underline">
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
                  return (
                    <Link key={inv.vaultId} to={`/vault/${inv.vaultId}`} className="glass-card rounded-xl p-5 transition-all hover:border-primary/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{vault.icon}</span>
                          <div>
                            <h4 className="font-display font-semibold text-foreground">{vault.name}</h4>
                            <span className={`${getRiskBgColor(vault.risk)} ${getRiskColor(vault.risk)} rounded-full px-2 py-0.5 text-xs font-medium`}>
                              {vault.riskLabel}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-semibold text-foreground">{formatUSD(currentValue)}</p>
                          <p className={`text-xs ${pnl >= 0 ? 'text-vault-low' : 'text-destructive'}`}>
                            {pnl >= 0 ? '+' : ''}{formatUSD(pnl)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Transactions</h3>
            <div className="glass-card overflow-hidden rounded-xl">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-border/50 px-5 py-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                      tx.type === 'deposit' ? 'bg-vault-low/20 text-vault-low' :
                      tx.type === 'invest' ? 'bg-primary/20 text-primary' :
                      tx.type === 'redeem' ? 'bg-vault-medium/20 text-vault-medium' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {tx.type === 'deposit' ? '↓' : tx.type === 'invest' ? '→' : tx.type === 'redeem' ? '←' : '↑'}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">{tx.type}</p>
                      {tx.vaultName && <p className="text-xs text-muted-foreground">{tx.vaultName}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{formatUSD(tx.amount)}</p>
                    <p className="text-xs text-muted-foreground">{tx.date.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
