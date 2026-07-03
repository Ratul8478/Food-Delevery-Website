import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import bcrypt from "bcryptjs";
import { otpStore } from "@/utils/otpStore";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      // 1. Fetch valid unused OTP
      const { data: record, error } = await supabaseAdmin
        .from("phone_otps")
        .select("*")
        .eq("phone", phone)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !record) {
        return NextResponse.json({ error: "Invalid OTP or code expired. Please resend." }, { status: 400 });
      }

      // 2. Check and increment attempts
      const newAttempts = record.attempts + 1;
      if (newAttempts > 3) {
        return NextResponse.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
      }

      // Update attempts in DB
      await supabaseAdmin
        .from("phone_otps")
        .update({ attempts: newAttempts })
        .eq("id", record.id);

      // 3. Compare hashed OTP
      const isMatch = await bcrypt.compare(otp, record.otp_hash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
      }

      // 4. Mark OTP as used
      await supabaseAdmin
        .from("phone_otps")
        .update({ is_used: true })
        .eq("id", record.id);

    } else {
      // Mock mode logic — accept deterministic "123456" as universal bypass
      // for serverless environments where in-memory otpStore may be lost
      const record = otpStore.getPhoneOtp(phone);

      if (record) {
        // otpStore has state — validate normally
        otpStore.incrementPhoneAttempts(phone);
        if (record.attempts >= 3) {
          return NextResponse.json({ error: "Too many attempts. Please request a new OTP." }, { status: 429 });
        }

        if (Date.now() > record.expiresAt) {
          otpStore.clearPhoneOtp(phone);
          return NextResponse.json({ error: "OTP expired, please resend" }, { status: 410 });
        }

        if (record.code !== otp) {
          return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
        }

        otpStore.clearPhoneOtp(phone);
      } else {
        // otpStore lost state (serverless cold start) — accept deterministic mock OTP
        if (otp !== "123456") {
          return NextResponse.json({ error: "Invalid OTP code. In demo mode use 123456." }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Phone verified successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
