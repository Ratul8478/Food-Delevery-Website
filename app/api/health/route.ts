import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const checks: Record<string, any> = {};
  let status: "healthy" | "degraded" | "down" = "healthy";

  // 1. Supabase check
  try {
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    if (isMock) {
      checks.supabase = { status: "healthy", mode: "mock" };
    } else {
      const supabase = createSupabaseServer();
      // Simple SELECT 1 query via profiles count or select to verify DB connection
      const { error: dbError } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
      if (dbError) {
        throw dbError;
      }
      checks.supabase = { status: "healthy", mode: "supabase" };
    }
  } catch (err: any) {
    checks.supabase = { status: "unhealthy", error: err.message };
    status = "down";
  }

  // 2. Stripe API Reachable with 3s timeout
  try {
    const stripeCheck = stripe.balance.retrieve();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Stripe connectivity test timed out (3000ms)")), 3000)
    );
    await Promise.race([stripeCheck, timeoutPromise]);
    checks.stripe = { status: "healthy" };
  } catch (err: any) {
    checks.stripe = { status: "unhealthy", error: err.message };
    // Degraded, because Stripe offline shouldn't bring down the main customer site completely
    if (status !== "down") {
      status = "degraded";
    }
  }

  // 3. Env variables check
  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "RESEND_API_KEY",
  ];
  const missingEnv = requiredEnv.filter(
    (key) => !process.env[key] || process.env[key]?.includes("placeholder")
  );
  checks.env = {
    status: missingEnv.length === 0 ? "healthy" : "degraded",
    missing: missingEnv,
  };
  if (missingEnv.length > 0 && status !== "down") {
    status = "degraded";
  }

  return NextResponse.json(
    {
      status,
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: status === "down" ? 503 : 200,
    }
  );
}
