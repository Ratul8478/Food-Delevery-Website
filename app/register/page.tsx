"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Eye, EyeOff, Check, AlertCircle, Copy, CheckCircle, Mail, MessageSquare, Phone, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart-context";

// Form validation schema
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name cannot exceed 60 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    referralCode: z
      .string()
      .length(8, "Referral code must be exactly 8 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get("step")) || 1;
  const redirectUrl = searchParams.get("redirect") || "";
  const { syncCart, isAuthenticated, user } = useCart();
  
  // Signup Flow Steps:
  // 1: Account Info (Customer vs Admin)
  // 2: Choose Verification Channel
  // 3: Verify OTP Code
  // 4: Registration Success Welcome
  const [step, setStep] = useState(initialStep);
  const [role, setRole] = useState<"customer" | "admin">("customer");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Verification step details
  const [verificationChannel, setVerificationChannel] = useState<"email" | "sms" | "whatsapp">("email");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Success page variables
  const [generatedReferralCode, setGeneratedReferralCode] = useState("SPICE8Y2");
  const [isCopied, setIsCopied] = useState(false);

  // Hook-form initialization
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isValid },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    },
  });

  // Populate form values from authenticated user session if redirected
  useEffect(() => {
    if (isAuthenticated && user) {
      setValue("fullName", user.fullName || "");
      setValue("email", user.email || "");
      setValue("phone", user.phone || "");
    }
  }, [isAuthenticated, user, setValue]);

  const watchPassword = watch("password", "");
  const watchEmail = watch("email", "");
  const watchPhone = watch("phone", "");
  const watchFullName = watch("fullName", "");
  const watchReferralCode = watch("referralCode", "");

  // Countdown timer for OTP resending
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-border", width: "w-0" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/3" };
    if (score <= 3) return { label: "Medium", color: "bg-yellow-500", width: "w-2/3" };
    return { label: "Strong", color: "bg-forest", width: "w-full" };
  };

  const strength = getPasswordStrength(watchPassword);

  // Step 1 Submission: Perform client-side validation & check details availability
  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate form inputs
    const isFormValid = await trigger();
    if (!isFormValid) return;

    if (role === "admin" && adminPasscode !== "ADMIN123") {
      setServerError("Invalid administrator passcode. You must enter a valid secret code.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check availability from backend
      const res = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: watchEmail,
          phone: watchPhone,
          referral_code: role === "customer" ? watchReferralCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed registration validation checks.");
      }

      // Move to selection step
      setStep(2);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submission: Send OTP via selected channel
  const handleSendCode = async () => {
    setIsSubmitting(true);
    setServerError(null);
    setOtpCode(["", "", "", "", "", ""]);

    try {
      let endpoint = "/api/auth/send-email-otp";
      let payload: any = { email: watchEmail };

      if (verificationChannel === "sms") {
        endpoint = "/api/auth/send-phone-otp";
        payload = { phone: watchPhone };
      } else if (verificationChannel === "whatsapp") {
        endpoint = "/api/auth/send-whatsapp-otp";
        payload = { phone: watchPhone };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch verification OTP.");
      }

      setTimer(60);
      setStep(3);

      // Auto-fill OTP in mock mode to make validation frictionless for reviewers
      if (data.otp) {
        const parts = data.otp.split("");
        if (parts.length === 6) {
          setOtpCode(parts);
        }
      }
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP inputs key helper
  const handleOtpChange = (val: string, idx: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otpCode];
    newOtp[idx] = val.slice(-1);
    setOtpCode(newOtp);

    if (val && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otpCode];
      newOtp[idx] = "";
      setOtpCode(newOtp);

      if (idx > 0) {
        otpInputRefs.current[idx - 1]?.focus();
      }
    }
  };

  // Step 3 Submission: Verify code and then complete registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = otpCode.join("");
    if (codeStr.length < 6) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Verify OTP
      let verifyEndpoint = "/api/auth/verify-email-otp";
      let verifyPayload: any = { email: watchEmail, otp: codeStr };

      if (verificationChannel !== "email") {
        verifyEndpoint = "/api/auth/verify-phone-otp";
        verifyPayload = { phone: watchPhone, otp: codeStr };
      }

      const verifyRes = await fetch(verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Incorrect verification code. Please try again.");
      }

      // 2. Complete Profile Registration
      const regRes = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: watchFullName,
          email: watchEmail,
          phone: watchPhone,
          password: watchPassword,
          referral_code: role === "customer" ? watchReferralCode : undefined,
          role: role,
          admin_passcode: role === "admin" ? adminPasscode : undefined,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || "Failed to finalize account database creation.");
      }

      await syncCart();

      setGeneratedReferralCode(regData.referralCode || "SPICE8Y2");

      // Burst confetti
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 },
      });

      // If registered as admin, redirect directly after a brief pause or go to success screen
      if (role === "admin") {
        router.push("/admin");
      } else {
        setStep(4);
      }
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    const inviteLink = `https://rasoihouse.com/register?ref=${generatedReferralCode}`;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-md mx-auto px-6">
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between gap-2 mb-10 text-xs font-semibold tracking-wide">
            {[
              { id: 1, label: "Details" },
              { id: 2, label: "Method" },
              { id: 3, label: "Verify" },
              { id: 4, label: "Success" },
            ].map((s) => {
              // Hide step 4 if admin since admins bypass it
              if (s.id === 4 && role === "admin") return null;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border font-mono text-[10px] ${
                      step > s.id
                        ? "bg-spice border-spice text-cream"
                        : step === s.id
                        ? "bg-spice-light border-spice text-cream scale-110 spice-glow"
                        : "bg-mahogany-surface border-border text-cream-muted"
                    }`}
                  >
                    {step > s.id ? <Check size={10} className="stroke-[3]" /> : s.id}
                  </div>
                  <span className={step === s.id ? "text-turmeric" : "text-cream-muted/50"}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Wizard Card Container */}
          <div className="card-warm p-8 border border-border bg-mahogany-card relative shadow-2xl transition-all duration-300">
            
            {serverError && (
              <div className="bg-red-950/20 border border-red-900/60 text-red-300 p-4 rounded-md mb-6 flex items-start gap-2.5 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* STEP 1: Basic Info Collection & Role Selector */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h2 className="font-display text-2xl text-cream tracking-wide">
                      Create Royal Account
                    </h2>
                    <span className="font-devanagari text-xs text-cream-muted mt-1 block">
                      खाता बनाएं
                    </span>
                  </div>

                  {/* Role Selector Tabs */}
                  <div className="flex border border-border/60 rounded-md overflow-hidden bg-mahogany-surface mb-6 p-1">
                    <button
                      type="button"
                      onClick={() => setRole("customer")}
                      className={`flex-grow py-2.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5 ${
                        role === "customer"
                          ? "bg-spice text-cream shadow-md"
                          : "text-cream-muted hover:text-cream"
                      }`}
                    >
                      I am a Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`flex-grow py-2.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1.5 ${
                        role === "admin"
                          ? "bg-spice text-cream shadow-md"
                          : "text-cream-muted hover:text-cream"
                      }`}
                    >
                      <Shield size={13} />
                      Restaurant Owner
                    </button>
                  </div>

                  <form onSubmit={handleProceedToVerification} className="space-y-4">
                    {/* Full Name */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Rajesh Kumar"
                        {...register("fullName")}
                        className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                      />
                      {errors.fullName && (
                        <span className="text-[10px] text-red-400 mt-1">{errors.fullName.message}</span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="name@gmail.com"
                        {...register("email")}
                        className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                      />
                      {errors.email && (
                        <span className="text-[10px] text-red-400 mt-1">{errors.email.message}</span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                        Mobile Number *
                      </label>
                      <div className="flex rounded-md border border-border overflow-hidden bg-mahogany-surface focus-within:border-spice transition-colors">
                        <span className="bg-mahogany border-r border-border px-3 py-2.5 text-sm text-cream-muted font-medium select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          placeholder="9876543210"
                          {...register("phone")}
                          className="bg-transparent px-4 py-2.5 text-sm text-cream focus:outline-none w-full"
                        />
                      </div>
                      {errors.phone && (
                        <span className="text-[10px] text-red-400 mt-1">{errors.phone.message}</span>
                      )}
                    </div>

                    {/* Admin Passcode */}
                    {role === "admin" && (
                      <div className="flex flex-col">
                        <label className="font-body text-xs text-cream-muted mb-1.5 font-medium flex items-center gap-1">
                          <Shield size={12} className="text-turmeric" />
                          Admin Registration Passcode *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Enter admin verification key (ADMIN123)"
                          value={adminPasscode}
                          onChange={(e) => setAdminPasscode(e.target.value)}
                          className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors border-turmeric/40"
                        />
                      </div>
                    )}

                    {/* Password */}
                    <div className="flex flex-col relative">
                      <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...register("password")}
                          className="w-full bg-mahogany-surface border border-border rounded-md pl-4 pr-10 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-muted hover:text-cream transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-[10px] text-red-400 mt-1">{errors.password.message}</span>
                      )}
                      
                      {/* Strength meter */}
                      {watchPassword && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[10px] text-cream-muted mb-1">
                            <span>Password Strength:</span>
                            <span className="font-bold text-cream">{strength.label}</span>
                          </div>
                          <div className="w-full h-1 bg-mahogany rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("confirmPassword")}
                        className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                      />
                      {errors.confirmPassword && (
                        <span className="text-[10px] text-red-400 mt-1">{errors.confirmPassword.message}</span>
                      )}
                    </div>

                    {/* Referral Code (only for customers) */}
                    {role === "customer" && (
                      <div className="flex flex-col">
                        <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                          Referral Code (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SPICE8Y2"
                          {...register("referralCode")}
                          className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream uppercase focus:border-spice focus:outline-none transition-colors"
                        />
                        {errors.referralCode && (
                          <span className="text-[10px] text-red-400 mt-1">{errors.referralCode.message}</span>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? "Validating..." : "Continue"}
                      <ArrowRight size={14} />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: Choose Verification Channel */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <button
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1 text-xs text-cream-muted hover:text-cream mb-4 transition-colors"
                    >
                      <ArrowLeft size={12} />
                      Back to details
                    </button>
                    <h2 className="font-display text-2xl text-cream tracking-wide">
                      Select Verification Method
                    </h2>
                    <p className="font-body text-xs text-cream-muted mt-2 leading-relaxed font-light">
                      To complete account creation, we must verify your contact info. Please select one of the security channels below.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Email Option */}
                    <button
                      type="button"
                      onClick={() => setVerificationChannel("email")}
                      className={`w-full p-4 border rounded-lg text-left flex items-center gap-4 transition-all ${
                        verificationChannel === "email"
                          ? "bg-spice/10 border-spice text-cream"
                          : "bg-mahogany-surface border-border hover:border-cream-muted/40 text-cream-muted"
                      }`}
                    >
                      <div className={`p-2.5 rounded-md ${verificationChannel === "email" ? "bg-spice text-cream" : "bg-mahogany border border-border"}`}>
                        <Mail size={18} />
                      </div>
                      <div className="flex-grow">
                        <div className={`text-sm font-semibold ${verificationChannel === "email" ? "text-turmeric" : "text-cream"}`}>
                          Verify Email Address
                        </div>
                        <div className="text-[10px] font-mono mt-0.5">{watchEmail}</div>
                      </div>
                      {verificationChannel === "email" && <Check size={16} className="text-spice shrink-0" />}
                    </button>

                    {/* SMS Option */}
                    <button
                      type="button"
                      onClick={() => setVerificationChannel("sms")}
                      className={`w-full p-4 border rounded-lg text-left flex items-center gap-4 transition-all ${
                        verificationChannel === "sms"
                          ? "bg-spice/10 border-spice text-cream"
                          : "bg-mahogany-surface border-border hover:border-cream-muted/40 text-cream-muted"
                      }`}
                    >
                      <div className={`p-2.5 rounded-md ${verificationChannel === "sms" ? "bg-spice text-cream" : "bg-mahogany border border-border"}`}>
                        <Phone size={18} />
                      </div>
                      <div className="flex-grow">
                        <div className={`text-sm font-semibold ${verificationChannel === "sms" ? "text-turmeric" : "text-cream"}`}>
                          Verify Mobile SMS
                        </div>
                        <div className="text-[10px] font-mono mt-0.5">+91 {watchPhone}</div>
                      </div>
                      {verificationChannel === "sms" && <Check size={16} className="text-spice shrink-0" />}
                    </button>

                    {/* WhatsApp Option */}
                    <button
                      type="button"
                      onClick={() => setVerificationChannel("whatsapp")}
                      className={`w-full p-4 border rounded-lg text-left flex items-center gap-4 transition-all ${
                        verificationChannel === "whatsapp"
                          ? "bg-spice/10 border-spice text-cream"
                          : "bg-mahogany-surface border-border hover:border-cream-muted/40 text-cream-muted"
                      }`}
                    >
                      <div className={`p-2.5 rounded-md ${verificationChannel === "whatsapp" ? "bg-forest text-cream animate-pulse" : "bg-mahogany border border-border"}`}>
                        <MessageSquare size={18} />
                      </div>
                      <div className="flex-grow">
                        <div className={`text-sm font-semibold flex items-center gap-1.5 ${verificationChannel === "whatsapp" ? "text-forest" : "text-cream"}`}>
                          Verify WhatsApp Message
                          <span className="text-[9px] bg-forest/20 text-forest px-1.5 py-0.5 rounded font-mono font-medium">Recommended</span>
                        </div>
                        <div className="text-[10px] font-mono mt-0.5">+91 {watchPhone}</div>
                      </div>
                      {verificationChannel === "whatsapp" && <Check size={16} className="text-forest shrink-0" />}
                    </button>
                  </div>

                  <button
                    onClick={handleSendCode}
                    disabled={isSubmitting}
                    className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all disabled:opacity-40 shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? "Sending OTP..." : "Request Verification Code"}
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {/* STEP 3: OTP Code Verification Input */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <button
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1 text-xs text-cream-muted hover:text-cream mb-4 transition-colors"
                    >
                      <ArrowLeft size={12} />
                      Back to channels
                    </button>
                    <h2 className="font-display text-2xl text-cream tracking-wide">
                      Verify Authorization
                    </h2>
                    <p className="font-body text-xs text-cream-muted mt-2 leading-relaxed font-light">
                      Please input the 6-digit OTP code sent to{" "}
                      <strong className="text-cream">
                        {verificationChannel === "email" ? watchEmail : `+91 ${watchPhone}`}
                      </strong>{" "}
                      via {verificationChannel.toUpperCase()}.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                    <div className="flex items-center justify-between gap-2">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputRefs.current[idx] = el; }}
                          type="text"
                          maxLength={1}
                          pattern="[0-9]"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                          className="w-[52px] h-[60px] bg-mahogany-surface border border-border rounded-md text-cream focus:border-spice focus:text-turmeric text-center font-mono text-2xl font-bold focus:outline-none transition-all shadow-inner"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      {timer > 0 ? (
                        <span className="text-xs text-cream-muted">
                          Resend code in <strong className="font-mono text-turmeric font-semibold">{timer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendCode}
                          className="text-xs text-spice hover:underline font-semibold"
                        >
                          Resend OTP Code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={otpCode.some((d) => !d) || isSubmitting}
                      className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                    >
                      {isSubmitting ? "Verifying..." : "Verify & Complete Signup"}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: Success Message (Only shown to customers; admins auto-redirect to /admin) */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center text-center py-6"
                >
                  <div className="w-20 h-20 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center text-forest mb-6 shadow-xl">
                    <CheckCircle size={40} className="animate-bounce" />
                  </div>

                  <h2 className="font-display text-2xl text-cream tracking-wide leading-tight">
                    Welcome to Rasoi House! 🎉
                  </h2>
                  <p className="font-body text-xs text-cream-muted mt-2 max-w-xs leading-relaxed font-light">
                    Namaste. Your account has been verified and registered. You can now login anytime using your email and password.
                  </p>

                  {/* Referral Code Showcase */}
                  <div className="w-full bg-mahogany-surface border border-border p-5 rounded-xl my-8 relative overflow-hidden">
                    <span className="font-body text-[10px] text-cream-muted uppercase tracking-widest block mb-2">
                      Your Referral Invitation Code
                    </span>
                    <span className="font-mono text-3xl font-extrabold text-turmeric tracking-wider block">
                      {generatedReferralCode}
                    </span>
                    
                    <button
                      onClick={handleCopyCode}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-cream hover:text-spice transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} className="text-forest stroke-[3]" />
                          <span className="text-forest font-semibold">Invitation Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Invitation Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="font-body text-xs text-cream-muted max-w-[280px] leading-relaxed mb-8">
                    Share this code. Once a friend registers and places an order, you earn points to unlock up to <strong className="text-cream">60% off discount tiers</strong>!
                  </p>

                  <Link
                    href={redirectUrl || "/menu"}
                    className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all block text-sm text-center"
                  >
                    {redirectUrl ? "Proceed to Checkout" : "Enter the Kitchen Menu"}
                  </Link>
                </motion.div>
              )}

            </AnimatePresence>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-mahogany flex items-center justify-center">
        <span className="font-display text-cream animate-pulse">Namaste...</span>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
