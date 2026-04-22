import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Send, Bot, Loader2, Lock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useAccountStatus } from '@/lib/account-status-context';
import { Button } from '@/components/ui/button';

interface Msg { role: 'user' | 'assistant'; content: string; }

const Support = () => {
  const { user } = useAuth();
  const { isRestricted, status } = useAccountStatus();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm VaultX Support. Ask me anything about deposits, withdrawals, KYC, vaults, fees, or your account." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    if (!user) return;
    supabase.from('support_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data.filter((m) => m.role !== 'system') as Msg[]);
        }
      });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading || isRestricted) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    // Persist user message
    if (user) {
      supabase.from('support_messages').insert({ user_id: user.id, role: 'user', content: userMsg.content });
    }

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (resp.status === 429) { toast.error('Too many requests', { description: 'Please wait a moment.' }); setLoading(false); return; }
      if (resp.status === 402) { toast.error('AI credits exhausted', { description: 'Top up your Lovable AI workspace.' }); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error('Support is offline'); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantText += delta;
              if (!started) {
                started = true;
                setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
              } else {
                setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m));
              }
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Persist assistant response
      if (user && assistantText) {
        supabase.from('support_messages').insert({ user_id: user.id, role: 'assistant', content: assistantText });
      }
    } catch (e: any) {
      toast.error('Support chat error', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (isRestricted) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-6 pt-[120px]">
          <div className="glass-card max-w-md rounded-2xl p-8 text-center">
            <Lock size={48} className="mx-auto mb-4 text-destructive" />
            <h2 className="font-display text-xl font-bold text-foreground">Support chat unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is {status?.status}. Please email <a href="mailto:support@vaultx.app" className="text-accent underline">support@vaultx.app</a> directly to resolve this.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-6 pt-[88px] pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">VaultX Support</h1>
              <p className="text-xs text-muted-foreground">AI-powered. Available 24/7.</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4">
            <div ref={scrollRef} className="h-[60vh] space-y-4 overflow-y-auto px-2 py-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}>
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-secondary px-4 py-3">
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2 border-t border-border/40 pt-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about deposits, KYC, fees..."
                className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
              />
              <Button onClick={send} disabled={loading || !input.trim()}>
                <Send size={14} />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Support;
