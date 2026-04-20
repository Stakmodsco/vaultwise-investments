import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { vaults as vaultData, Vault } from './vaults';
import { useAuth } from './auth-context';

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
  loading: boolean;
  deposit: (amount: number) => Promise<void>;
  invest: (vaultId: string, amount: number) => Promise<void>;
  withdraw: (vaultId: string, units: number) => Promise<void>;
  reset: () => Promise<void>;
  getInvestmentValue: (investment: Investment) => number;
  getTotalInvested: () => number;
  getTotalValue: () => number;
  getTotalPnL: () => number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vaults] = useState<Vault[]>(vaultData);
  const [loading, setLoading] = useState(true);

  // Load + subscribe to per-user data
  useEffect(() => {
    if (!user) {
      setBalance(0);
      setInvestments([]);
      setTransactions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // portfolio (auto-created by trigger). Fallback insert if missing.
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!portfolio) {
        await supabase.from('portfolios').insert({ user_id: user.id, balance: 10000 });
        if (!cancelled) setBalance(10000);
      } else if (!cancelled) {
        setBalance(Number(portfolio.balance));
      }

      const { data: invRows } = await supabase
        .from('investments')
        .select('vault_id, units, invested_amount, invested_at')
        .eq('user_id', user.id);

      if (!cancelled) {
        setInvestments(
          (invRows ?? []).map((r) => ({
            vaultId: r.vault_id,
            units: Number(r.units),
            investedAmount: Number(r.invested_amount),
            investedAt: new Date(r.invested_at),
          }))
        );
      }

      const { data: txRows } = await supabase
        .from('transactions')
        .select('id, type, amount, vault_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!cancelled) {
        setTransactions(
          (txRows ?? []).map((r) => ({
            id: r.id,
            type: r.type as Transaction['type'],
            amount: Number(r.amount),
            vaultName: r.vault_name ?? undefined,
            date: new Date(r.created_at),
          }))
        );
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  const recordTx = useCallback(async (tx: Omit<Transaction, 'id' | 'date'> & { vaultId?: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: tx.type,
        amount: tx.amount,
        vault_name: tx.vaultName ?? null,
        vault_id: tx.vaultId ?? null,
      })
      .select('id, type, amount, vault_name, created_at')
      .single();
    if (error || !data) return;
    setTransactions((prev) => [
      {
        id: data.id,
        type: data.type as Transaction['type'],
        amount: Number(data.amount),
        vaultName: data.vault_name ?? undefined,
        date: new Date(data.created_at),
      },
      ...prev,
    ]);
  }, [user]);

  const persistBalance = useCallback(async (next: number) => {
    if (!user) return;
    await supabase.from('portfolios').update({ balance: next }).eq('user_id', user.id);
  }, [user]);

  const deposit = useCallback(async (amount: number) => {
    if (!user) { toast.error('Sign in required'); return; }
    const next = balance + amount;
    setBalance(next);
    await persistBalance(next);
    await recordTx({ type: 'deposit', amount });
  }, [user, balance, persistBalance, recordTx]);

  const invest = useCallback(async (vaultId: string, amount: number) => {
    if (!user) { toast.error('Sign in required'); return; }
    const vault = vaults.find((v) => v.id === vaultId);
    if (!vault || amount > balance) return;

    const units = amount / vault.unitPrice;
    const nextBalance = balance - amount;
    setBalance(nextBalance);

    const existing = investments.find((i) => i.vaultId === vaultId);
    const nextUnits = (existing?.units ?? 0) + units;
    const nextInvested = (existing?.investedAmount ?? 0) + amount;

    setInvestments((prev) => {
      if (existing) {
        return prev.map((i) => i.vaultId === vaultId ? { ...i, units: nextUnits, investedAmount: nextInvested } : i);
      }
      return [...prev, { vaultId, units, investedAmount: amount, investedAt: new Date() }];
    });

    await Promise.all([
      persistBalance(nextBalance),
      supabase.from('investments').upsert(
        { user_id: user.id, vault_id: vaultId, units: nextUnits, invested_amount: nextInvested },
        { onConflict: 'user_id,vault_id' }
      ),
    ]);
    await recordTx({ type: 'invest', amount, vaultName: vault.name, vaultId });
  }, [user, vaults, balance, investments, persistBalance, recordTx]);

  const withdraw = useCallback(async (vaultId: string, units: number) => {
    if (!user) { toast.error('Sign in required'); return; }
    const vault = vaults.find((v) => v.id === vaultId);
    const investment = investments.find((i) => i.vaultId === vaultId);
    if (!vault || !investment || units > investment.units) return;

    const value = units * vault.unitPrice;
    const nextBalance = balance + value;
    const remainingUnits = investment.units - units;
    const remainingInvested = investment.investedAmount * (remainingUnits / investment.units);

    setBalance(nextBalance);
    setInvestments((prev) =>
      prev
        .map((i) => i.vaultId === vaultId ? { ...i, units: remainingUnits, investedAmount: remainingInvested } : i)
        .filter((i) => i.units > 0.001)
    );

    await persistBalance(nextBalance);
    if (remainingUnits > 0.001) {
      await supabase
        .from('investments')
        .update({ units: remainingUnits, invested_amount: remainingInvested })
        .eq('user_id', user.id)
        .eq('vault_id', vaultId);
    } else {
      await supabase
        .from('investments')
        .delete()
        .eq('user_id', user.id)
        .eq('vault_id', vaultId);
    }
    await recordTx({ type: 'redeem', amount: value, vaultName: vault.name, vaultId });
  }, [user, vaults, balance, investments, persistBalance, recordTx]);

  const reset = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      supabase.from('investments').delete().eq('user_id', user.id),
      supabase.from('transactions').delete().eq('user_id', user.id),
      supabase.from('portfolios').update({ balance: 10000 }).eq('user_id', user.id),
    ]);
    setBalance(10000);
    setInvestments([]);
    setTransactions([]);
    await recordTx({ type: 'deposit', amount: 10000 });
  }, [user, recordTx]);

  const getInvestmentValue = useCallback((investment: Investment) => {
    const vault = vaults.find((v) => v.id === investment.vaultId);
    return vault ? investment.units * vault.unitPrice : 0;
  }, [vaults]);

  const getTotalInvested = useCallback(
    () => investments.reduce((s, i) => s + i.investedAmount, 0),
    [investments]
  );
  const getTotalValue = useCallback(
    () => investments.reduce((s, i) => s + getInvestmentValue(i), 0),
    [investments, getInvestmentValue]
  );
  const getTotalPnL = useCallback(
    () => getTotalValue() - getTotalInvested(),
    [getTotalValue, getTotalInvested]
  );

  return (
    <PortfolioContext.Provider
      value={{
        balance, investments, transactions, vaults, loading,
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
