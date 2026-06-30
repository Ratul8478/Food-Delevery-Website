import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const { method, email, password, phone } = await request.json();

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let sessionData = null;

    if (method === "password") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      if (!isMock) {
        // Supabase sign-in
        const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (authErr || !authData.user) {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
        }

        // Fetch profile
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        sessionData = {
          userId: authData.user.id,
          fullName: profile?.full_name || "Guest User",
          email: authData.user.email,
          phone: profile?.phone || "",
          verified: profile?.email_verified && profile?.phone_verified,
          role: profile?.role || "customer",
          referralCode: profile?.referral_code || "",
        };
      } else {
        // Mock sign-in
        if (password !== "Password@123") {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
        }

        sessionData = {
          userId: "usr_mock_123",
          fullName: "Rajesh Kumar",
          email: email,
          phone: "9876543210",
          verified: true,
          role: "customer",
          referralCode: "SPICE8Y2",
        };
      }
    } else if (method === "otp") {
      if (!phone) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }

      // Note: Mobile OTP verification is handled by verifying endpoint first,
      // but in login we can verify if the user exists and complete session set up
      if (!isMock) {
        const { data: profile, error } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("phone", phone)
          .maybeSingle();

        if (error || !profile) {
          return NextResponse.json({ error: "Mobile number not registered" }, { status: 400 });
        }

        sessionData = {
          userId: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          verified: profile.email_verified && profile.phone_verified,
          role: profile.role,
          referralCode: profile.referral_code,
        };
      } else {
        // Mock phone check
        if (phone === "9999999999") {
          return NextResponse.json({ error: "Mobile number not registered" }, { status: 400 });
        }

        sessionData = {
          userId: "usr_mock_123",
          fullName: "Rajesh Kumar",
          email: "rajesh.kumar@gmail.com",
          phone: phone,
          verified: true,
          role: "customer",
          referralCode: "SPICE8Y2",
        };
      }
    } else {
      return NextResponse.json({ error: "Invalid authentication method" }, { status: 400 });
    }

    // Set session cookie
    cookies().set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true, user: sessionData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
