import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, phone, referral_code } = await request.json();

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      // 1. Check if email is already taken
      const { data: emailProfile, error: emailErr } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (emailProfile) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }

      // 2. Check if phone is already taken
      const { data: phoneProfile, error: phoneErr } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (phoneProfile) {
        return NextResponse.json({ error: "Mobile number already registered" }, { status: 400 });
      }

      // 3. Check if referral code is valid
      if (referral_code) {
        const { data: referrer, error: refErr } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("referral_code", referral_code)
          .maybeSingle();

        if (!referrer) {
          return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
        }
      }
    } else {
      // Mock mode for local execution
      if (email && email.toLowerCase().includes("taken")) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
      if (phone && phone.includes("9999")) {
        return NextResponse.json({ error: "Mobile number already registered" }, { status: 400 });
      }
      if (referral_code && referral_code !== "SPICE8Y2" && referral_code !== "SPICE123") {
        return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
