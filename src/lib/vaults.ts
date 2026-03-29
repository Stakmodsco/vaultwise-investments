export type RiskLevel = 'very-low' | 'low' | 'medium' | 'high';

export interface Vault {
  id: string;
  name: string;
  description: string;
  focus: string;
  risk: RiskLevel;
  riskLabel: string;
  roi: number;
  tvl: number;
  unitPrice: number;
  icon: string;
  color: string;
  performanceData: { day: string; value: number }[];
}

const generatePerformanceData = (baseRoi: number, volatility: number) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let value = 100;
  return days.map((day, i) => {
    const change = (Math.random() - 0.4) * volatility + (baseRoi / 365);
    value = value * (1 + change / 100);
    return { day: `${day} ${i + 1}`, value: parseFloat(value.toFixed(2)) };
  });
};

export const vaults: Vault[] = [
  {
    id: 'bluechip-growth',
    name: 'BlueChip Growth',
    description: 'A diversified portfolio of top-tier cryptocurrencies focused on stable, long-term capital appreciation.',
    focus: 'BTC, ETH, Top 10 Coins',
    risk: 'low',
    riskLabel: 'Low Risk',
    roi: 12.4,
    tvl: 24500000,
    unitPrice: 1.124,
    icon: '🛡️',
    color: 'from-blue-500/20 to-cyan-500/20',
    performanceData: generatePerformanceData(12.4, 1.5),
  },
  {
    id: 'alpha-aggressive',
    name: 'Alpha Aggressive',
    description: 'High-conviction bets on emerging altcoins and volatile assets for maximum return potential.',
    focus: 'Altcoins, DeFi, High-Volatility',
    risk: 'high',
    riskLabel: 'High Risk',
    roi: 34.7,
    tvl: 8900000,
    unitPrice: 1.347,
    icon: '🔥',
    color: 'from-orange-500/20 to-red-500/20',
    performanceData: generatePerformanceData(34.7, 5),
  },
  {
    id: 'stable-yield',
    name: 'Stable Yield',
    description: 'Conservative strategy leveraging stablecoins and yield farming for predictable, consistent returns.',
    focus: 'USDT, USDC, DAI, Yield Farming',
    risk: 'very-low',
    riskLabel: 'Very Low Risk',
    roi: 5.2,
    tvl: 42000000,
    unitPrice: 1.052,
    icon: '💎',
    color: 'from-teal-500/20 to-emerald-500/20',
    performanceData: generatePerformanceData(5.2, 0.5),
  },
  {
    id: 'momentum-trader',
    name: 'Momentum Trader',
    description: 'Dynamic allocation strategy that follows market trends and momentum signals across crypto markets.',
    focus: 'Trend-Based, Multi-Asset',
    risk: 'medium',
    riskLabel: 'Medium-High Risk',
    roi: 21.8,
    tvl: 15300000,
    unitPrice: 1.218,
    icon: '⚡',
    color: 'from-yellow-500/20 to-amber-500/20',
    performanceData: generatePerformanceData(21.8, 3),
  },
];

export const getRiskColor = (risk: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    'very-low': 'risk-very-low',
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
  };
  return colors[risk];
};

export const getRiskBgColor = (risk: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    'very-low': 'bg-risk-very-low',
    low: 'bg-risk-low',
    medium: 'bg-risk-medium',
    high: 'bg-risk-high',
  };
  return colors[risk];
};

export const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

export const formatUSD = (value: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};
