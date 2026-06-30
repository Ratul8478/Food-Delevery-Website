"use client";

import React from "react";
import { CreditCard, Banknote, Smartphone, Wallet, Lock } from "lucide-react";

interface PaymentSectionProps {
  paymentMethod: "card" | "upi" | "wallet" | "cod";
  setPaymentMethod: (method: "card" | "upi" | "wallet" | "cod") => void;
  isCodEnabled: boolean;
  maxCodAmount: number;
  totalAmount: number;
}

export default function PaymentSection({
  paymentMethod,
  setPaymentMethod,
  isCodEnabled,
  maxCodAmount,
  totalAmount,
}: PaymentSectionProps) {
  const isCodAmountExceeded = totalAmount > maxCodAmount;
  const isCodAllowed = isCodEnabled && !isCodAmountExceeded;

  return (
    <div className="space-y-5">
      <h3 className="font-display text-lg text-cream tracking-wide mb-4 pb-2 border-b border-border/30 select-none">
        2. Select Payment Method
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Card Payment */}
        <div
          onClick={() => setPaymentMethod("card")}
          className={`rounded-xl p-5 border-2 cursor-pointer transition-all ${
            paymentMethod === "card"
              ? "border-spice bg-mahogany-card shadow-lg ring-1 ring-spice/20"
              : "border-border bg-mahogany-card hover:border-border-hover/60"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                paymentMethod === "card" ? "border-spice" : "border-border-hover/30"
              }`}
            >
              {paymentMethod === "card" && (
                <div className="w-2.5 h-2.5 rounded-full bg-spice animate-scaleIn" />
              )}
            </div>
            <div className="w-full">
              <h4 className="font-body text-xs md:text-sm font-semibold text-cream flex items-center gap-2">
                <CreditCard size={16} className="text-spice" />
                Card Payment
              </h4>
              <p className="font-body text-[11px] text-cream-muted mt-1 leading-normal">
                Credit, Debit, or ATM Cards
              </p>
              <p className="font-body text-[10px] text-cream-muted/65 mt-1">
                Securely processed via Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Option 2: UPI Payment */}
        <div
          onClick={() => setPaymentMethod("upi")}
          className={`rounded-xl p-5 border-2 cursor-pointer transition-all ${
            paymentMethod === "upi"
              ? "border-spice bg-mahogany-card shadow-lg ring-1 ring-spice/20"
              : "border-border bg-mahogany-card hover:border-border-hover/60"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                paymentMethod === "upi" ? "border-spice" : "border-border-hover/30"
              }`}
            >
              {paymentMethod === "upi" && (
                <div className="w-2.5 h-2.5 rounded-full bg-spice animate-scaleIn" />
              )}
            </div>
            <div className="w-full">
              <h4 className="font-body text-xs md:text-sm font-semibold text-cream flex items-center gap-2">
                <Smartphone size={16} className="text-spice" />
                UPI Payment
              </h4>
              <p className="font-body text-[11px] text-cream-muted mt-1 leading-normal">
                Google Pay, PhonePe, Paytm, BHIM
              </p>
              <p className="font-body text-[10px] text-cream-muted/65 mt-1">
                Instant UPI transfer
              </p>
            </div>
          </div>
        </div>

        {/* Option 3: Wallet Payment */}
        <div
          onClick={() => setPaymentMethod("wallet")}
          className={`rounded-xl p-5 border-2 cursor-pointer transition-all ${
            paymentMethod === "wallet"
              ? "border-spice bg-mahogany-card shadow-lg ring-1 ring-spice/20"
              : "border-border bg-mahogany-card hover:border-border-hover/60"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                paymentMethod === "wallet" ? "border-spice" : "border-border-hover/30"
              }`}
            >
              {paymentMethod === "wallet" && (
                <div className="w-2.5 h-2.5 rounded-full bg-spice animate-scaleIn" />
              )}
            </div>
            <div className="w-full">
              <h4 className="font-body text-xs md:text-sm font-semibold text-cream flex items-center gap-2">
                <Wallet size={16} className="text-spice" />
                Wallet Payment
              </h4>
              <p className="font-body text-[11px] text-cream-muted mt-1 leading-normal">
                Pay using Rasoi Royal Wallet
              </p>
              <p className="font-body text-[10px] text-cream-muted/65 mt-1">
                Instant checkout & refunds
              </p>
            </div>
          </div>
        </div>

        {/* Option 4: Cash on Delivery (COD) */}
        <div
          onClick={() => {
            if (isCodAllowed) {
              setPaymentMethod("cod");
            }
          }}
          className={`rounded-xl p-5 border-2 transition-all ${
            !isCodAllowed
              ? "opacity-45 cursor-not-allowed border-border/40 bg-mahogany-card/50 select-none"
              : paymentMethod === "cod"
              ? "border-spice bg-mahogany-card shadow-lg ring-1 ring-spice/20 cursor-pointer"
              : "border-border bg-mahogany-card hover:border-border-hover/60 cursor-pointer"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                !isCodAllowed
                  ? "border-border/30 bg-transparent"
                  : paymentMethod === "cod"
                  ? "border-spice"
                  : "border-border-hover/30"
              }`}
            >
              {isCodAllowed && paymentMethod === "cod" && (
                <div className="w-2.5 h-2.5 rounded-full bg-spice animate-scaleIn" />
              )}
            </div>
            <div className="w-full">
              <h4 className="font-body text-xs md:text-sm font-semibold text-cream flex items-center gap-2">
                {!isCodAllowed ? <Lock size={16} className="text-red-900/60" /> : <Banknote size={16} className="text-spice" />}
                Cash on Delivery
              </h4>
              <p className="font-body text-[11px] text-cream-muted mt-1 leading-normal">
                Pay when your food arrives
              </p>
              <p className="font-body text-[10px] mt-1 font-semibold">
                {!isCodEnabled ? (
                  <span className="text-red-400">Disabled by Restaurant</span>
                ) : isCodAmountExceeded ? (
                  <span className="text-red-400">Exceeds limit of ₹{maxCodAmount}</span>
                ) : (
                  <span className="text-forest">Available up to ₹{maxCodAmount}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
