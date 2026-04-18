import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Bell, User, LayoutDashboard, Vault, Wallet, Trophy, Settings, RefreshCw, LogOut, TrendingUp, Sparkles, Award } from 'lucide-react';
import { usePortfolio } from '@/lib/portfolio-context';
import { formatUSD } from '@/lib/vaults';
import vaultxLogo from '@/assets/vaultx-logo.png';
import CryptoTicker from './CryptoTicker';
import ThemeToggle from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const notifications = [
  { id: 1, icon: TrendingUp, title: 'Stable Yield up +2.1% today', time: '2m ago', variant: 'leaf' as const },
  { id: 2, icon: Award, title: 'You unlocked Diamond Hands 💎', time: '1h ago', variant: 'forest' as const },
  { id: 3, icon: Sparkles, title: 'New vault: Momentum Trader live', time: '4h ago', variant: 'gold' as const },
];

const Navbar = () => {
  const location = useLocation();
  const { balance, reset } = usePortfolio();
  const isLanding = location.pathname === '/';

  const handleReset = () => {
    reset();
    toast.success('Portfolio reset', { description: 'Balance restored to $10,000.' });
  };

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
          <Link to="/" className="flex items-center gap-2">
            <img src={vaultxLogo} alt="VaultX" className="h-9 w-9 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]" width={36} height={36} />
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
                <Link
                  to="/leaderboard"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-secondary ${
                    location.pathname === '/leaderboard' ? 'text-foreground bg-secondary' : 'text-muted-foreground'
                  }`}
                >
                  <Trophy size={16} />
                  Leaderboard
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isLanding && (
              <>
                <div className="hidden items-center gap-1.5 rounded-xl bg-secondary/70 px-4 py-2 text-sm font-semibold text-foreground sm:flex">
                  <Wallet size={14} className="text-primary" />
                  {formatUSD(balance)}
                </div>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Notifications"
                      className="relative rounded-xl bg-secondary/50 p-2.5 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
                    >
                      <Bell size={18} />
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Notifications</span>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {notifications.length} new
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.map((n) => {
                      const Icon = n.icon;
                      return (
                        <DropdownMenuItem
                          key={n.id}
                          className="flex items-start gap-3 py-2.5 cursor-pointer"
                          onClick={() => toast(n.title)}
                        >
                          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                            n.variant === 'leaf' ? 'bg-vault-low/15 text-vault-low'
                            : n.variant === 'forest' ? 'bg-vault-very-low/15 text-vault-very-low'
                            : 'bg-accent/15 text-accent'
                          }`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground">{n.time}</p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer justify-center text-xs text-muted-foreground"
                      onClick={() => toast.success('All notifications marked as read')}
                    >
                      Mark all as read
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="User menu"
                      className="rounded-xl bg-secondary/50 p-2.5 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
                    >
                      <User size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="font-display text-sm font-semibold text-foreground">Demo Investor</p>
                      <p className="text-xs text-muted-foreground">balance: {formatUSD(balance)}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/leaderboard">
                        <Trophy size={14} className="mr-2" /> My Rank
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => toast.info('Settings coming soon')}
                    >
                      <Settings size={14} className="mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleReset}
                    >
                      <RefreshCw size={14} className="mr-2" /> Reset Portfolio
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => toast.success('Signed out (demo)')}
                    >
                      <LogOut size={14} className="mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Crypto Ticker */}
      {!isLanding && <CryptoTicker />}

      {/* Mobile Bottom Navigation */}
      {!isLanding && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:hidden">
          <div className="flex items-center justify-around py-2">
            {[
              { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { to: '/vaults', icon: Vault, label: 'Vaults' },
              { to: '/leaderboard', icon: Trophy, label: 'Leaders' },
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Profile"
                  className="flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs text-muted-foreground transition-all duration-200"
                >
                  <User size={20} />
                  Profile
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>
                  <p className="font-display text-sm font-semibold text-foreground">Demo Investor</p>
                  <p className="text-xs text-muted-foreground">balance: {formatUSD(balance)}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => toast.info('Settings coming soon')}
                >
                  <Settings size={14} className="mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleReset}>
                  <RefreshCw size={14} className="mr-2" /> Reset Portfolio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => toast.success('Signed out (demo)')}
                >
                  <LogOut size={14} className="mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
