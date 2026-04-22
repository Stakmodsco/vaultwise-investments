import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, Copy, Upload, Loader2, Clock, CheckCircle2, XCircle, CreditCard, Image as ImageIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatUSD } from '@/lib/vaults';

interface PaymentWallet {
  id: string;
  currency: string;
  network: string;
  address: string;
  memo: string | null;
}

interface DepositRequest {
  id: string;
  method: string;
  currency: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  proof_path: string | null;
  created_at: string;
  admin_notes: string | null;
}

const Deposit = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<PaymentWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('payment_wallets').select('*').eq('active', true).then(({ data }) => {
      if (data) {
        setWallets(data as PaymentWallet[]);
        if (data.length > 0) setSelectedWalletId(data[0].id);
      }
    });
  }, []);

  const loadRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('deposit_requests')
      .select('id, method, currency, amount, status, proof_path, created_at, admin_notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRequests(data as DepositRequest[]);
  };

  useEffect(() => { loadRequests(); }, [user]);

  // Realtime updates when admin approves
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`deposits-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deposit_requests', filter: `user_id=eq.${user.id}` },
        () => loadRequests())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  const handleSubmitCrypto = async () => {
    if (!user || !selectedWallet) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!proofFile) { toast.error('Please upload a payment screenshot'); return; }

    setSubmitting(true);
    try {
      const ext = proofFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, proofFile);
      if (upErr) throw upErr;

      const { error } = await supabase.from('deposit_requests').insert({
        user_id: user.id,
        method: 'crypto',
        currency: selectedWallet.currency,
        amount: amt,
        wallet_address: selectedWallet.address,
        tx_hash: txHash || null,
        proof_path: path,
      });
      if (error) throw error;

      toast.success('Deposit submitted', { description: 'Waiting for admin approval.' });
      setAmount(''); setTxHash(''); setProofFile(null);
      if (fileRef.current) fileRef.current.value = '';
      loadRequests();
    } catch (e: any) {
      toast.error('Submission failed', { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied');
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return <span className="inline-flex items-center gap-1 rounded-full bg-vault-very-low/20 px-2 py-0.5 text-[10px] font-semibold text-vault-very-low"><CheckCircle2 size={10} /> Approved</span>;
    if (s === 'rejected') return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive"><XCircle size={10} /> Rejected</span>;
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-500"><Loader2 size={10} className="animate-spin" /> Pending review</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 pt-[88px] pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Deposit Funds</h1>
            <p className="mt-1 text-sm text-muted-foreground">Add funds to your portfolio. Crypto deposits require a screenshot of your transaction.</p>
          </div>

          <Tabs defaultValue="crypto" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="crypto"><Wallet size={14} className="mr-2" /> Crypto</TabsTrigger>
              <TabsTrigger value="card"><CreditCard size={14} className="mr-2" /> Card</TabsTrigger>
            </TabsList>

            <TabsContent value="crypto">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold text-foreground">1. Send funds</h3>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Currency / Network</label>
                  <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.currency} — {w.network}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedWallet && (
                    <div className="mt-4 rounded-xl border border-border/40 bg-background/40 p-4">
                      <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Send to address</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded-md bg-secondary/60 px-3 py-2 font-mono text-xs text-foreground">{selectedWallet.address}</code>
                        <Button size="icon" variant="outline" onClick={() => copyAddress(selectedWallet.address)}><Copy size={14} /></Button>
                      </div>
                      {selectedWallet.address.startsWith('PLACEHOLDER') && (
                        <p className="mt-2 text-[11px] text-amber-500">⚠ Placeholder address — admin must set real wallets in /admin.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold text-foreground">2. Submit proof</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount sent (USD value)</label>
                      <Input type="number" step="0.01" placeholder="100.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Transaction hash (optional)</label>
                      <Input placeholder="0x..." value={txHash} onChange={(e) => setTxHash(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment screenshot *</label>
                      <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold" />
                      {proofFile && <p className="mt-1 text-[11px] text-muted-foreground"><ImageIcon size={10} className="inline mr-1" />{proofFile.name}</p>}
                    </div>
                    <Button onClick={handleSubmitCrypto} disabled={submitting} className="w-full">
                      {submitting ? <><Loader2 size={14} className="mr-2 animate-spin" /> Submitting...</> : <><Upload size={14} className="mr-2" /> Submit for approval</>}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="card">
              <div className="glass-card rounded-2xl p-8 text-center">
                <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">Card payments coming soon</h3>
                <p className="mt-1 text-sm text-muted-foreground">We're integrating a card processor. For now, please use crypto.</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Pending list */}
          <div className="mt-8 glass-card rounded-2xl p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Clock size={18} className="text-primary" /> Your deposit requests
            </h3>
            {requests.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No deposit requests yet.</p>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.status === 'pending' && <Loader2 size={16} className="animate-spin text-amber-500" />}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatUSD(r.amount)} <span className="text-xs font-normal text-muted-foreground">in {r.currency}</span></p>
                        <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                        {r.admin_notes && <p className="mt-1 text-[11px] italic text-muted-foreground">"{r.admin_notes}"</p>}
                      </div>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Deposit;
