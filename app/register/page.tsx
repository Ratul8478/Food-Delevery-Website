"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Eye, EyeOff, Check, AlertCircle, Copy, CheckCircle } from "lucide-react";

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

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Steps: 1, 2, 3, 4
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Success step states
  const [generatedReferralCode, setGeneratedReferralCode] = useState("SPICE8Y2");
  const [isCopied, setIsCopied] = useState(false);

  // Hook-form initialization
  const {
    register,
    handleSubmit,
    watch,
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

  const watchPassword = watch("password", "");
  const watchEmail = watch("email", "");
  const watchPhone = watch("phone", "");
  const watchFullName = watch("fullName", "");
  const watchReferralCode = watch("referralCode", "");

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



  // Submit step 1: Check availability & complete registration directly
  const onSubmitStep1 = async (data: RegisterInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Check email / phone availability
      const availRes = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          referral_code: data.referralCode,
        }),
      });

      const availData = await availRes.json();
      if (!availRes.ok) {
        throw new Error(availData.error || "Failed to check availability");
      }

      // 2. Complete registration profile creation directly
      const regRes = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
          referral_code: data.referralCode,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || "Failed to create customer profile");
      }

      // Set user code
      setGeneratedReferralCode(regData.referralCode || "SPICE8Y2");

      // Confetti burst
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      setStep(4);
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
          
          {/* Step wizard indicator */}
          <div className="flex items-center justify-between gap-2 mb-10 text-xs font-semibold tracking-wide">
            {[
              { id: 1, label: "Info" },
              { id: 4, label: "Welcome" },
            ].map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border font-mono text-[10px] ${
                    step > s.id
                      ? "bg-spice border-spice text-cream"
                      : step === s.id
                      ? "bg-spice-light border-spice text-cream scale-115 spice-glow"
                      : "bg-mahogany-surface border-border text-cream-muted"
                  }`}
                >
                  {step > s.id ? <Check size={10} className="stroke-[3]" /> : s.id === 4 ? 2 : s.id}
                </div>
                <span className={step === s.id ? "text-turmeric" : "text-cream-muted/60"}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Form Container */}
          <div className="card-warm p-8 border border-border bg-mahogany-card relative shadow-2xl transition-all duration-300 focus-within:spice-glow">
            
            {serverError && (
              <div className="bg-red-950/20 border border-red-900/60 text-red-300 p-4 rounded-md mb-6 flex items-start gap-2.5 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* STEP 1: Basic Info Collection */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -60, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h2 className="font-display text-2xl text-cream tracking-wide">
                      Create Royal Account
                    </h2>
                    <span className="font-devanagari text-xs text-cream-muted mt-1 block">
                      पंजीकरण करें
                    </span>
                  </div>

                  <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-4">
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

                    {/* Phone (+91) */}
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
                      
                      {/* Password strength meter */}
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

                    {/* Referral Code */}
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

                    <button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                    >
                      {isSubmitting ? "Checking..." : "Continue"}
                    </button>
                  </form>
                </motion.div>
              )}



              {/* STEP 4: Welcome / Account Created */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center text-center py-6"
                >
                  {/* Checkmark draw animation */}
                  <div className="w-20 h-20 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center text-forest mb-6 shadow-xl">
                    <CheckCircle size={40} className="animate-bounce" />
                  </div>

                  <h2 className="font-display text-2xl text-cream tracking-wide leading-tight">
                    Welcome to Rasoi House! 🎉
                  </h2>
                  <p className="font-body text-xs text-cream-muted mt-2 max-w-xs leading-relaxed font-light">
                    Namaste. Your dual-verification succeeded and your royal profile is fully configured.
                  </p>

                  {/* Referral Code showcase card */}
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
                    Share your link. Once a friend registers and orders, you unlock <strong className="text-cream">20% to 60% discounts</strong> on your meals!
                  </p>

                  <Link
                    href="/menu"
                    className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all block text-sm"
                  >
                    Enter the Kitchen Menu
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
