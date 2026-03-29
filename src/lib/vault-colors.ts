import { type RiskLevel } from './vaults';

export type VaultAccentColor = 'blue' | 'green' | 'red' | 'purple';

export const vaultAccentMap: Record<string, VaultAccentColor> = {
  'bluechip-growth': 'blue',
  'alpha-aggressive': 'red',
  'stable-yield': 'green',
  'momentum-trader': 'purple',
};

export const accentColors: Record<VaultAccentColor, { stroke: string; fill: string; text: string; bg: string; glow: string }> = {
  blue: {
    stroke: '#4F8CFF',
    fill: 'rgba(79,140,255,0.15)',
    text: 'text-primary',
    bg: 'bg-primary/10',
    glow: '0 0 30px -6px rgba(79,140,255,0.4)',
  },
  green: {
    stroke: '#22C55E',
    fill: 'rgba(34,197,94,0.15)',
    text: 'text-vault-low',
    bg: 'bg-vault-low/10',
    glow: '0 0 30px -6px rgba(34,197,94,0.4)',
  },
  red: {
    stroke: '#EF4444',
    fill: 'rgba(239,68,68,0.15)',
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    glow: '0 0 30px -6px rgba(239,68,68,0.4)',
  },
  purple: {
    stroke: '#8B5CF6',
    fill: 'rgba(139,92,246,0.15)',
    text: 'text-vault-purple',
    bg: 'bg-vault-purple/10',
    glow: '0 0 30px -6px rgba(139,92,246,0.4)',
  },
};

export const getVaultAccent = (vaultId: string) => {
  const color = vaultAccentMap[vaultId] || 'blue';
  return accentColors[color];
};

export const getVaultIcon3DVariant = (vaultId: string): 'blue' | 'green' | 'red' | 'purple' => {
  return vaultAccentMap[vaultId] || 'blue';
};

export const getRiskIcon3DVariant = (risk: RiskLevel): 'teal' | 'green' | 'amber' | 'red' => {
  const map: Record<RiskLevel, 'teal' | 'green' | 'amber' | 'red'> = {
    'very-low': 'teal',
    low: 'green',
    medium: 'amber',
    high: 'red',
  };
  return map[risk];
};
