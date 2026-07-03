import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import bcrypt from "bcryptjs";
import twilio from "twilio";
import { otpStore } from "@/utils/otpStore";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    // 1. Generate 6-digit OTP (deterministic in mock mode for serverless compatibility)
    const otp = isMock ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hash it
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    if (!isMock) {
      // 3. Delete old unused registration OTPs for this phone
      await supabaseAdmin
        .from("phone_otps")
        .delete()
        .eq("phone", phone)
        .eq("is_used", false)
        .eq("purpose", "registration");

      // 4. Insert into database
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin.from("phone_otps").insert({
        phone,
        otp_hash: otpHash,
        purpose: "registration",
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
      });

      if (error) {
        return NextResponse.json({ error: "Failed to persist OTP" }, { status: 500 });
      }
    } else {
      // Cache in memory for local demo validation
      otpStore.setPhoneOtp(phone, otp);
    }

    // 5. Send via Twilio SMS, ntfy.sh (free developer channel), or output to terminal
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const ntfyTopic = process.env.NTFY_TOPIC;

    let sentVia = "terminal";

    if (accountSid && authToken && fromNumber && !accountSid.includes("placeholder") && !accountSid.includes("your_twilio")) {
      try {
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: `[Rasoi House] Your OTP is ${otp}. Valid for 10 minutes. Do not share.`,
          from: fromNumber,
          to: `+91${phone}`,
        });
        sentVia = "twilio";
      } catch (err: any) {
        console.error("[TWILIO ERROR] Failed to send SMS:", err.message);
      }
    }

    if (ntfyTopic && !ntfyTopic.includes("placeholder") && ntfyTopic !== "rasoi-house-otp") {
      try {
        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: "POST",
          body: `[Rasoi House] Your Phone Verification OTP is ${otp}. Valid for 10 minutes.`,
          headers: {
            "Title": "Rasoi House Phone OTP",
            "Priority": "high",
            "Tags": "key,phone",
          },
        });
        sentVia = sentVia === "twilio" ? "twilio + ntfy" : "ntfy";
      } catch (err: any) {
        console.error("[NTFY ERROR] Failed to send push notification:", err.message);
      }
    }

    if (sentVia === "terminal") {
      // Offline fallback: print clearly in terminal
      console.log("\n========================================");
      console.log(`[AUTH DEMO] PHONE OTP FOR: +91 ${phone}`);
      console.log(`CODE: ${otp}`);
      console.log("========================================\n");
    } else {
      console.log(`[AUTH] PHONE OTP sent via ${sentVia} to +91 ${phone}`);
    }

    // In mock mode, return the OTP in the response so the frontend can auto-fill
    return NextResponse.json({
      success: true,
      message: `OTP sent successfully (${sentVia})`,
      ...(isMock ? { otp } : {}),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
