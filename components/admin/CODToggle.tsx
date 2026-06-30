"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Edit2, X, AlertCircle } from "lucide-react";

interface CODToggleProps {
  userId: string;
  codEnabled: boolean;
  maxCodAmount: number;
  onUpdate: (userId: string, codEnabled: boolean, maxCodAmount: number) => void;
  customerName?: string;
}

export default function CODToggle({
  userId,
  codEnabled,
  maxCodAmount,
  onUpdate,
  customerName = "Customer",
}: CODToggleProps) {
  const [loading, setLoading] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [inputAmount, setInputAmount] = useState(maxCodAmount.toString());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Keep input amount in sync with props
  useEffect(() => {
    setInputAmount(maxCodAmount.toString());
  }, [maxCodAmount]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggle = async () => {
    if (loading) return;

    const nextCodEnabled = !codEnabled;
    
    // Optimistic UI Update: notify parent immediately
    onUpdate(userId, nextCodEnabled, maxCodAmount);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/customers/${userId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cod_enabled: nextCodEnabled,
          max_cod_amount: maxCodAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update database.");
      }

      showToast(
        nextCodEnabled
          ? `COD enabled for ${customerName}`
          : `COD disabled for ${customerName}`,
        "success"
      );
    } catch (err: any) {
      // Revert Optimistic UI: notify parent of original state
      onUpdate(userId, codEnabled, maxCodAmount);
      showToast(err.message || "Failed to update settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAmount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountVal = parseFloat(inputAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast("Please enter a valid positive amount.", "error");
      return;
    }

    setIsEditingAmount(false);
    setLoading(true);

    // Optimistic UI update
    onUpdate(userId, codEnabled, amountVal);

    try {
      const res = await fetch(`/api/admin/customers/${userId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cod_enabled: codEnabled,
          max_cod_amount: amountVal,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update max limit.");
      }

      showToast(`COD limit updated to ₹${amountVal} for ${customerName}`, "success");
    } catch (err: any) {
      // Revert Optimistic UI
      onUpdate(userId, codEnabled, maxCodAmount);
      setInputAmount(maxCodAmount.toString());
      showToast(err.message || "Failed to update limit.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2 select-none">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl px-5 py-3 rounded-full flex items-center gap-2.5 text-xs md:text-sm font-medium border text-cream ${
              toastType === "success"
                ? "bg-forest border-forest/30"
                : "bg-red-950 border-red-900/60 text-red-200"
            }`}
          >
            {toastType === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch Control */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          {/* Label status left */}
          <span className="text-[10px] uppercase font-bold tracking-wider text-cream-muted/70">
            {codEnabled ? "COD Active" : "Online Only"}
          </span>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${
              loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            } ${codEnabled ? "bg-spice" : "bg-border"}`}
          >
            <span className="sr-only">Toggle Cash on Delivery</span>
            
            {/* Spinning Indicator if Loading */}
            {loading ? (
              <motion.div
                layout
                className="absolute left-1 flex h-4 w-4 items-center justify-center rounded-full bg-cream shadow-sm"
              >
                <svg className="animate-spin h-2.5 w-2.5 text-spice" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`h-4 w-4 rounded-full bg-cream shadow-md ${
                  codEnabled ? "transform translate-x-6" : "transform translate-x-1"
                }`}
              />
            )}
          </button>
        </div>
      </div>

      {/* Inline Max COD Amount Limit Editor */}
      <div className="flex items-center gap-2 border-l border-border/40 pl-4 h-6">
        {isEditingAmount ? (
          <form
            onSubmit={handleSaveAmount}
            className="flex items-center gap-1 bg-mahogany-surface border border-border rounded px-1.5 py-0.5"
          >
            <span className="text-[10px] text-cream-muted font-semibold">₹</span>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="w-16 bg-transparent border-none text-xs text-cream focus:outline-none font-mono"
              autoFocus
              min="1"
            />
            <button type="submit" className="text-forest hover:scale-110 transition-transform">
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingAmount(false);
                setInputAmount(maxCodAmount.toString());
              }}
              className="text-red-800 hover:scale-110 transition-transform"
            >
              <X size={12} />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-cream font-mono">
            <span>₹{maxCodAmount}</span>
            <button
              onClick={() => setIsEditingAmount(true)}
              className="text-cream-muted hover:text-spice transition-colors"
              title="Edit COD threshold limit"
            >
              <Edit2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
