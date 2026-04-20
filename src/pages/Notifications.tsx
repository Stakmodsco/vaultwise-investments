import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Filter, Inbox, CheckCheck, Trash2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useNotifications, formatRelative, variantIcon, type Notification } from '@/lib/notifications-context';
import { usePortfolio } from '@/lib/portfolio-context';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type DateFilter = 'all' | '24h' | '7d' | '30d';

const Notifications = () => {
  const { notifications, unreadCount, loading, markAllRead, markRead, clear } = useNotifications();
  const { vaults } = usePortfolio();

  const [vaultFilter, setVaultFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Available vault filter options derived from notification history + known vaults
  const vaultOptions = useMemo(() => {
    const set = new Set<string>();
    notifications.forEach((n) => { if (n.vault_id) set.add(n.vault_id); });
    return [
      { id: 'all', name: 'All vaults' },
      ...vaults.filter((v) => set.has(v.id)).map((v) => ({ id: v.id, name: v.name })),
      // include unknown ids too
      ...Array.from(set)
        .filter((id) => !vaults.find((v) => v.id === id))
        .map((id) => ({ id, name: id })),
    ];
  }, [notifications, vaults]);

  const filtered = useMemo(() => {
    const cutoff: Record<DateFilter, number | null> = {
      all: null,
      '24h': Date.now() - 24 * 3600_000,
      '7d': Date.now() - 7 * 24 * 3600_000,
      '30d': Date.now() - 30 * 24 * 3600_000,
    };
    const limit = cutoff[dateFilter];
    return notifications.filter((n) => {
      if (vaultFilter !== 'all' && n.vault_id !== vaultFilter) return false;
      if (limit && n.date.getTime() < limit) return false;
      if (unreadOnly && n.read) return false;
      return true;
    });
  }, [notifications, vaultFilter, dateFilter, unreadOnly]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    filtered.forEach((n) => {
      const key = n.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      (groups[key] ||= []).push(n);
    });
    return groups;
  }, [filtered]);

  // Mark visible items as read after 1.5s view
  useEffect(() => {
    const t = setTimeout(() => {
      filtered.filter((n) => !n.read).slice(0, 5).forEach((n) => markRead(n.id));
    }, 1500);
    return () => clearTimeout(t);
  }, [filtered, markRead]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 pb-12 pt-[88px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link to="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft size={12} /> Back to dashboard
              </Link>
              <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Real-time price alerts and achievement updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
              <button
                onClick={clear}
                disabled={notifications.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40"
              >
                <Trash2 size={13} /> Clear all
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter size={12} /> Filter
            </div>
            <Select value={vaultFilter} onValueChange={setVaultFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="All vaults" />
              </SelectTrigger>
              <SelectContent>
                {vaultOptions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any time</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer accent-primary"
              />
              Unread only ({unreadCount})
            </label>
          </div>

          {/* List */}
          {loading ? (
            <div className="glass-card flex items-center justify-center rounded-2xl p-16 text-sm text-muted-foreground">
              Loading alerts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card flex flex-col items-center rounded-2xl p-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
                <Inbox size={26} />
              </div>
              <p className="font-display text-lg font-semibold text-foreground">No alerts to show</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try widening your filters, or invest in a vault — you'll be notified when prices move ±2% in a tick.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day}>
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
                  <div className="glass-card overflow-hidden rounded-2xl">
                    {items.map((n, idx) => {
                      const Icon = variantIcon(n.variant);
                      return (
                        <motion.button
                          key={n.id}
                          onClick={() => !n.read && markRead(n.id)}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.02 }}
                          className={`flex w-full items-start gap-3 border-b border-border/30 px-5 py-4 text-left transition-colors duration-200 last:border-0 hover:bg-secondary/30 ${
                            !n.read ? 'bg-secondary/10' : ''
                          }`}
                        >
                          <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                            n.variant === 'leaf' ? 'bg-vault-low/15 text-vault-low'
                            : n.variant === 'forest' ? 'bg-vault-very-low/15 text-vault-very-low'
                            : n.variant === 'gold' ? 'bg-vault-medium/15 text-vault-medium'
                            : 'bg-destructive/15 text-destructive'
                          }`}>
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{n.title}</p>
                            {n.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{formatRelative(n.date)}</span>
                              {n.vault_name && (
                                <>
                                  <span>·</span>
                                  <Link to={`/vault/${n.vault_id}`} className="text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {n.vault_name}
                                  </Link>
                                </>
                              )}
                              {n.change_pct !== null && (
                                <>
                                  <span>·</span>
                                  <span className={n.change_pct >= 0 ? 'text-vault-low' : 'text-destructive'}>
                                    {n.change_pct >= 0 ? '+' : ''}{n.change_pct.toFixed(2)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {!n.read && (
                            <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent animate-pulse-glow" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Notifications;
