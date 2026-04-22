import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowDownToLine, Lock, Loader2, Clock, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Upload } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { usePortfolio } from '@/lib/portfolio-context';
import { useAccountStatus } from '@/lib/account-status-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatUSD, MAX_KYC_ATTEMPTS, WITHDRAWAL_PERIOD_HOURS } from '@/lib/vaults';

interface WithdrawalReq {
  id: string;
  amount: number;
  destination: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  completes_at: string;
  admin_notes: string | null;
}

const Withdraw = () => {
  const { user } = useAuth();
  const { balance } = usePortfolio();
  const { status, isRestricted, refresh: refreshStatus } = useAccountStatus();

  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [requests, setRequests] = useState<WithdrawalReq[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);

  // KYC modal state
  const [fullName, setFullName] = useState('');
  const [docType, setDocType] = useState('passport');
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [proofFunds, setProofFunds] = useState<File | null>(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const idRef = useRef<HTMLInputElement>(null);
  const fundsRef = useRef<HTMLInputElement>(null);

  const loadReqs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('id, amount, destination, status, requested_at, completes_at, admin_notes')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(20);
    if (data) setRequests(data as WithdrawalReq[]);
  };

  useEffect(() => { loadReqs(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`withdrawals-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests', filter: `user_id=eq.${user.id}` },
        () => loadReqs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const totalPending = requests.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0);
  const attemptsLeft = MAX_KYC_ATTEMPTS - (status?.failed_kyc_attempts ?? 0);

  const handleRequest = async () => {
    if (!user) return;
    if (isRestricted) { toast.error('Account restricted'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > balance) { toast.error('Insufficient available balance'); return; }
    if (!destination.trim()) { toast.error('Enter a destination address'); return; }

    // If KYC not approved, open KYC modal first
    if (status?.kyc_status !== 'approved') {
      setKycOpen(true);
      return;
    }
    await submitWithdrawal();
  };

  const submitWithdrawal = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: user.id,
      amount: parseFloat(amount),
      destination: destination.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error('Could not submit', { description: error.message }); return; }
    toast.success('Withdrawal requested', { description: `Processing within ${WITHDRAWAL_PERIOD_HOURS} hours.` });
    setAmount(''); setDestination('');
    loadReqs();
  };

  const handleKycSubmit = async () => {
    if (!user) return;
    if (!fullName.trim() || !idDoc || !proofFunds) {
      toast.error('Please complete all fields and upload both documents');
      return;
    }
    setKycSubmitting(true);
    try {
      const idPath = `${user.id}/id-${Date.now()}.${idDoc.name.split('.').pop()}`;
      const fundsPath = `${user.id}/funds-${Date.now()}.${proofFunds.name.split('.').pop()}`;
      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        supabase.storage.from('kyc-docs').upload(idPath, idDoc),
        supabase.storage.from('kyc-docs').upload(fundsPath, proofFunds),
      ]);
      if (e1 || e2) throw e1 || e2;

      const { error } = await supabase.from('kyc_submissions').insert({
        user_id: user.id,
        full_name: fullName.trim(),
        doc_type: docType,
        id_doc_path: idPath,
        proof_of_funds_path: fundsPath,
      });
      if (error) throw error;

      // Mark KYC as pending on account_status
      await supabase.from('account_status').update({ kyc_status: 'pending' }).eq('user_id', user.id);
      await refreshStatus();

      toast.success('KYC submitted', { description: 'Admin review usually takes 24h. Withdrawal queued after approval.' });
      // Now submit the withdrawal as pending — admin can approve once KYC passes
      await submitWithdrawal();
      setKycOpen(false);
      setFullName(''); setIdDoc(null); setProofFunds(null);
      if (idRef.current) idRef.current.value = '';
      if (fundsRef.current) fundsRef.current.value = '';
    } catch (e: any) {
      toast.error('KYC submission failed', { description: e.message });
    } finally {
      setKycSubmitting(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'completed') return <span className="inline-flex items-center gap-1 rounded-full bg-vault-very-low/20 px-2 py-0.5 text-[10px] font-semibold text-vault-very-low"><CheckCircle2 size={10} /> Completed</span>;
    if (s === 'approved') return <span className="inline-flex items-center gap-1 rounded-full bg-vault-low/20 px-2 py-0.5 text-[10px] font-semibold text-vault-low"><CheckCircle2 size={10} /> Approved</span>;
    if (s === 'rejected') return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive"><XCircle size={10} /> Rejected</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-500"><Clock size={10} /> Pending</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 pt-[88px] pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Withdraw Funds</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Withdrawals process within {WITHDRAWAL_PERIOD_HOURS} hours and require KYC + proof of funds.
            </p>
          </div>

          {isRestricted && (
            <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <Lock size={16} /><p className="text-sm font-semibold">Withdrawals disabled — your account is {status?.status}.</p>
              </div>
              {status?.blacklist_reason && <p className="mt-1 text-xs text-destructive/80">Reason: {status.blacklist_reason}</p>}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 glass-card rounded-2xl p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Request a withdrawal</h3>

              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available</p>
                  <p className="font-display text-lg font-bold text-foreground">{formatUSD(balance)}</p>
                </div>
                <div className="rounded-xl border border-border/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending withdrawal</p>
                  <p className="font-display text-lg font-bold text-amber-500">{formatUSD(totalPending)}</p>
                </div>
                <div className="rounded-xl border border-border/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Processing time</p>
                  <p className="font-display text-lg font-bold text-foreground">{WITHDRAWAL_PERIOD_HOURS}h</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount (USD)</label>
                  <Input type="number" step="0.01" placeholder="500.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isRestricted} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Destination wallet address</label>
                  <Input placeholder="0x... / bc1... / T..." value={destination} onChange={(e) => setDestination(e.target.value)} disabled={isRestricted} />
                </div>
                <Button onClick={handleRequest} disabled={isRestricted || submitting} className="w-full">
                  {submitting ? <><Loader2 size={14} className="mr-2 animate-spin" /> Submitting...</> : <><ArrowDownToLine size={14} className="mr-2" /> Request withdrawal</>}
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <ShieldCheck size={16} className="text-primary" /> KYC status
              </h3>
              <p className="text-sm text-foreground capitalize">{(status?.kyc_status ?? 'not_submitted').replace('_', ' ')}</p>
              {status && status.kyc_status !== 'approved' && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  KYC + proof of funds required before any withdrawal completes. {attemptsLeft > 0 ? `${attemptsLeft} of ${MAX_KYC_ATTEMPTS} attempts remaining.` : ''}
                </p>
              )}
              {status?.failed_kyc_attempts && status.failed_kyc_attempts >= MAX_KYC_ATTEMPTS - 1 && status.kyc_status !== 'approved' && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-[11px] text-amber-600">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  <p>Your account will be locked after {MAX_KYC_ATTEMPTS} failed attempts.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 glass-card rounded-2xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Clock size={18} className="text-primary" /> Withdrawal history
            </h3>
            {requests.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No withdrawal requests yet.</p>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{formatUSD(Number(r.amount))}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">to {r.destination}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Requested {new Date(r.requested_at).toLocaleString()} · Completes by {new Date(r.completes_at).toLocaleString()}
                      </p>
                      {r.admin_notes && <p className="mt-1 text-[11px] italic text-muted-foreground">"{r.admin_notes}"</p>}
                    </div>
                    {statusBadge(r.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* KYC Modal */}
      <Dialog open={kycOpen} onOpenChange={setKycOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck size={18} /> Verify your identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We need to verify your identity and source of funds before processing withdrawals. {attemptsLeft} of {MAX_KYC_ATTEMPTS} attempts remaining.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Legal full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">ID document type</label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's license</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Upload ID document</label>
              <input ref={idRef} type="file" accept="image/*,application/pdf" onChange={(e) => setIdDoc(e.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Proof of funds (bank statement, payslip, etc.)</label>
              <input ref={fundsRef} type="file" accept="image/*,application/pdf" onChange={(e) => setProofFunds(e.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold" />
            </div>
            <Button onClick={handleKycSubmit} disabled={kycSubmitting} className="w-full">
              {kycSubmitting ? <><Loader2 size={14} className="mr-2 animate-spin" /> Submitting...</> : <><Upload size={14} className="mr-2" /> Submit for review</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Withdraw;
