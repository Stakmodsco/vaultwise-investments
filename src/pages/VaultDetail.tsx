import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD, getRiskColor, getRiskBgColor } from '@/lib/vaults';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vaults, balance, investments, invest, withdraw, getInvestmentValue } = usePortfolio();
  const [investAmount, setInvestAmount] = useState('');
  const [withdrawUnits, setWithdrawUnits] = useState('');
  const [tab, setTab] = useState<'invest' | 'withdraw'>('invest');

  const vault = vaults.find(v => v.id === id);
  const investment = investments.find(inv => inv.vaultId === id);

  if (!vault) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Vault not found</p>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pb-12 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Vault info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{vault.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h1 className="font-display text-2xl font-bold text-foreground">{vault.name}</h1>
                      <span className={`${getRiskBgColor(vault.risk)} ${getRiskColor(vault.risk)} rounded-full px-3 py-1 text-xs font-medium`}>
                        {vault.riskLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{vault.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Focus: {vault.focus}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-secondary/50 p-4 text-center">
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className="font-display text-xl font-bold text-vault-low">+{vault.roi}%</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4 text-center">
                    <p className="text-xs text-muted-foreground">Unit Price</p>
                    <p className="font-display text-xl font-bold text-foreground">{formatUSD(vault.unitPrice)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4 text-center">
                    <p className="text-xs text-muted-foreground">TVL</p>
                    <p className="font-display text-xl font-bold text-foreground">{formatUSD(vault.tvl)}</p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Performance (14 days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vault.performanceData}>
                      <defs>
                        <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(222, 40%, 10%)', border: '1px solid hsl(222, 20%, 22%)', borderRadius: '8px', color: 'hsl(210, 40%, 98%)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#detailGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Your position */}
              {investment && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Your Position</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Units Held</p>
                      <p className="font-display text-lg font-bold text-foreground">{investment.units.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="font-display text-lg font-bold text-foreground">{formatUSD(investment.investedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Value</p>
                      <p className="font-display text-lg font-bold text-foreground">{formatUSD(currentValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">P&L</p>
                      <p className={`font-display text-lg font-bold ${pnl >= 0 ? 'text-vault-low' : 'text-destructive'}`}>
                        {pnl >= 0 ? '+' : ''}{formatUSD(pnl)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Invest/Withdraw panel */}
            <div className="space-y-6">
              <div className="glass-card sticky top-24 rounded-xl p-6">
                <div className="mb-6 flex rounded-lg bg-secondary/50 p-1">
                  <button
                    onClick={() => setTab('invest')}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                      tab === 'invest' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Invest
                  </button>
                  <button
                    onClick={() => setTab('withdraw')}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                      tab === 'withdraw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Withdraw
                  </button>
                </div>

                {tab === 'invest' ? (
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Available: {formatUSD(balance)}</p>
                    <input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="Amount in USD"
                      className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
                    />
                    <div className="mb-4 flex gap-2">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setInvestAmount((balance * pct / 100).toFixed(2))}
                          className="flex-1 rounded-md border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    {investAmount && parseFloat(investAmount) > 0 && (
                      <p className="mb-4 text-xs text-muted-foreground">
                        ≈ {(parseFloat(investAmount) / vault.unitPrice).toFixed(4)} units at {formatUSD(vault.unitPrice)}/unit
                      </p>
                    )}
                    <button
                      onClick={handleInvest}
                      disabled={!investAmount || parseFloat(investAmount) <= 0 || parseFloat(investAmount) > balance}
                      className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      Invest Now
                    </button>
                  </div>
                ) : (
                  <div>
                    {investment ? (
                      <>
                        <p className="mb-2 text-xs text-muted-foreground">Available: {investment.units.toFixed(4)} units</p>
                        <input
                          type="number"
                          value={withdrawUnits}
                          onChange={(e) => setWithdrawUnits(e.target.value)}
                          placeholder="Units to withdraw"
                          className="mb-3 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
                        />
                        <div className="mb-4 flex gap-2">
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => setWithdrawUnits((investment.units * pct / 100).toFixed(4))}
                              className="flex-1 rounded-md border border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                        {withdrawUnits && parseFloat(withdrawUnits) > 0 && (
                          <p className="mb-4 text-xs text-muted-foreground">
                            ≈ {formatUSD(parseFloat(withdrawUnits) * vault.unitPrice)} at {formatUSD(vault.unitPrice)}/unit
                          </p>
                        )}
                        <button
                          onClick={handleWithdraw}
                          disabled={!withdrawUnits || parseFloat(withdrawUnits) <= 0 || parseFloat(withdrawUnits) > investment.units}
                          className="w-full rounded-lg bg-destructive py-3 text-sm font-semibold text-foreground transition-all hover:opacity-90 disabled:opacity-50"
                        >
                          Withdraw
                        </button>
                      </>
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">No position in this vault</p>
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
