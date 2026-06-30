import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async () => {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[EDGE FUNCTION EXPIRE POINTS] Missing environment configuration, skipping.");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // Query active points transactions that have expired
    const { data: expiredTxns, error: queryErr } = await supabase
      .from("points_transactions")
      .select("id, user_id, points, type")
      .lt("expires_at", now)
      .neq("type", "expired");

    if (queryErr) throw queryErr;

    if (expiredTxns && expiredTxns.length > 0) {
      console.log(`[EXPIRE POINTS CRON] Found ${expiredTxns.length} expired transactions.`);
      
      for (const txn of expiredTxns) {
        // Create a negative expiration adjustment transaction
        const { error: adjustErr } = await supabase
          .from("points_transactions")
          .insert({
            user_id: txn.user_id,
            points: -txn.points,
            type: "expired",
            description: `Deduction for expired points from txn #${txn.id}`,
          });

        if (adjustErr) throw adjustErr;

        // Fetch user's current points
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", txn.user_id)
          .single();

        if (profile) {
          const newPoints = Math.max(0, profile.total_points - txn.points);
          
          let newTier = "bronze";
          if (newPoints >= 2000) newTier = "diamond";
          else if (newPoints >= 1500) newTier = "platinum";
          else if (newPoints >= 1000) newTier = "gold";
          else if (newPoints >= 500) newTier = "silver";

          await supabase
            .from("profiles")
            .update({
              total_points: newPoints,
              discount_tier: newTier,
            })
            .eq("id", txn.user_id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, expired_count: expiredTxns?.length || 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
