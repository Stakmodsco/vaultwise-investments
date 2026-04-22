import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Bell, User, LayoutDashboard, Vault, Wallet, Trophy, Settings, RefreshCw, LogOut, ArrowDownToLine, ArrowUpFromLine, Gift, MessageCircle, ShieldCheck, Crown } from 'lucide-react';
import { usePortfolio } from '@/lib/portfolio-context';
import { useNotifications, formatRelative, variantIcon } from '@/lib/notifications-context';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/profile-context';
import { useRole } from '@/lib/role-context';
import { formatUSD } from '@/lib/vaults';
import vaultxLogo from '@/assets/vaultx-logo.png';
import CryptoTicker from './CryptoTicker';
import ThemeToggle from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const location = useLocation();
  const { balance, reset } = usePortfolio();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useRole();
  const isLanding = location.pathname === '/';
  const isAuthRoute = location.pathname === '/auth';

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Investor';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleReset = async () => {
    await reset();
    toast.success('Portfolio reset', { description: 'Balance restored to $10,000.' });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
  };

  if (isAuthRoute) return null;

  return (
    <>
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
            {!isLanding && user && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-secondary ${
                    location.pathname === '/dashboard' ? 'text-foreground bg-secondary' : 'text-muted-foreground'
                  }`}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link
                  to="/vaults"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-secondary ${
                    location.pathname === '/vaults' ? 'text-foreground bg-secondary' : 'text-muted-foreground'
                  }`}
                >
                  <Vault size={16} /> Vaults
                </Link>
                <Link
                  to="/leaderboard"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-secondary ${
                    location.pathname === '/leaderboard' ? 'text-foreground bg-secondary' : 'text-muted-foreground'
                  }`}
                >
                  <Trophy size={16} /> Leaderboard
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isLanding && user && (
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
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground animate-pulse-glow">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Notifications</span>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {unreadCount} new
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 && (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">No alerts yet</p>
                    )}
                    {notifications.slice(0, 6).map((n) => {
                      const Icon = variantIcon(n.variant);
                      return (
                        <DropdownMenuItem
                          key={n.id}
                          asChild
                          className="flex items-start gap-3 py-2.5 cursor-pointer"
                        >
                          <Link to="/notifications">
                            <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                              n.variant === 'leaf' ? 'bg-vault-low/15 text-vault-low'
                              : n.variant === 'forest' ? 'bg-vault-very-low/15 text-vault-very-low'
                              : n.variant === 'gold' ? 'bg-vault-medium/15 text-vault-medium'
                              : 'bg-destructive/15 text-destructive'
                            }`}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground">{formatRelative(n.date)}</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/notifications" className="justify-center text-xs">View all alerts →</Link>
                    </DropdownMenuItem>
                    {unreadCount > 0 && (
                      <DropdownMenuItem
                        className="cursor-pointer justify-center text-xs text-muted-foreground"
                        onClick={() => { markAllRead(); toast.success('All notifications marked as read'); }}
                      >
                        Mark all as read
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="User menu"
                      className="rounded-full transition-all duration-200 hover:opacity-90"
                    >
                      <Avatar className="h-9 w-9 border border-border">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="font-display text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/profile"><User size={14} className="mr-2" /> Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/deposit"><ArrowDownToLine size={14} className="mr-2" /> Deposit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/withdraw"><ArrowUpFromLine size={14} className="mr-2" /> Withdraw</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/gift-cards"><Gift size={14} className="mr-2" /> Gift Cards</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/security"><ShieldCheck size={14} className="mr-2" /> Security (2FA)</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/support"><MessageCircle size={14} className="mr-2" /> Support</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/admin"><Crown size={14} className="mr-2" /> Admin</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="cursor-pointer" onClick={handleReset}>
                      <RefreshCw size={14} className="mr-2" /> Reset Portfolio
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut size={14} className="mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {(isLanding || !user) && !isAuthRoute && (
              <Link
                to={user ? '/dashboard' : '/auth'}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 glow-blue"
              >
                {user ? 'Launch App' : 'Sign in'}
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {!isLanding && user && <CryptoTicker />}

      {/* Mobile Bottom Navigation */}
      {!isLanding && user && (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border md:hidden">
          <div className="flex items-center justify-around py-2">
            {[
              { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { to: '/vaults', icon: Vault, label: 'Vaults' },
              { to: '/leaderboard', icon: Trophy, label: 'Leaders' },
              { to: '/profile', icon: User, label: 'Profile' },
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
