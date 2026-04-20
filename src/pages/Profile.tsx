import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Trophy, Wallet, TrendingUp, Calendar, Mail, Bell, Shield, RefreshCw, LogOut, Edit3, Award, Loader2, Save } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Icon3D from '@/components/ui/Icon3D';
import AchievementBadge from '@/components/leaderboard/AchievementBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { usePortfolio } from '@/lib/portfolio-context';
import { useNotifications, formatRelative, variantIcon } from '@/lib/notifications-context';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/profile-context';
import { computeUserRank, getUserAchievements, achievementMeta, type AchievementId, type LeaderUser } from '@/lib/leaderboard';
import { formatUSD } from '@/lib/vaults';

const Profile = () => {
  const { balance, investments, transactions, getTotalValue, getTotalPnL, reset } = usePortfolio();
  const { notifications, unreadCount } = useNotifications();
  const { user, signOut } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalValue = getTotalValue();
  const totalPnL = getTotalPnL();
  const portfolioTotal = balance + totalValue;
  const pnlPct = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Investor';
  const initials = displayName.slice(0, 2).toUpperCase();

  const { rank, total } = computeUserRank(portfolioTotal, pnlPct);
  const youUser: LeaderUser = {
    id: 'you', name: displayName, handle: '@you', vault: 'Your Portfolio',
    portfolio: portfolioTotal, pnlPct, streak: 0,
  };
  const earnedBadges = getUserAchievements(youUser, rank);
  const allBadges = Object.keys(achievementMeta) as AchievementId[];

  const totalDeposited = transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalInvested = transactions.filter((t) => t.type === 'invest').reduce((s, t) => s + t.amount, 0);
  const totalRedeemed = transactions.filter((t) => t.type === 'redeem').reduce((s, t) => s + t.amount, 0);
  const txCount = transactions.length;
  const memberSince = transactions.length > 0 ? transactions[transactions.length - 1].date : new Date();

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar too large', { description: 'Please choose an image under 5MB.' });
      return;
    }
    setUploading(true);
    const { error } = await uploadAvatar(file);
    setUploading(false);
    if (error) toast.error('Upload failed', { description: error });
    else toast.success('Avatar updated');
  };

  const startEditName = () => {
    setNameDraft(profile?.display_name ?? '');
    setEditingName(true);
  };

  const saveName = async () => {
    if (!nameDraft.trim()) { toast.error('Display name cannot be empty'); return; }
    setSavingName(true);
    const { error } = await updateProfile({ display_name: nameDraft.trim() });
    setSavingName(false);
    if (error) toast.error('Failed to save', { description: error });
    else { toast.success('Profile updated'); setEditingName(false); }
  };

  const handleReset = async () => {
    await reset();
    toast.success('Portfolio reset', { description: 'Your data has been cleared.' });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
  };

  const stats = [
    { label: 'Portfolio Value', value: formatUSD(portfolioTotal), icon: Wallet, variant: 'forest' as const },
    { label: 'Lifetime P&L', value: `${totalPnL >= 0 ? '+' : ''}${formatUSD(totalPnL)}`, icon: TrendingUp, variant: totalPnL >= 0 ? 'leaf' as const : 'ember' as const },
    { label: 'Active Positions', value: investments.length.toString(), icon: Shield, variant: 'gold' as const },
    { label: 'Leaderboard Rank', value: `#${rank} / ${total}`, icon: Trophy, variant: 'gold' as const },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      <div className="container mx-auto px-6 pb-12 pt-[88px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card relative mb-8 overflow-hidden rounded-3xl p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/30 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent font-display text-2xl font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarPick}
                disabled={uploading}
                aria-label="Change avatar"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
              </button>
            </div>

            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Display name"
                    className="max-w-xs"
                    autoFocus
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-60"
                  >
                    {savingName ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl font-bold text-foreground">{displayName}</h1>
                  <button
                    onClick={startEditName}
                    aria-label="Edit display name"
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} /> Member since {memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <span className="h-3 w-px bg-border" />
                <Link to="/notifications" className="inline-flex items-center gap-1.5 hover:text-foreground">
                  <Bell size={12} /> {unreadCount} unread alerts
                </Link>
              </div>

              {earnedBadges.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {earnedBadges.map((aid) => (
                    <AchievementBadge key={aid} id={aid} size="sm" />
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 glow-blue sm:self-center"
            >
              <Trophy size={14} /> View Rank
            </Link>
          </div>
        </motion.div>

        {/* Lifetime Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="glass-card glass-card-lift rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <Icon3D icon={s.icon} variant={s.variant} size="sm" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass-card rounded-2xl p-6 lg:col-span-2"
          >
            <h3 className="mb-5 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Award size={18} className="text-accent" /> Achievements
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {allBadges.map((aid) => {
                const meta = achievementMeta[aid];
                const earned = earnedBadges.includes(aid);
                return (
                  <div
                    key={aid}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
                      earned
                        ? 'border-accent/30 bg-secondary/40 shadow-[0_0_24px_-8px_hsl(var(--accent)/0.4)]'
                        : 'border-border/40 bg-background/40 opacity-50 grayscale'
                    }`}
                  >
                    <AchievementBadge id={aid} size="lg" />
                    <p className="font-display text-sm font-semibold text-foreground">{meta.label}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{meta.description}</p>
                    {!earned && (
                      <span className="mt-1 rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="mb-5 font-display text-lg font-semibold text-foreground">Lifetime Activity</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Deposited', value: formatUSD(totalDeposited) },
                { label: 'Total Invested', value: formatUSD(totalInvested) },
                { label: 'Total Redeemed', value: formatUSD(totalRedeemed) },
                { label: 'Transactions', value: txCount.toString() },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm text-muted-foreground">{row.label}</p>
                  <p className="font-display text-sm font-semibold text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="mb-5 font-display text-lg font-semibold text-foreground">Account Settings</h3>
          <div className="space-y-1">
            {[
              { label: 'Email price alerts', desc: 'Get an email when a vault moves ±2% in a tick.', value: emailAlerts, set: setEmailAlerts, icon: Mail },
              { label: 'In-app push notifications', desc: 'Real-time toasts and bell badge updates.', value: pushAlerts, set: setPushAlerts, icon: Bell },
              { label: 'Marketing updates', desc: 'New vaults, product news, and promotions.', value: marketing, set: setMarketing, icon: TrendingUp },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/30">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-foreground">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={row.value}
                    onCheckedChange={(v) => {
                      row.set(v);
                      toast.success(`${row.label} ${v ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              );
            })}

            <div className="mt-4 flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row">
              <button
                onClick={handleReset}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/70"
              >
                <RefreshCw size={14} /> Reset Portfolio
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent notifications */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 glass-card rounded-2xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">Recent Alerts</h3>
              <Link to="/notifications" className="text-xs font-semibold text-accent hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n) => {
                const Icon = variantIcon(n.variant);
                return (
                  <div key={n.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/30">
                    <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      n.variant === 'leaf' ? 'bg-vault-low/15 text-vault-low'
                      : n.variant === 'forest' ? 'bg-vault-very-low/15 text-vault-very-low'
                      : n.variant === 'gold' ? 'bg-vault-medium/15 text-vault-medium'
                      : 'bg-destructive/15 text-destructive'
                    }`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                      {n.description && <p className="truncate text-xs text-muted-foreground">{n.description}</p>}
                    </div>
                    <p className="flex-shrink-0 text-[11px] text-muted-foreground">{formatRelative(n.date)}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
