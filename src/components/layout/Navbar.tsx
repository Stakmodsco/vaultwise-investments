import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD } from '@/lib/vaults';

const Navbar = () => {
  const location = useLocation();
  const { balance } = usePortfolio();
  const isLanding = location.pathname === '/';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
            VX
          </div>
          <span className="font-display text-xl font-bold text-foreground">VaultX</span>
        </Link>

        <div className="flex items-center gap-6">
          {!isLanding && (
            <>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  location.pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/vaults"
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  location.pathname === '/vaults' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Vaults
              </Link>
              <div className="glass rounded-lg px-4 py-2 text-sm font-medium text-foreground">
                {formatUSD(balance)}
              </div>
            </>
          )}
          {isLanding && (
            <Link
              to="/dashboard"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Launch App
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
