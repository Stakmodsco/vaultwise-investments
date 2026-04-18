import { type RiskLevel } from './vaults';

export type VaultAccentColor = 'forest' | 'leaf' | 'gold' | 'ember';

export const vaultAccentMap: Record<string, VaultAccentColor> = {
  'bluechip-growth': 'forest',
  'alpha-aggressive': 'ember',
  'stable-yield': 'leaf',
  'momentum-trader': 'gold',
};

// Hex values mirror the nature palette: #25671E forest, #48A111 leaf, #F2B50B gold, #EF4444 ember
export const accentColors: Record<VaultAccentColor, { stroke: string; fill: string; text: string; bg: string; glow: string }> = {
  forest: {
    stroke: '#25671E',
    fill: 'rgba(37,103,30,0.18)',
    text: 'text-vault-very-low',
    bg: 'bg-vault-very-low/10',
    glow: '0 0 30px -6px rgba(37,103,30,0.45)',
  },
  leaf: {
    stroke: '#48A111',
    fill: 'rgba(72,161,17,0.18)',
    text: 'text-vault-low',
    bg: 'bg-vault-low/10',
    glow: '0 0 30px -6px rgba(72,161,17,0.45)',
  },
  gold: {
    stroke: '#F2B50B',
    fill: 'rgba(242,181,11,0.18)',
    text: 'text-vault-medium',
    bg: 'bg-vault-medium/10',
    glow: '0 0 30px -6px rgba(242,181,11,0.45)',
  },
  ember: {
    stroke: '#EF4444',
    fill: 'rgba(239,68,68,0.18)',
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    glow: '0 0 30px -6px rgba(239,68,68,0.4)',
  },
};

export const getVaultAccent = (vaultId: string) => {
  const color = vaultAccentMap[vaultId] || 'leaf';
  return accentColors[color];
};

export const getVaultIcon3DVariant = (vaultId: string): VaultAccentColor => {
  return vaultAccentMap[vaultId] || 'leaf';
};

export const getRiskIcon3DVariant = (risk: RiskLevel): 'forest' | 'leaf' | 'gold' | 'ember' => {
  const map: Record<RiskLevel, 'forest' | 'leaf' | 'gold' | 'ember'> = {
    'very-low': 'forest',
    low: 'leaf',
    medium: 'gold',
    high: 'ember',
  };
  return map[risk];
};
