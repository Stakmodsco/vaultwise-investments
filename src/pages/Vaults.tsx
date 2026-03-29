import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import VaultCard from '@/components/vaults/VaultCard';
import { usePortfolio } from '@/lib/portfolio-context';

const Vaults = () => {
  const { vaults } = usePortfolio();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pb-12 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Vaults</h1>
          <p className="mb-8 text-muted-foreground">Choose a strategy that matches your risk appetite.</p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {vaults.map((vault, i) => (
              <VaultCard key={vault.id} vault={vault} index={i} />
            ))}
          </div>

          <div className="mt-12 glass-card rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ Returns are variable and based on simulated market conditions. Past performance does not guarantee future results. This is not financial advice.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Vaults;
