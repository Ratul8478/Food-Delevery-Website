"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Eye, EyeOff, AlertCircle, KeyRound, Phone, Mail, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/menu";
  const { syncCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Email & Password states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password reset flow modal states
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Done
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState(["", "", "", "", "", ""]);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const resetOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Login via password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "password", email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      await syncCart();
      router.push(redirectUrl);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP inputs key helper for Password Reset Flow
  const handleOtpChange = (val: string, idx: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...resetOtp];
    newOtp[idx] = val.slice(-1);
    setResetOtp(newOtp);

    if (val && idx < 5) {
      resetOtpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...resetOtp];
      newOtp[idx] = "";
      setResetOtp(newOtp);

      if (idx > 0) {
        resetOtpInputRefs.current[idx - 1]?.focus();
      }
    }
  };

  // PASSWORD RESET HANDLERS
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!res.ok) throw new Error("Failed to send code");
      setResetStep(2);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = resetOtp.join("");
    if (otpCode.length < 6) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: otpCode }),
      });
      if (!res.ok) throw new Error("Invalid verification code");
      setResetStep(3);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNewPassword.length < 8) {
      setServerError("Password must be at least 8 characters");
      return;
    }
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Simulate password change success
      setResetStep(4);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-md mx-auto px-6">
          
          {/* Main card panel */}
          <div className="card-warm p-8 border border-border bg-mahogany-card shadow-2xl relative">
            
            {serverError && (
              <div className="bg-red-950/20 border border-red-900/60 text-red-300 p-4 rounded-md mb-6 flex items-start gap-2.5 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="font-display text-2xl text-cream tracking-wide">
                Log In
              </h2>
              <span className="font-devanagari text-xs text-cream-muted mt-1 block">
                लॉगिन करें
              </span>
            </div>

            <form
              onSubmit={handlePasswordLogin}
              className="space-y-4"
            >
              <div className="flex flex-col">
                <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col relative">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-body text-xs text-cream-muted font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetOpen(true);
                      setResetStep(1);
                      setServerError(null);
                    }}
                    className="text-[10px] text-spice hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all disabled:opacity-40 shadow-md"
              >
                {isSubmitting ? "Signing in..." : "Log In"}
              </button>
            </form>

            <div className="border-t border-border/40 mt-8 pt-6 text-center text-xs font-body">
              <span className="text-cream-muted">New to Rasoi House? </span>
              <Link href={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} className="text-spice hover:underline font-semibold">
                Sign Up Here
              </Link>
            </div>

          </div>
        </div>
      </main>

      {/* PASSWORD RESET MODAL */}
      <AnimatePresence>
        {isResetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-mahogany/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="card-warm p-8 bg-mahogany-card border border-border w-full max-w-md shadow-2xl relative"
            >
              {/* Reset Step 1: Input Email */}
              {resetStep === 1 && (
                <form onSubmit={handleSendResetOtp} className="space-y-6">
                  <div>
                    <h3 className="font-display text-xl text-cream tracking-wide">
                      Reset Password
                    </h3>
                    <p className="font-body text-xs text-cream-muted mt-2 leading-relaxed font-light">
                      Enter your registered email address below. We will deliver a 6-digit OTP code to verify your request.
                    </p>
                  </div>

                  <div className="flex flex-col">
                    <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsResetOpen(false)}
                      className="flex-1 border border-border text-cream py-3 rounded-sm text-sm font-semibold hover:border-spice hover:text-spice transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-spice text-cream py-3 rounded-sm text-sm font-semibold hover:bg-spice-light transition-colors"
                    >
                      {isSubmitting ? "Sending..." : "Send OTP"}
                    </button>
                  </div>
                </form>
              )}

              {/* Reset Step 2: Verify Email OTP */}
              {resetStep === 2 && (
                <form onSubmit={handleVerifyResetOtp} className="space-y-6">
                  <div>
                    <h3 className="font-display text-xl text-cream tracking-wide">
                      Verify Code
                    </h3>
                    <p className="font-body text-xs text-cream-muted mt-2 leading-relaxed font-light">
                      Please enter the code sent to <strong className="text-cream">{resetEmail}</strong>.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {resetOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { resetOtpInputRefs.current[idx] = el; }}
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

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="flex-1 border border-border text-cream py-3 rounded-sm text-sm font-semibold hover:border-spice hover:text-spice transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={resetOtp.some((d) => !d) || isSubmitting}
                      className="flex-1 bg-spice text-cream py-3 rounded-sm text-sm font-semibold hover:bg-spice-light transition-colors"
                    >
                      Verify Code
                    </button>
                  </div>
                </form>
              )}

              {/* Reset Step 3: Enter New Password */}
              {resetStep === 3 && (
                <form onSubmit={handleCompleteReset} className="space-y-6">
                  <div>
                    <h3 className="font-display text-xl text-cream tracking-wide">
                      New Password
                    </h3>
                    <p className="font-body text-xs text-cream-muted mt-2 leading-relaxed font-light">
                      Please enter your new security password (minimum 8 characters, with letters and numbers).
                    </p>
                  </div>

                  <div className="flex flex-col">
                    <label className="font-body text-xs text-cream-muted mb-1.5 font-medium">
                      Enter New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetNewPassword.length < 8 || isSubmitting}
                    className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light transition-colors shadow-md"
                  >
                    Update Password
                  </button>
                </form>
              )}

              {/* Reset Step 4: Success Message */}
              {resetStep === 4 && (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center text-forest mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="font-display text-xl text-cream mb-2">
                    Password Updated!
                  </h3>
                  <p className="font-body text-xs text-cream-muted max-w-xs leading-relaxed font-light mb-8">
                    Your password has been reset successfully. You can now use your new credentials to access the platform.
                  </p>
                  <button
                    onClick={() => setIsResetOpen(false)}
                    className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light transition-colors"
                  >
                    Return to Login
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-mahogany flex items-center justify-center">
        <span className="font-display text-cream animate-pulse">Namaste...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
