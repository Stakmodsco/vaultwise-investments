import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { ShieldCheck, Loader2, KeyRound, Copy, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Security = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_2fa').select('secret, enabled').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setEnabled(!!data?.enabled);
      if (data?.secret) setSecret(data.secret);
    });
  }, [user]);

  const startEnroll = async () => {
    if (!user) return;
    const newSecret = new OTPAuth.Secret({ size: 20 }).base32;
    setSecret(newSecret);
    const totp = new OTPAuth.TOTP({
      issuer: 'VaultX',
      label: user.email ?? 'user',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(newSecret),
    });
    const uri = totp.toString();
    const qr = await QRCode.toDataURL(uri);
    setQrUrl(qr);
    // Store unconfirmed secret
    await supabase.from('user_2fa').upsert({ user_id: user.id, secret: newSecret, enabled: false }, { onConflict: 'user_id' });
  };

  const verifyAndEnable = async () => {
    if (!user || !secret) return;
    setVerifying(true);
    const totp = new OTPAuth.TOTP({
      issuer: 'VaultX',
      label: user.email ?? 'user',
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code.trim(), window: 1 });
    if (delta === null) {
      setVerifying(false);
      toast.error('Invalid code', { description: 'Make sure your phone time is synced.' });
      return;
    }
    const { error } = await supabase.from('user_2fa').update({ enabled: true }).eq('user_id', user.id);
    setVerifying(false);
    if (error) { toast.error('Could not enable 2FA'); return; }
    setEnabled(true);
    setQrUrl(null);
    setCode('');
    toast.success('2FA enabled', { description: 'You will be asked for a code on next login.' });
  };

  const disable = async () => {
    if (!user) return;
    const { error } = await supabase.from('user_2fa').update({ enabled: false }).eq('user_id', user.id);
    if (error) { toast.error('Could not disable 2FA'); return; }
    setEnabled(false);
    setSecret(null);
    setQrUrl(null);
    toast.success('2FA disabled');
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-6 pt-[88px] pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Security</h1>
            <p className="mt-1 text-sm text-muted-foreground">Protect your account with two-factor authentication.</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${enabled ? 'bg-vault-very-low/20 text-vault-very-low' : 'bg-secondary text-muted-foreground'}`}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Authenticator app (TOTP)</h3>
                <p className="text-xs text-muted-foreground">
                  {enabled ? '✓ Active' : 'Use Google Authenticator, Authy, 1Password, or any TOTP app.'}
                </p>
              </div>
            </div>

            {enabled === null && <Loader2 size={16} className="animate-spin text-muted-foreground" />}

            {enabled === false && !qrUrl && (
              <Button onClick={startEnroll}><KeyRound size={14} className="mr-2" /> Set up 2FA</Button>
            )}

            {enabled === false && qrUrl && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-6">
                  <p className="text-xs text-muted-foreground">Scan this with your authenticator app</p>
                  <img src={qrUrl} alt="2FA QR code" className="h-48 w-48" />
                  {secret && (
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-secondary px-2 py-1 font-mono text-[11px]">{secret}</code>
                      <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(secret); toast.success('Secret copied'); }}>
                        <Copy size={12} />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Enter the 6-digit code from your app</label>
                  <div className="flex gap-2">
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} inputMode="numeric" />
                    <Button onClick={verifyAndEnable} disabled={verifying || code.length !== 6}>
                      {verifying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {enabled === true && (
              <Button variant="outline" onClick={disable}>Disable 2FA</Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Security;
