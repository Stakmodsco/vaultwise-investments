import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Gift, Upload, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatUSD } from '@/lib/vaults';

const BRANDS = [
  { value: 'amazon', label: 'Amazon', payout: 75 },
  { value: 'apple', label: 'Apple / iTunes', payout: 70 },
  { value: 'google_play', label: 'Google Play', payout: 65 },
  { value: 'steam', label: 'Steam', payout: 80 },
  { value: 'walmart', label: 'Walmart', payout: 70 },
  { value: 'visa', label: 'Visa Prepaid', payout: 78 },
  { value: 'sephora', label: 'Sephora', payout: 60 },
];

interface Exchange {
  id: string;
  brand: string;
  card_value: number;
  payout_pct: number;
  payout_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes: string | null;
}

const GiftCards = () => {
  const { user } = useAuth();
  const [brand, setBrand] = useState(BRANDS[0].value);
  const [cardValue, setCardValue] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = BRANDS.find((b) => b.value === brand)!;
  const value = parseFloat(cardValue) || 0;
  const payout = (value * selected.payout) / 100;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('gift_card_exchanges')
      .select('id, brand, card_value, payout_pct, payout_amount, status, created_at, admin_notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data as Exchange[]);
  };
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`gc-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gift_card_exchanges', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (!value || value <= 0) { toast.error('Enter the card value'); return; }
    if (!cardCode.trim()) { toast.error('Enter the card code'); return; }
    setSubmitting(true);
    try {
      let proofPath: string | null = null;
      if (proof) {
        proofPath = `${user.id}/${Date.now()}.${proof.name.split('.').pop()}`;
        const { error: e } = await supabase.storage.from('gift-card-proofs').upload(proofPath, proof);
        if (e) throw e;
      }
      const { error } = await supabase.from('gift_card_exchanges').insert({
        user_id: user.id,
        brand: selected.label,
        card_value: value,
        card_code: cardCode.trim(),
        payout_pct: selected.payout,
        payout_amount: payout,
        proof_path: proofPath,
      });
      if (error) throw error;
      toast.success('Submitted for review', { description: 'Admin will verify and credit your account.' });
      setCardValue(''); setCardCode(''); setProof(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e: any) {
      toast.error('Submission failed', { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const badge = (s: string) => {
    if (s === 'approved') return <span className="rounded-full bg-vault-very-low/20 px-2 py-0.5 text-[10px] font-semibold text-vault-very-low"><CheckCircle2 size={10} className="inline mr-1" />Approved</span>;
    if (s === 'rejected') return <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive"><XCircle size={10} className="inline mr-1" />Rejected</span>;
    return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-500"><Clock size={10} className="inline mr-1" />Pending</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-6 pt-[88px] pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Exchange Gift Cards for Crypto</h1>
            <p className="mt-1 text-sm text-muted-foreground">Convert unused gift cards to portfolio balance at our standard payout rate.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 glass-card rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground"><Gift size={18} className="text-accent" /> New exchange</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Gift card brand</label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>{b.label} — {b.payout}% payout</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Card face value (USD)</label>
                    <Input type="number" step="0.01" value={cardValue} onChange={(e) => setCardValue(e.target.value)} placeholder="100.00" />
                  </div>
                  <div className="rounded-xl border border-border/30 bg-secondary/30 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">You receive</p>
                    <p className="font-display text-xl font-bold text-vault-very-low">{formatUSD(payout)}</p>
                    <p className="text-[10px] text-muted-foreground">{selected.payout}% of {formatUSD(value)}</p>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Card code / redemption number</label>
                  <Input value={cardCode} onChange={(e) => setCardCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Photo of card (optional)</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold" />
                </div>
                <Button onClick={submit} disabled={submitting} className="w-full">
                  {submitting ? <><Loader2 size={14} className="mr-2 animate-spin" /> Submitting...</> : <><Upload size={14} className="mr-2" /> Submit for verification</>}
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="mb-3 font-display text-base font-semibold text-foreground">Payout rates</h3>
              <div className="space-y-2">
                {BRANDS.map((b) => (
                  <div key={b.value} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{b.label}</span>
                    <span className="font-semibold text-vault-very-low">{b.payout}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 glass-card rounded-2xl p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Your exchanges</h3>
            {history.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No exchanges yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.brand} — {formatUSD(Number(h.card_value))}</p>
                      <p className="text-[11px] text-muted-foreground">→ {formatUSD(Number(h.payout_amount))} ({h.payout_pct}%) · {new Date(h.created_at).toLocaleString()}</p>
                      {h.admin_notes && <p className="mt-1 text-[11px] italic text-muted-foreground">"{h.admin_notes}"</p>}
                    </div>
                    {badge(h.status)}
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

export default GiftCards;
