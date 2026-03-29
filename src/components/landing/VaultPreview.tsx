import { motion } from 'framer-motion';
import { vaults } from '@/lib/vaults';
import VaultCard from '@/components/vaults/VaultCard';

const VaultPreview = () => {
  return (
    <section className="px-6 py-24">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground sm:text-5xl">
            Investment Vaults
          </h2>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Choose from curated strategies designed for different risk appetites and market conditions.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vaults.map((vault, i) => (
            <VaultCard key={vault.id} vault={vault} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VaultPreview;
