import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD } from '@/lib/vaults';
import { X, DollarSign } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass-card w-full max-w-md rounded-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon3D icon={DollarSign} variant="green" size="md" />
            <h3 className="font-display text-xl font-semibold text-foreground">Deposit Funds</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">Add funds to your VaultX wallet. This is a simulated deposit.</p>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-border bg-secondary/50 py-3.5 pl-8 pr-4 text-lg font-semibold text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          {[100, 500, 1000, 5000].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary hover:text-foreground hover:bg-primary/5"
            >
              {formatUSD(preset)}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 glow-blue"
          >
            Deposit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DepositModal;
