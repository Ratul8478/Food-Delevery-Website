import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async () => {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[EDGE FUNCTION EXPIRE OTPS] Missing environment configuration, skipping deletion.");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // 1. Expire email OTPs
    const { error: emailErr } = await supabase
      .from("email_otps")
      .delete()
      .lt("expires_at", now)
      .eq("is_used", false);

    if (emailErr) throw emailErr;

    // 2. Expire phone OTPs
    const { error: phoneErr } = await supabase
      .from("phone_otps")
      .delete()
      .lt("expires_at", now)
      .eq("is_used", false);

    if (phoneErr) throw phoneErr;

    console.log(`[EXPIRE OTPS CRON] Expired OTPs cleared successfully at ${now}`);

    return new Response(JSON.stringify({ success: true, message: "Expired OTPs cleared" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
