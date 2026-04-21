import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import vaultxLogo from '@/assets/vaultx-logo.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the hash. Listen for the
    // PASSWORD_RECOVERY event so we know we're in a valid recovery session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    // Also check immediately — by the time we mount, the session may exist.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 6) { toast.error('Password too short', { description: 'Use at least 6 characters.' }); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { toast.error('Could not update password', { description: error.message }); return; }
    toast.success('Password updated', { description: 'You are signed in.' });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card w-full max-w-md rounded-3xl p-8"
        >
          <Link to="/" className="mb-6 flex items-center gap-2.5">
            <img src={vaultxLogo} alt="VaultX" className="h-10 w-10 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]" width={40} height={40} />
            <span className="font-display text-xl font-bold text-foreground">VaultX</span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-foreground">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready ? 'Choose a strong password you don\'t use anywhere else.' : 'Verifying your reset link...'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-9"
                autoComplete="new-password"
                disabled={!ready}
              />
            </div>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="pl-9"
                autoComplete="new-password"
                disabled={!ready}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !ready}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-60 glow-blue"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Update password
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <Link to="/auth" className="block text-center text-xs text-muted-foreground hover:text-foreground">
              Back to sign in
            </Link>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
