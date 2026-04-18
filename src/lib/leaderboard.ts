export interface LeaderUser {
  id: string;
  name: string;
  handle: string;
  vault: string;
  portfolio: number;
  pnlPct: number;
  streak: number;
}

export const seedUsers: LeaderUser[] = [
  { id: '1', name: 'Aria Chen', handle: '@arialeaf', vault: 'Alpha Aggressive', portfolio: 184230, pnlPct: 42.7, streak: 28 },
  { id: '2', name: 'Marco Vega', handle: '@vegaforest', vault: 'Momentum Trader', portfolio: 156890, pnlPct: 38.4, streak: 21 },
  { id: '3', name: 'Yuki Tanaka', handle: '@yukigreen', vault: 'BlueChip Growth', portfolio: 142100, pnlPct: 31.2, streak: 19 },
  { id: '4', name: 'Liam Okafor', handle: '@liamoak', vault: 'Alpha Aggressive', portfolio: 128450, pnlPct: 28.9, streak: 15 },
  { id: '5', name: 'Sofia Rossi', handle: '@sofiabloom', vault: 'Stable Yield', portfolio: 119780, pnlPct: 24.6, streak: 24 },
  { id: '6', name: 'Kai Nakamura', handle: '@kaiwave', vault: 'Momentum Trader', portfolio: 108220, pnlPct: 22.1, streak: 12 },
  { id: '7', name: 'Priya Shah', handle: '@priyaroot', vault: 'BlueChip Growth', portfolio: 96540, pnlPct: 19.8, streak: 17 },
  { id: '8', name: 'Diego Morales', handle: '@diegofern', vault: 'Stable Yield', portfolio: 88330, pnlPct: 17.4, streak: 22 },
  { id: '9', name: 'Elena Volkov', handle: '@elenavolk', vault: 'Alpha Aggressive', portfolio: 79100, pnlPct: 14.9, streak: 9 },
  { id: '10', name: 'Theo Bennett', handle: '@theoben', vault: 'Momentum Trader', portfolio: 71450, pnlPct: 12.3, streak: 11 },
];

export type AchievementId = 'diamond-hands' | 'hot-streak' | 'vault-master';

export interface Achievement {
  id: AchievementId;
  label: string;
  description: string;
  variant: 'forest' | 'leaf' | 'gold' | 'ember';
}

export const achievementMeta: Record<AchievementId, Achievement> = {
  'diamond-hands': {
    id: 'diamond-hands',
    label: 'Diamond Hands',
    description: 'Held a position with $100k+ value through volatility.',
    variant: 'forest',
  },
  'hot-streak': {
    id: 'hot-streak',
    label: 'Hot Streak',
    description: '20+ consecutive days of positive returns.',
    variant: 'gold',
  },
  'vault-master': {
    id: 'vault-master',
    label: 'Vault Master',
    description: 'Top 3 performer across all VaultX strategies.',
    variant: 'leaf',
  },
};

export const getUserAchievements = (user: LeaderUser, rank: number): AchievementId[] => {
  const earned: AchievementId[] = [];
  if (user.portfolio >= 100000) earned.push('diamond-hands');
  if (user.streak >= 20) earned.push('hot-streak');
  if (rank <= 3) earned.push('vault-master');
  return earned;
};

// Computes the rank of a hypothetical "you" given portfolio + pnl%.
// Returns rank (1-based) and the surrounding 3-user slice.
export const computeUserRank = (
  yourPortfolio: number,
  yourPnlPct: number,
  users: LeaderUser[] = seedUsers
) => {
  const youEntry: LeaderUser = {
    id: 'you',
    name: 'You',
    handle: '@you',
    vault: 'Your Portfolio',
    portfolio: yourPortfolio,
    pnlPct: yourPnlPct,
    streak: 0,
  };
  const sorted = [...users, youEntry].sort((a, b) => b.pnlPct - a.pnlPct);
  const rank = sorted.findIndex((u) => u.id === 'you') + 1;
  const total = sorted.length;
  return { rank, total, sorted };
};
