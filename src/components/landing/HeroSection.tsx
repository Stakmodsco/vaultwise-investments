import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Lock } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';
import CryptoCoinsBackground from './CryptoCoinsBackground';

const HeroSection = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      {/* Animated crypto coins slideshow */}
      <CryptoCoinsBackground />

      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute left-1/4 top-1/2 h-[300px] w-[300px] rounded-full bg-vault-purple/5 blur-[100px]" />
      </div>

      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(215 20% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(215 20% 50%) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="mb-6 font-display text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            Smart Crypto
            <br />
            <span className="gradient-text">Investment Vaults</span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Allocate your funds into professionally managed crypto vaults.
            Track performance in real time and grow your portfolio with intelligent strategies.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard"
              className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-sm font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110 glow-blue"
            >
              Start Investing
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/vaults"
              className="rounded-2xl border border-border px-8 py-4 font-display text-sm font-semibold text-foreground transition-all duration-300 hover:bg-secondary hover:border-muted-foreground"
            >
              Explore Vaults
            </Link>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 flex flex-wrap justify-center gap-4"
        >
          {[
            { icon: Shield, label: 'Bank-Grade Security', variant: 'blue' as const },
            { icon: TrendingUp, label: 'Real-Time Analytics', variant: 'green' as const },
            { icon: Lock, label: 'Non-Custodial', variant: 'purple' as const },
          ].map(({ icon, label, variant }) => (
            <div key={label} className="glass-card flex items-center gap-3 rounded-2xl px-5 py-3">
              <Icon3D icon={icon} variant={variant} size="sm" />
              <span className="text-sm font-medium text-secondary-foreground">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-8"
        >
          {[
            { label: 'Total Value Locked', value: '$90.7M' },
            { label: 'Active Investors', value: '12,400+' },
            { label: 'Avg. Annual Return', value: '18.5%' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
