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
      // Delete old unused registration OTPs for this phone
      await supabaseAdmin
        .from("phone_otps")
        .delete()
        .eq("phone", phone)
        .eq("is_used", false)
        .eq("purpose", "registration");

      // Insert into phone_otps table
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
        return NextResponse.json({ error: "Failed to persist WhatsApp OTP" }, { status: 500 });
      }
    } else {
      // Store in local cache for mock validation
      otpStore.setPhoneOtp(phone, otp);
    }

    // 3. Dispatch WhatsApp message via Twilio or fallback channels
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const ntfyTopic = process.env.NTFY_TOPIC;

    let sentVia = "terminal";

    if (accountSid && authToken && !accountSid.includes("placeholder") && !accountSid.includes("your_twilio")) {
      try {
        const client = twilio(accountSid, authToken);
        // Sandbox sender number for Twilio is whatsapp:+14155238886
        await client.messages.create({
          body: `Your Rasoi House Verification Code is ${otp}. Valid for 10 minutes.`,
          from: "whatsapp:+14155238886",
          to: `whatsapp:+91${phone}`,
        });
        sentVia = "twilio_whatsapp";
      } catch (err: any) {
        console.error("[TWILIO WHATSAPP ERROR] Failed to send WhatsApp message:", err.message);
      }
    }

    if (ntfyTopic && !ntfyTopic.includes("placeholder") && ntfyTopic !== "rasoi-house-otp-test-ratul") {
      try {
        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: "POST",
          body: `[Rasoi House WhatsApp] Your Phone Verification OTP is ${otp}. Valid for 10 minutes.`,
          headers: {
            "Title": "Rasoi House WhatsApp OTP",
            "Priority": "high",
            "Tags": "key,phone,whatsapp",
          },
        });
        sentVia = sentVia === "twilio_whatsapp" ? "twilio_whatsapp + ntfy" : "ntfy";
      } catch (err: any) {
        console.error("[NTFY ERROR] Failed to send push notification:", err.message);
      }
    }

    if (sentVia === "terminal") {
      console.log("\n========================================");
      console.log(`[AUTH DEMO] WHATSAPP OTP FOR: +91 ${phone}`);
      console.log(`CODE: ${otp}`);
      console.log("========================================\n");
    } else {
      console.log(`[AUTH] WHATSAPP OTP sent via ${sentVia} to +91 ${phone}`);
    }

    return NextResponse.json({
      success: true,
      message: `WhatsApp OTP sent successfully (${sentVia})`,
      // Return code in response only for mock mode to make testing easier
      otp: isMock ? otp : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
