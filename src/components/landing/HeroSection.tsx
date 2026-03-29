import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-vault-low" />
            Live Portfolio Tracking
          </div>

          <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-foreground sm:text-7xl">
            Smart Crypto
            <br />
            <span className="gradient-text">Investment Vaults</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Allocate your funds into professionally managed crypto vaults. 
            Track performance in real time and grow your portfolio with intelligent strategies.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard"
              className="glow rounded-xl bg-primary px-8 py-4 font-display text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Start Investing
            </Link>
            <Link
              to="/vaults"
              className="rounded-xl border border-border px-8 py-4 font-display text-sm font-semibold text-foreground transition-all hover:border-muted-foreground"
            >
              Explore Vaults
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-20 grid grid-cols-3 gap-8"
        >
          {[
            { label: 'Total Value Locked', value: '$90.7M' },
            { label: 'Active Investors', value: '12,400+' },
            { label: 'Avg. Annual Return', value: '18.5%' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
