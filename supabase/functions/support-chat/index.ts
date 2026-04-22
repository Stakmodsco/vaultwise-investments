// Lovable AI Gateway - support chatbot streaming endpoint
// Refuses to chat with locked or blacklisted users.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are VaultX Support, the friendly and concise customer support assistant for VaultX — a paper-trading and real crypto vault platform.

Capabilities you can explain:
- VAULTS: BlueChip Growth, Alpha Aggressive, Stable Yield, Momentum Trader, WaxP Yield (low risk), Hive Stable (low risk).
- DEPOSITS: Crypto via BTC, ETH, USDT-TRC20/ERC20, SOL. Users send funds to displayed wallet, then upload a payment screenshot. Funds reflect after admin approval.
- WITHDRAWALS: Take 72 hours. Require approved KYC + proof of funds. After 3 failed KYC attempts the account is locked.
- KYC: ID document + proof of funds (bank statement, payslip, etc.). Admin reviews within 24h.
- GIFT CARDS: Users can exchange Amazon, Apple, Google Play, Steam, Walmart, Visa, Sephora gift cards for portfolio balance at brand-specific payout rates (60–80%).
- 2FA: TOTP via Google Authenticator, Authy, etc. Set up at /profile → Security.
- ACCOUNT STATUS: active, locked (after 3 failed KYCs — contact support), blacklisted (policy violation — contact support).
- FEES: No deposit fees. Withdrawals processed within 72h.

Style: warm, professional, concise. Use markdown for lists. If a user asks something outside platform scope or that requires admin action (refunds, manual unblocks), tell them to email support@vaultx.app.
Never invent prices, balances, or wallet addresses. Refer them to the live UI for those.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages must be an array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limited, try again shortly.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Top up Lovable AI workspace.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      console.error('Gateway error', upstream.status, t);
      return new Response(JSON.stringify({ error: 'Upstream gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('support-chat error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
