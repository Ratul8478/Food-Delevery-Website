import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { otpStore } from "@/utils/otpStore";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hash it
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      // 3. Delete old unused registration OTPs for this email
      await supabaseAdmin
        .from("email_otps")
        .delete()
        .eq("email", email)
        .eq("is_used", false)
        .eq("purpose", "registration");

      // 4. Insert into database
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      const { error } = await supabaseAdmin.from("email_otps").insert({
        email,
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
      // Cache in memory for local demo verification
      otpStore.setEmailOtp(email, otp);
    }

    // 5. Send via Resend, ntfy.sh (free developer channel), or output to terminal
    const resendApiKey = process.env.RESEND_API_KEY;
    const ntfyTopic = process.env.NTFY_TOPIC;

    let sentVia = "terminal";

    if (resendApiKey && !resendApiKey.includes("placeholder") && !resendApiKey.includes("your_resend")) {
      try {
        const resend = new Resend(resendApiKey);
        const emailHtml = `
          <div style="background-color: #1A0800; color: #FAF0DC; font-family: 'Poppins', sans-serif; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #3D2010;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #C4622D; font-family: 'Yeseva One', serif; margin: 0; font-size: 28px;">Rasoi House</h1>
              <p style="color: #B8A090; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Authentic Indian Kitchen</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #FAF0DC;">Namaste,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #FAF0DC;">Thank you for registering at Rasoi House. Please use the following 6-digit One-Time Password (OTP) to verify your email address:</p>
            <div style="text-align: center; margin: 40px 0;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: bold; color: #E8A020; letter-spacing: 6px; background-color: #2B1206; padding: 15px 30px; border-radius: 6px; border: 1px solid #3D2010;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 12px; color: #B8A090; line-height: 1.6;">This code is valid for 10 minutes. If you did not request this code, please ignore this email or contact support.</p>
            <div style="margin-top: 40px; border-top: 1px solid #3D2010; padding-top: 20px; text-align: center; font-size: 11px; color: #B8A090;">
              Rasoi House · 12, Kasturba Gandhi Marg, Connaught Place, New Delhi
            </div>
          </div>
        `;

        const { error } = await resend.emails.send({
          from: "Rasoi House <noreply@rasoihouse.com>",
          to: email,
          subject: "Your verification code — Rasoi House",
          html: emailHtml,
        });

        if (!error) {
          sentVia = "resend";
        } else {
          console.error("[RESEND ERROR] Failed to send email:", error);
        }
      } catch (err: any) {
        console.error("[RESEND ERROR] Failed to send email:", err.message);
      }
    }

    if (ntfyTopic && !ntfyTopic.includes("placeholder") && ntfyTopic !== "rasoi-house-otp") {
      try {
        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: "POST",
          body: `[Rasoi House] Your Email Verification OTP is ${otp}. Valid for 10 minutes.`,
          headers: {
            "Title": "Rasoi House Email OTP",
            "Priority": "high",
            "Tags": "key,email",
          },
        });
        sentVia = sentVia === "resend" ? "resend + ntfy" : "ntfy";
      } catch (err: any) {
        console.error("[NTFY ERROR] Failed to send push notification:", err.message);
      }
    }

    if (sentVia === "terminal") {
      // Offline fallback: print clearly in terminal
      console.log("\n========================================");
      console.log(`[AUTH DEMO] EMAIL OTP FOR: ${email}`);
      console.log(`CODE: ${otp}`);
      console.log("========================================\n");
    } else {
      console.log(`[AUTH] EMAIL OTP sent via ${sentVia} to ${email}`);
    }

    return NextResponse.json({ success: true, message: `OTP sent successfully (${sentVia})` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
