import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import vaultxLogo from '@/assets/vaultx-logo.png';

const Auth = () => {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) toast.error('Sign-in failed', { description: error });
        else { toast.success('Welcome back'); navigate('/dashboard'); }
      } else {
        const { error } = await signUp(email, password, displayName || undefined);
        if (error) toast.error('Sign-up failed', { description: error });
        else { toast.success('Account created', { description: 'You\'re signed in.' }); navigate('/dashboard'); }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      toast.error('Google sign-in failed', { description: result.error instanceof Error ? result.error.message : String(result.error) });
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return; // browser will navigate
    // Tokens received - session is already set by lovable wrapper
    toast.success('Signed in with Google');
    navigate('/dashboard', { replace: true });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingReset || !forgotEmail) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) toast.error('Could not send reset email', { description: error.message });
    else {
      toast.success('Reset email sent', { description: 'Check your inbox for the link.' });
      setForgotOpen(false);
      setForgotEmail('');
    }
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

          <h1 className="font-display text-2xl font-bold text-foreground">
            {forgotOpen ? 'Reset your password' : mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forgotOpen
              ? 'We\'ll email you a link to set a new password.'
              : mode === 'signin' ? 'Sign in to access your vaults.' : 'Start with $10,000 in simulated capital.'}
          </p>

          {forgotOpen ? (
            <form onSubmit={handleForgot} className="mt-6 space-y-4">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@vaultx.app"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={sendingReset}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-60 glow-blue"
              >
                {sendingReset ? <Loader2 size={16} className="animate-spin" /> : 'Send reset link'}
              </button>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')} className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              {/* Google sign-in */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-secondary/40 px-6 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-secondary disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12s4.2 9.3 9.3 9.3c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.6H12z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-card px-3 text-muted-foreground">or with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {mode === 'signup' && (
                  <div className="relative">
                    <UserIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Display name (optional)"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@vaultx.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-9"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                </div>

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setForgotOpen(true); setForgotEmail(email); }}
                    className="block text-right text-xs text-muted-foreground hover:text-foreground w-full"
                  >
                    Forgot password?
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 disabled:opacity-60 glow-blue"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' ? 'Sign in' : 'Create account'}
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Demo platform · Returns are variable and based on market performance.
                </p>
              </form>
            </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
