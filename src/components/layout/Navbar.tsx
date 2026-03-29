import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, User, LayoutDashboard, Vault, Wallet } from 'lucide-react';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD } from '@/lib/vaults';
import Icon3D from '@/components/ui/Icon3D';

const Navbar = () => {
  const location = useLocation();
  const { balance } = usePortfolio();
  const isLanding = location.pathname === '/';

  return (
    <>
      {/* Top Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <Icon3D icon={Vault} variant="blue" size="sm" />
            <span className="font-display text-xl font-bold text-foreground">VaultX</span>
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            {!isLanding && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-secondary ${
                    location.pathname === '/dashboard' ? 'text-foreground bg-secondary' : 'text-muted-foreground'
                  }`}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link
                  to="/vaults"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-secondary ${
                    location.pathname === '/vaults' ? 'text-foreground bg-secondary' : 'text-muted-foreground'
                  }`}
                >
                  <Vault size={16} />
                  Vaults
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLanding && (
              <>
                <div className="hidden items-center gap-1.5 rounded-xl bg-secondary/70 px-4 py-2 text-sm font-semibold text-foreground sm:flex">
                  <Wallet size={14} className="text-primary" />
                  {formatUSD(balance)}
                </div>
                <button className="relative rounded-xl bg-secondary/50 p-2.5 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground">
                  <Bell size={18} />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                </button>
                <button className="rounded-xl bg-secondary/50 p-2.5 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground">
                  <User size={18} />
                </button>
              </>
            )}
            {isLanding && (
              <Link
                to="/dashboard"
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 glow-blue"
              >
                Launch App
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Bottom Navigation */}
      {!isLanding && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:hidden">
          <div className="flex items-center justify-around py-2">
            {[
              { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { to: '/vaults', icon: Vault, label: 'Vaults' },
              { to: '/dashboard', icon: Wallet, label: 'Wallet' },
              { to: '/dashboard', icon: User, label: 'Profile' },
            ].map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={label}
                  to={to}
                  className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs transition-all duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
