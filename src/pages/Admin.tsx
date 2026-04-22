import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, ShieldOff, ShieldCheck, Lock, Unlock, FileText, Wallet, Gift, Users, ArrowDownToLine } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatUSD } from '@/lib/vaults';

type Method = 'approve' | 'reject';

const Admin = () => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Note dialog
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [pendingAction, setPendingAction] = useState<null | (() => Promise<void>)>(null);

  // Blacklist dialog
  const [blOpen, setBlOpen] = useState(false);
  const [blReason, setBlReason] = useState('');
  const [blUser, setBlUser] = useState<{ user_id: string; display_name: string } | null>(null);

  const loadAll = async () => {
    const [d, w, k, g, u] = await Promise.all([
      supabase.from('deposit_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawal_requests').select('*').order('requested_at', { ascending: false }),
      supabase.from('kyc_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('gift_card_exchanges').select('*').order('created_at', { ascending: false }),
      supabase.from('account_status').select('user_id, status, kyc_status, failed_kyc_attempts, blacklist_reason, locked_at'),
    ]);
    if (d.data) setDeposits(d.data);
    if (w.data) setWithdrawals(w.data);
    if (k.data) setKyc(k.data);
    if (g.data) setGifts(g.data);
    if (u.data) {
      const ids = u.data.map((row) => row.user_id);
      const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', ids);
      const profMap = Object.fromEntries((profs ?? []).map((p) => [p.user_id, p.display_name]));
      setUsers(u.data.map((row) => ({ ...row, display_name: profMap[row.user_id] ?? '—' })));
    }
  };

  useEffect(() => { loadAll(); }, []);

  const signedUrl = async (bucket: string, path: string) => {
    const key = `${bucket}::${path}`;
    if (signedUrls[key]) return signedUrls[key];
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setSignedUrls((p) => ({ ...p, [key]: data.signedUrl }));
      return data.signedUrl;
    }
    return null;
  };

  // ---- Approval logic ----
  const approveDeposit = async (row: any, notes: string) => {
    if (!user) return;
    // Update portfolio balance
    const { data: portfolio } = await supabase.from('portfolios').select('balance').eq('user_id', row.user_id).maybeSingle();
    const newBalance = Number(portfolio?.balance ?? 0) + Number(row.amount);
    await supabase.from('portfolios').update({ balance: newBalance }).eq('user_id', row.user_id);
    await supabase.from('transactions').insert({
      user_id: row.user_id, type: 'deposit', amount: Number(row.amount),
    });
    await supabase.from('deposit_requests').update({
      status: 'approved', admin_notes: notes || null, reviewed_at: new Date().toISOString(), reviewed_by: user.id,
    }).eq('id', row.id);
    toast.success('Deposit approved & funds credited');
    loadAll();
  };

  const rejectDeposit = async (row: any, notes: string) => {
    if (!user) return;
    await supabase.from('deposit_requests').update({
      status: 'rejected', admin_notes: notes || null, reviewed_at: new Date().toISOString(), reviewed_by: user.id,
    }).eq('id', row.id);
    toast.success('Deposit rejected');
    loadAll();
  };

  const approveWithdrawal = async (row: any, notes: string) => {
    if (!user) return;
    // Deduct from portfolio
    const { data: portfolio } = await supabase.from('portfolios').select('balance').eq('user_id', row.user_id).maybeSingle();
    const cur = Number(portfolio?.balance ?? 0);
    if (cur < Number(row.amount)) { toast.error('User has insufficient balance'); return; }
    await supabase.from('portfolios').update({ balance: cur - Number(row.amount) }).eq('user_id', row.user_id);
    await supabase.from('transactions').insert({
      user_id: row.user_id, type: 'withdraw', amount: Number(row.amount),
    });
    await supabase.from('withdrawal_requests').update({
      status: 'completed', admin_notes: notes || null, processed_at: new Date().toISOString(),
    }).eq('id', row.id);
    toast.success('Withdrawal completed');
    loadAll();
  };

  const rejectWithdrawal = async (row: any, notes: string) => {
    await supabase.from('withdrawal_requests').update({
      status: 'rejected', admin_notes: notes || null, processed_at: new Date().toISOString(),
    }).eq('id', row.id);
    toast.success('Withdrawal rejected');
    loadAll();
  };

  const approveKyc = async (row: any, notes: string) => {
    if (!user) return;
    await supabase.from('kyc_submissions').update({
      status: 'approved', admin_notes: notes || null, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
    }).eq('id', row.id);
    await supabase.from('account_status').update({ kyc_status: 'approved' }).eq('user_id', row.user_id);
    toast.success('KYC approved');
    loadAll();
  };

  const rejectKyc = async (row: any, notes: string) => {
    if (!user) return;
    // Increment failed attempts
    const { data: st } = await supabase.from('account_status').select('failed_kyc_attempts').eq('user_id', row.user_id).maybeSingle();
    const attempts = (st?.failed_kyc_attempts ?? 0) + 1;
    const updates: any = { kyc_status: 'rejected', failed_kyc_attempts: attempts };
    if (attempts >= 3) {
      updates.status = 'locked';
      updates.locked_at = new Date().toISOString();
    }
    await supabase.from('account_status').update(updates).eq('user_id', row.user_id);
    await supabase.from('kyc_submissions').update({
      status: 'rejected', admin_notes: notes || null, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
    }).eq('id', row.id);
    toast.success(attempts >= 3 ? 'KYC rejected — account locked (3 fails)' : `KYC rejected (${attempts}/3 attempts)`);
    loadAll();
  };

  const approveGift = async (row: any, notes: string) => {
    if (!user) return;
    const { data: portfolio } = await supabase.from('portfolios').select('balance').eq('user_id', row.user_id).maybeSingle();
    const newBalance = Number(portfolio?.balance ?? 0) + Number(row.payout_amount);
    await supabase.from('portfolios').update({ balance: newBalance }).eq('user_id', row.user_id);
    await supabase.from('transactions').insert({
      user_id: row.user_id, type: 'deposit', amount: Number(row.payout_amount), vault_name: `Gift card: ${row.brand}`,
    });
    await supabase.from('gift_card_exchanges').update({
      status: 'approved', admin_notes: notes || null, reviewed_at: new Date().toISOString(), reviewed_by: user.id,
    }).eq('id', row.id);
    toast.success('Gift card approved & credited');
    loadAll();
  };

  const rejectGift = async (row: any, notes: string) => {
    if (!user) return;
    await supabase.from('gift_card_exchanges').update({
      status: 'rejected', admin_notes: notes || null, reviewed_at: new Date().toISOString(), reviewed_by: user.id,
    }).eq('id', row.id);
    toast.success('Gift card rejected');
    loadAll();
  };

  const setUserStatus = async (userId: string, newStatus: 'active' | 'locked' | 'blacklisted', reason?: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'blacklisted' || newStatus === 'locked') {
      updates.locked_at = new Date().toISOString();
      if (reason) updates.blacklist_reason = reason;
    } else {
      updates.failed_kyc_attempts = 0;
      updates.locked_at = null;
      updates.blacklist_reason = null;
    }
    await supabase.from('account_status').update(updates).eq('user_id', userId);
    toast.success(`User set to ${newStatus}`);
    loadAll();
  };

  const promptNote = (act: Method, fn: (row: any, notes: string) => Promise<void>, row: any) => {
    setNoteText('');
    setPendingAction(() => async () => fn(row, noteText));
    setNoteOpen(true);
  };

  // We must close over latest noteText — use a setter that reads on submit
  const submitNote = async () => {
    if (!pendingAction) return;
    setNoteOpen(false);
    await pendingAction();
    setPendingAction(null);
    setNoteText('');
  };

  const ProofLink = ({ bucket, path }: { bucket: string; path: string | null }) => {
    if (!path) return <span className="text-[10px] text-muted-foreground">—</span>;
    return (
      <button
        onClick={async () => {
          const u = await signedUrl(bucket, path);
          if (u) window.open(u, '_blank');
        }}
        className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground hover:bg-secondary/70"
      >
        <FileText size={10} /> View
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 pt-[88px] pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review and approve user activity. All actions are logged.</p>
          </div>

          <Tabs defaultValue="deposits" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="deposits"><Wallet size={14} className="mr-2" /> Deposits ({deposits.filter((r) => r.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="withdrawals"><ArrowDownToLine size={14} className="mr-2" /> Withdrawals ({withdrawals.filter((r) => r.status === 'pending' || r.status === 'approved').length})</TabsTrigger>
              <TabsTrigger value="kyc"><ShieldCheck size={14} className="mr-2" /> KYC ({kyc.filter((r) => r.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="giftcards"><Gift size={14} className="mr-2" /> Gift Cards ({gifts.filter((r) => r.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="users"><Users size={14} className="mr-2" /> Users</TabsTrigger>
            </TabsList>

            {/* DEPOSITS */}
            <TabsContent value="deposits">
              <div className="glass-card rounded-2xl p-5">
                {deposits.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No deposits</p>}
                {deposits.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border/30 py-3 last:border-0">
                    <div className="min-w-[200px] flex-1">
                      <p className="text-xs font-mono text-muted-foreground truncate">{r.user_id.slice(0, 8)}…</p>
                      <p className="text-sm font-semibold text-foreground">{formatUSD(Number(r.amount))} <span className="text-xs font-normal text-muted-foreground">in {r.currency}</span></p>
                      <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <ProofLink bucket="payment-proofs" path={r.proof_path} />
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === 'approved' ? 'bg-vault-very-low/20 text-vault-very-low'
                      : r.status === 'rejected' ? 'bg-destructive/20 text-destructive'
                      : 'bg-amber-500/20 text-amber-500'
                    }`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => promptNote('approve', approveDeposit, r)}><CheckCircle2 size={12} /></Button>
                        <Button size="sm" variant="outline" onClick={() => promptNote('reject', rejectDeposit, r)}><XCircle size={12} /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* WITHDRAWALS */}
            <TabsContent value="withdrawals">
              <div className="glass-card rounded-2xl p-5">
                {withdrawals.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No withdrawals</p>}
                {withdrawals.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border/30 py-3 last:border-0">
                    <div className="min-w-[240px] flex-1">
                      <p className="text-xs font-mono text-muted-foreground truncate">{r.user_id.slice(0, 8)}…</p>
                      <p className="text-sm font-semibold text-foreground">{formatUSD(Number(r.amount))}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[300px]">→ {r.destination}</p>
                      <p className="text-[10px] text-muted-foreground">Requested {new Date(r.requested_at).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === 'completed' ? 'bg-vault-very-low/20 text-vault-very-low'
                      : r.status === 'rejected' ? 'bg-destructive/20 text-destructive'
                      : 'bg-amber-500/20 text-amber-500'
                    }`}>{r.status}</span>
                    {(r.status === 'pending' || r.status === 'approved') && (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => promptNote('approve', approveWithdrawal, r)}>Complete</Button>
                        <Button size="sm" variant="outline" onClick={() => promptNote('reject', rejectWithdrawal, r)}>Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* KYC */}
            <TabsContent value="kyc">
              <div className="glass-card rounded-2xl p-5">
                {kyc.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No KYC submissions</p>}
                {kyc.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border/30 py-3 last:border-0">
                    <div className="min-w-[200px] flex-1">
                      <p className="text-sm font-semibold text-foreground">{r.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.doc_type} · {new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <ProofLink bucket="kyc-docs" path={r.id_doc_path} />
                    <ProofLink bucket="kyc-docs" path={r.proof_of_funds_path} />
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === 'approved' ? 'bg-vault-very-low/20 text-vault-very-low'
                      : r.status === 'rejected' ? 'bg-destructive/20 text-destructive'
                      : 'bg-amber-500/20 text-amber-500'
                    }`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => promptNote('approve', approveKyc, r)}><CheckCircle2 size={12} /></Button>
                        <Button size="sm" variant="outline" onClick={() => promptNote('reject', rejectKyc, r)}><XCircle size={12} /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* GIFT CARDS */}
            <TabsContent value="giftcards">
              <div className="glass-card rounded-2xl p-5">
                {gifts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No gift card submissions</p>}
                {gifts.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border/30 py-3 last:border-0">
                    <div className="min-w-[200px] flex-1">
                      <p className="text-sm font-semibold text-foreground">{r.brand} — {formatUSD(Number(r.card_value))}</p>
                      <p className="text-[11px] text-muted-foreground">Code: <code className="font-mono">{r.card_code}</code></p>
                      <p className="text-[11px] text-vault-very-low">Payout: {formatUSD(Number(r.payout_amount))} ({r.payout_pct}%)</p>
                    </div>
                    <ProofLink bucket="gift-card-proofs" path={r.proof_path} />
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === 'approved' ? 'bg-vault-very-low/20 text-vault-very-low'
                      : r.status === 'rejected' ? 'bg-destructive/20 text-destructive'
                      : 'bg-amber-500/20 text-amber-500'
                    }`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => promptNote('approve', approveGift, r)}><CheckCircle2 size={12} /></Button>
                        <Button size="sm" variant="outline" onClick={() => promptNote('reject', rejectGift, r)}><XCircle size={12} /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* USERS */}
            <TabsContent value="users">
              <div className="glass-card rounded-2xl p-5">
                {users.map((u) => (
                  <div key={u.user_id} className="flex flex-wrap items-center gap-3 border-b border-border/30 py-3 last:border-0">
                    <div className="min-w-[200px] flex-1">
                      <p className="text-sm font-semibold text-foreground">{u.display_name}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{u.user_id.slice(0, 12)}…</p>
                      {u.blacklist_reason && <p className="text-[11px] italic text-destructive">"{u.blacklist_reason}"</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">KYC: <strong className="text-foreground">{u.kyc_status}</strong> · Failed: {u.failed_kyc_attempts}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      u.status === 'active' ? 'bg-vault-very-low/20 text-vault-very-low'
                      : u.status === 'locked' ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-destructive/20 text-destructive'
                    }`}>{u.status}</span>
                    <div className="flex gap-1.5">
                      {u.status !== 'active' && (
                        <Button size="sm" variant="outline" onClick={() => setUserStatus(u.user_id, 'active')}><Unlock size={12} className="mr-1" /> Reactivate</Button>
                      )}
                      {u.status !== 'locked' && (
                        <Button size="sm" variant="outline" onClick={() => setUserStatus(u.user_id, 'locked')}><Lock size={12} className="mr-1" /> Lock</Button>
                      )}
                      {u.status !== 'blacklisted' && (
                        <Button size="sm" variant="destructive" onClick={() => { setBlUser({ user_id: u.user_id, display_name: u.display_name }); setBlReason(''); setBlOpen(true); }}>
                          <ShieldOff size={12} className="mr-1" /> Blacklist
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Note dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add a note (optional)</DialogTitle></DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Reason or notes for the user..." rows={3} />
          <Button onClick={submitNote}>Confirm</Button>
        </DialogContent>
      </Dialog>

      {/* Blacklist dialog */}
      <Dialog open={blOpen} onOpenChange={setBlOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Blacklist {blUser?.display_name}</DialogTitle></DialogHeader>
          <Input value={blReason} onChange={(e) => setBlReason(e.target.value)} placeholder="Reason (visible to user)" />
          <Button variant="destructive" onClick={async () => {
            if (!blUser) return;
            await setUserStatus(blUser.user_id, 'blacklisted', blReason || 'Policy violation');
            setBlOpen(false);
          }}>Blacklist user</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
