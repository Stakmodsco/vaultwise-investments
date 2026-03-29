import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD } from '@/lib/vaults';

const DepositModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [amount, setAmount] = useState('');
  const { deposit } = usePortfolio();

  if (!open) return null;

  const handleDeposit = () => {
    const val = parseFloat(amount);
    if (val > 0) {
      deposit(val);
      setAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 font-display text-xl font-semibold text-foreground">Deposit Funds</h3>
        <p className="mb-6 text-sm text-muted-foreground">Add funds to your VaultX wallet. This is a simulated deposit.</p>
        
        <div className="mb-4">
          <label className="mb-2 block text-sm text-muted-foreground">Amount (USD)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="mb-6 flex gap-2">
          {[100, 500, 1000, 5000].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {formatUSD(preset)}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cancel
          </button>
          <button onClick={handleDeposit} className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90">
            Deposit
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DepositModal;
