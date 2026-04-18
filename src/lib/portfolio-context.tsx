import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { vaults as vaultData, Vault } from './vaults';

interface Investment {
  vaultId: string;
  units: number;
  investedAmount: number;
  investedAt: Date;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'invest' | 'redeem';
  amount: number;
  vaultName?: string;
  date: Date;
}

interface PortfolioContextType {
  balance: number;
  investments: Investment[];
  transactions: Transaction[];
  vaults: Vault[];
  deposit: (amount: number) => void;
  invest: (vaultId: string, amount: number) => void;
  withdraw: (vaultId: string, units: number) => void;
  reset: () => void;
  getInvestmentValue: (investment: Investment) => number;
  getTotalInvested: () => number;
  getTotalValue: () => number;
  getTotalPnL: () => number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(10000);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'deposit', amount: 10000, date: new Date(Date.now() - 86400000 * 3) },
  ]);
  const [vaults] = useState<Vault[]>(vaultData);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'date'>) => {
    setTransactions(prev => [
      { ...tx, id: Math.random().toString(36).slice(2), date: new Date() },
      ...prev,
    ]);
  }, []);

  const deposit = useCallback((amount: number) => {
    setBalance(prev => prev + amount);
    addTransaction({ type: 'deposit', amount });
  }, [addTransaction]);

  const invest = useCallback((vaultId: string, amount: number) => {
    const vault = vaults.find(v => v.id === vaultId);
    if (!vault || amount > balance) return;

    const units = amount / vault.unitPrice;
    setBalance(prev => prev - amount);
    setInvestments(prev => {
      const existing = prev.find(inv => inv.vaultId === vaultId);
      if (existing) {
        return prev.map(inv =>
          inv.vaultId === vaultId
            ? { ...inv, units: inv.units + units, investedAmount: inv.investedAmount + amount }
            : inv
        );
      }
      return [...prev, { vaultId, units, investedAmount: amount, investedAt: new Date() }];
    });
    addTransaction({ type: 'invest', amount, vaultName: vault.name });
  }, [balance, vaults, addTransaction]);

  const withdraw = useCallback((vaultId: string, units: number) => {
    const vault = vaults.find(v => v.id === vaultId);
    const investment = investments.find(inv => inv.vaultId === vaultId);
    if (!vault || !investment || units > investment.units) return;

    const value = units * vault.unitPrice;
    setBalance(prev => prev + value);
    setInvestments(prev =>
      prev
        .map(inv =>
          inv.vaultId === vaultId
            ? {
                ...inv,
                units: inv.units - units,
                investedAmount: inv.investedAmount * ((inv.units - units) / inv.units),
              }
            : inv
        )
        .filter(inv => inv.units > 0.001)
    );
    addTransaction({ type: 'redeem', amount: value, vaultName: vault.name });
  }, [vaults, investments, addTransaction]);

  const reset = useCallback(() => {
    setBalance(10000);
    setInvestments([]);
    setTransactions([
      { id: '1', type: 'deposit', amount: 10000, date: new Date() },
    ]);
  }, []);

  const getInvestmentValue = useCallback((investment: Investment) => {
    const vault = vaults.find(v => v.id === investment.vaultId);
    return vault ? investment.units * vault.unitPrice : 0;
  }, [vaults]);

  const getTotalInvested = useCallback(() => {
    return investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  }, [investments]);

  const getTotalValue = useCallback(() => {
    return investments.reduce((sum, inv) => sum + getInvestmentValue(inv), 0);
  }, [investments, getInvestmentValue]);

  const getTotalPnL = useCallback(() => {
    return getTotalValue() - getTotalInvested();
  }, [getTotalValue, getTotalInvested]);

  return (
    <PortfolioContext.Provider
      value={{
        balance, investments, transactions, vaults,
        deposit, invest, withdraw, reset, getInvestmentValue,
        getTotalInvested, getTotalValue, getTotalPnL,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
  return context;
};
