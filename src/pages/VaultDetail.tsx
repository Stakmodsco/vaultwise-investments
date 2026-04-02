import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD, getRiskColor, getRiskBgColor } from '@/lib/vaults';
import { getVaultAccent, getVaultIcon3DVariant } from '@/lib/vault-colors';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Shield, Flame, Gem, Zap, TrendingUp, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';

const vaultIconMap: Record<string, typeof Shield> = {
  'bluechip-growth': Shield,
  'alpha-aggressive': Flame,
  'stable-yield': Gem,
  'momentum-trader': Zap,
};

const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vaults, balance, investments, invest, withdraw, getInvestmentValue } = usePortfolio();
  const [investAmount, setInvestAmount] = useState('');
  const [withdrawUnits, setWithdrawUnits] = useState('');
  const [tab, setTab] = useState<'invest' | 'withdraw'>('invest');
  const [chartPeriod, setChartPeriod] = useState<'7D' | '30D' | 'All'>('7D');

  const vault = vaults.find(v => v.id === id);
  const investment = investments.find(inv => inv.vaultId === id);

  if (!vault) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Vault not found</p>
      </div>
    );
  }

  const accent = getVaultAccent(vault.id);
  const IconComp = vaultIconMap[vault.id] || Shield;
  const icon3DVariant = getVaultIcon3DVariant(vault.id);
  const currentValue = investment ? getInvestmentValue(investment) : 0;
  const pnl = investment ? currentValue - investment.investedAmount : 0;

  const handleInvest = () => {
    const val = parseFloat(investAmount);
    if (val > 0 && val <= balance) {
      invest(vault.id, val);
      setInvestAmount('');
    }
  };

  const handleWithdraw = () => {
    const units = parseFloat(withdrawUnits);
    if (investment && units > 0 && units <= investment.units) {
      withdraw(vault.id, units);
      setWithdrawUnits('');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 pb-12 pt-[88px]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-all duration-200 hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header card */}
              <div className="glass-card relative overflow-hidden rounded-2xl p-8">
                {/* Accent glow */}
                <div
                  className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-30 blur-3xl"
                  style={{ background: accent.stroke }}
                />

                <div className="relative z-10 flex items-start gap-5">
                  <Icon3D icon={IconComp} variant={icon3DVariant} size="xl" animate />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-display text-3xl font-bold text-foreground">{vault.name}</h1>
                      <span className={`${getRiskBgColor(vault.risk)} ${getRiskColor(vault.risk)} rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide`}>
                        {vault.riskLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{vault.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Focus: {vault.focus}</p>
                  </div>
                </div>

                <div className="relative z-10 mt-8 grid grid-cols-3 gap-4">
                  {[
                    { label: 'ROI', value: `+${vault.roi}%`, color: accent.text },
                    { label: 'Unit Price', value: formatUSD(vault.unitPrice), color: 'text-foreground' },
                    { label: 'TVL', value: formatUSD(vault.tvl), color: 'text-foreground' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-secondary/40 p-4 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      <p className={`mt-1 font-display text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance chart */}
              <div className="glass-card rounded-2xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-foreground">Performance</h3>
                  <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
                    {(['7D', '30D', 'All'] as const).map((period) => (
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
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vault.performanceData}>
                      <defs>
                        <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accent.stroke} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={accent.stroke} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5F6B7A' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#5F6B7A' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(215, 28%, 10%)',
                          border: '1px solid hsl(215, 15%, 22%)',
                          borderRadius: '12px',
                          color: '#E6EDF3',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke={accent.stroke} strokeWidth={2.5} fill="url(#detailGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Position card */}
              {investment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Icon3D icon={TrendingUp} variant={icon3DVariant} size="sm" />
                    <h3 className="font-display text-sm font-semibold text-foreground">Your Position</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Units Held', value: investment.units.toFixed(4), color: 'text-foreground' },
                      { label: 'Invested', value: formatUSD(investment.investedAmount), color: 'text-foreground' },
                      { label: 'Current Value', value: formatUSD(currentValue), color: 'text-foreground' },
                      { label: 'P&L', value: `${pnl >= 0 ? '+' : ''}${formatUSD(pnl)}`, color: pnl >= 0 ? 'text-vault-low' : 'text-destructive' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl bg-secondary/40 p-4">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                        <p className={`mt-1 font-display text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Invest/Withdraw panel */}
            <div className="space-y-6">
              <div className="glass-card sticky top-24 rounded-2xl p-6">
                <div className="mb-6 flex rounded-xl bg-secondary/40 p-1">
                  {(['invest', 'withdraw'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                        tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {tab === 'invest' ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Available Balance</span>
                      <span className="font-semibold text-foreground">{formatUSD(balance)}</span>
                    </div>
                    <div className="relative mb-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <input
                        type="number"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-border bg-secondary/40 py-3.5 pl-8 pr-4 text-lg font-semibold text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="mb-4 flex gap-2">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setInvestAmount((balance * pct / 100).toFixed(2))}
                          className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-primary hover:text-foreground hover:bg-primary/5"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    {investAmount && parseFloat(investAmount) > 0 && (
                      <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
                        <Info size={12} />
                        ≈ {(parseFloat(investAmount) / vault.unitPrice).toFixed(4)} units at {formatUSD(vault.unitPrice)}/unit
                      </div>
                    )}
                    <button
                      onClick={handleInvest}
                      disabled={!investAmount || parseFloat(investAmount) <= 0 || parseFloat(investAmount) > balance}
                      className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
                    >
                      Invest Now
                    </button>
                  </div>
                ) : (
                  <div>
                    {investment ? (
                      <>
                        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Available Units</span>
                          <span className="font-semibold text-foreground">{investment.units.toFixed(4)}</span>
                        </div>
                        <input
                          type="number"
                          value={withdrawUnits}
                          onChange={(e) => setWithdrawUnits(e.target.value)}
                          placeholder="Units to withdraw"
                          className="mb-3 w-full rounded-xl border border-border bg-secondary/40 px-4 py-3.5 text-lg font-semibold text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="mb-4 flex gap-2">
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => setWithdrawUnits((investment.units * pct / 100).toFixed(4))}
                              className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-primary hover:text-foreground hover:bg-primary/5"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                        {withdrawUnits && parseFloat(withdrawUnits) > 0 && (
                          <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
                            <Info size={12} />
                            ≈ {formatUSD(parseFloat(withdrawUnits) * vault.unitPrice)} at {formatUSD(vault.unitPrice)}/unit
                          </div>
                        )}
                        <button
                          onClick={handleWithdraw}
                          disabled={!withdrawUnits || parseFloat(withdrawUnits) <= 0 || parseFloat(withdrawUnits) > investment.units}
                          className="w-full rounded-xl bg-destructive py-3.5 text-sm font-semibold text-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-40"
                        >
                          Withdraw
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center py-10 text-center">
                        <Icon3D icon={ArrowUpRight} variant="blue" size="lg" className="mb-3" />
                        <p className="text-sm text-muted-foreground">No position in this vault</p>
                        <button onClick={() => setTab('invest')} className="mt-3 text-sm font-medium text-primary hover:underline">
                          Start investing →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VaultDetail;
