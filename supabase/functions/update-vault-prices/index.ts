// Edge Function: update-vault-prices
// Runs every minute (via pg_cron). Updates vault_prices and inserts
// notifications for every user when a vault moves > ±2% in a tick.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VaultSeed {
  id: string;
  name: string;
  startPrice: number;
  vol: number;
}

const SEEDS: VaultSeed[] = [
  { id: "bluechip-growth", name: "BlueChip Growth", startPrice: 1.124, vol: 0.008 },
  { id: "alpha-aggressive", name: "Alpha Aggressive", startPrice: 1.347, vol: 0.025 },
  { id: "stable-yield", name: "Stable Yield", startPrice: 1.052, vol: 0.004 },
  { id: "momentum-trader", name: "Momentum Trader", startPrice: 1.218, vol: 0.015 },
];

const PRICE_THRESHOLD = 0.02; // ±2%

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Load current prices
    const { data: existing } = await supabase
      .from("vault_prices")
      .select("vault_id, unit_price");

    const current = new Map<string, number>();
    for (const row of existing ?? []) {
      current.set(row.vault_id, Number(row.unit_price));
    }

    // 2. Compute next prices
    const updates: { id: string; name: string; prev: number; next: number; change: number }[] = [];
    for (const seed of SEEDS) {
      const prev = current.get(seed.id) ?? seed.startPrice;
      const drift = 0.0005;
      const change = (Math.random() - 0.5) * 2 * seed.vol + drift;
      const next = Math.max(0.01, prev * (1 + change));
      const pct = (next - prev) / prev;
      updates.push({ id: seed.id, name: seed.name, prev, next, change: pct });
    }

    // 3. Persist
    await supabase.from("vault_prices").upsert(
      updates.map((u) => ({
        vault_id: u.id,
        unit_price: u.next,
        previous_price: u.prev,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "vault_id" },
    );

    // 4. Broadcast notifications for any vault that moved > ±2%
    const big = updates.filter((u) => Math.abs(u.change) >= PRICE_THRESHOLD);
    let notificationsInserted = 0;

    if (big.length > 0) {
      // Get every user who has email_alerts OR push_alerts enabled
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("user_id, push_alerts");

      const targets = (prefs ?? []).filter((p) => p.push_alerts).map((p) => p.user_id);

      if (targets.length > 0) {
        const rows = targets.flatMap((uid) =>
          big.map((u) => {
            const positive = u.change > 0;
            const pct = (u.change * 100).toFixed(2);
            return {
              user_id: uid,
              title: `${u.name} ${positive ? "surged" : "dipped"} ${positive ? "+" : ""}${pct}%`,
              description: positive
                ? "Strong upward move detected this tick."
                : "Sharp downward move detected this tick.",
              variant: positive ? "leaf" : "ember",
              vault_id: u.id,
              vault_name: u.name,
              change_pct: u.change * 100,
            };
          }),
        );

        const { error: notifErr } = await supabase.from("notifications").insert(rows);
        if (!notifErr) notificationsInserted = rows.length;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updated: updates.length,
        bigMoves: big.length,
        notificationsInserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("update-vault-prices error", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
