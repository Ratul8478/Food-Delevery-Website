"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AlertCircle, ShoppingBag, ArrowLeft, Smartphone, Wallet as WalletIcon, Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import PaymentSection from "@/components/checkout/PaymentSection";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart, isAuthenticated, user } = useCart();

  // Settings from backend
  const [isCodEnabled, setIsCodEnabled] = useState(false);
  const [maxCodAmount, setMaxCodAmount] = useState(500.00);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Form State
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    area: "",
    city: "New Delhi",
    state: "Delhi",
    pincode: "",
    landmark: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "wallet" | "cod">("card");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // UPI payment specific states
  const [upiId, setUpiId] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [activeUpiApp, setActiveUpiApp] = useState<string | null>(null);

  // Wallet specific mock balance
  const walletBalance = 650.00;

  // Load profile settings (COD status)
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/customer/settings");
        const json = await res.json();
        if (res.ok && json.success) {
          setIsCodEnabled(json.data.cod_enabled);
          setMaxCodAmount(json.data.max_cod_amount || 500.00);
          
          if (!json.data.cod_enabled && paymentMethod === "cod") {
            setPaymentMethod("card");
          }
        }
      } catch (e) {
        console.error("Failed to load customer settings", e);
      } finally {
        setLoadingSettings(false);
      }
    }

    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated, paymentMethod]);

  // Admin Simulator Toggle handler
  const handleToggleCodSimulator = async () => {
    if (!user) return;
    const targetUserId = user.userId || user.id;
    const nextStatus = !isCodEnabled;
    try {
      const res = await fetch(`/api/admin/customers/${targetUserId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod_enabled: nextStatus, max_cod_amount: maxCodAmount }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsCodEnabled(json.data.cod_enabled);
        setMaxCodAmount(json.data.max_cod_amount || 500.00);

        if (!json.data.cod_enabled && paymentMethod === "cod") {
          setPaymentMethod("card");
        }
      } else {
        alert(json.error?.message || "Failed to update settings via admin simulator");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to admin simulator endpoint");
    }
  };

  // Pricing calculations based on real cart items
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Calculate discount percent based on user's tier
  const discountPercent = isAuthenticated && user ? (
    user.discount_tier === "diamond" ? 60 :
    user.discount_tier === "platinum" ? 50 :
    user.discount_tier === "gold" ? 40 :
    user.discount_tier === "silver" ? 30 : 20
  ) : 0;

  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const deliveryCharge = subtotal > 0 && subtotal - discountAmount < 500 ? 50 : 0;
  const gstTax = Math.round((subtotal - discountAmount) * 0.05);
  const totalAmount = subtotal - discountAmount + deliveryCharge + gstTax;

  // Handles placing the order in the DB (for COD or Online payment initial step)
  const placeOrder = async (method: "cod" | "stripe", type?: "card" | "upi" | "wallet"): Promise<any> => {
    if (!address.fullName || !address.phone || !address.street || !address.pincode) {
      throw new Error("Please complete the delivery address form.");
    }
    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      throw new Error("Please enter a valid 6-digit pincode.");
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address_id: "address_mock_123", // Dummy address reference
        payment_method: method,
        payment_method_type: type || null,
        notes: notes || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || "Failed to place order.");
    }

    return json.data.order;
  };

  // Handles Cash on Delivery (COD) submission directly
  const handleCodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (totalAmount > maxCodAmount) {
      setCheckoutError(`Cash on Delivery orders are capped at ₹${maxCodAmount}.`);
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder("cod");
      await clearCart();
      router.push(`/orders/${order.id}/success`);
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handles UPI payment directly
  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!upiId && !showQrCode) {
      setCheckoutError("Please enter a UPI ID or scan the QR Code to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder("stripe", "upi");
      await clearCart();
      router.push(`/orders/${order.id}/success`);
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handles Wallet payment directly
  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (totalAmount > walletBalance) {
      setCheckoutError("Insufficient balance in your Rasoi Wallet.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder("stripe", "wallet");
      await clearCart();
      router.push(`/orders/${order.id}/success`);
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handles successful Stripe payment confirm callback
  const handleStripeSuccess = async (paymentIntentId: string) => {
    setSubmitting(true);
    try {
      // 1. Create order
      const order = await placeOrder("stripe", "card");
      
      // 2. Clear cart
      await clearCart();

      // 3. Confirm Stripe payment status in the database/mockDb
      await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          stripe_payment_intent_id: paymentIntentId,
        }),
      });

      // 4. Redirect to order tracker
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setCheckoutError(err.message);
      setSubmitting(false);
    }
  };

  // Empty cart view
  if (cartItems.length === 0 && !submitting) {
    return (
      <div className="flex flex-col min-h-screen bg-mahogany">
        <Header />
        <main className="flex-grow pt-24 pb-20 flex items-center justify-center">
          <div className="card-warm p-8 border border-border bg-mahogany-card max-w-md text-center shadow-xl mx-6">
            <span className="text-4xl mb-4 block">🛒</span>
            <h2 className="font-display text-xl text-cream mb-2">
              Your Checkout is Empty
            </h2>
            <p className="font-body text-xs text-cream-muted leading-relaxed mb-6">
              You do not have any dishes in your cart to checkout. Please explore our authentic menu to select items.
            </p>
            <Link
              href="/menu"
              className="bg-spice text-cream px-6 py-3 rounded-sm text-sm font-semibold hover:bg-spice-light active:scale-95 transition-all inline-block shadow-md"
            >
              Browse Our Menu
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Admin Simulation Toggle (Highly professional tool for UX review) */}
          <div className="bg-mahogany-surface border border-dashed border-turmeric/45 p-4 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛠️</span>
              <div>
                <h4 className="font-body text-xs md:text-sm font-semibold text-turmeric-dark">
                  Admin Simulator Console
                </h4>
                <p className="font-body text-[11px] text-cream-muted leading-tight">
                  Simulate an admin enabling/disabling COD in user profiles to verify frontend gates.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleCodSimulator}
              className={`font-body text-xs font-semibold px-4 py-2 rounded transition-colors ${
                isCodEnabled
                  ? "bg-forest text-cream shadow-sm"
                  : "bg-mahogany-card text-cream-muted border border-border"
              }`}
            >
              {isCodEnabled ? "COD: Enabled (Admin)" : "COD: Disabled (Admin)"}
            </button>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-4xl text-cream tracking-wide">
              Secure Checkout
            </h1>
            <span className="font-devanagari text-base text-cream-muted tracking-wide mt-1 block">
              चेकआउट और भुगतान
            </span>
          </div>

          {checkoutError && (
            <div className="bg-red-950/20 border border-red-900/60 text-red-300 p-4 rounded-md mb-6 flex items-start gap-2.5 text-xs max-w-3xl">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Delivery Address & Payment details */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Delivery Address Form */}
              <div className="card-warm p-6 md:p-8 border border-border bg-mahogany-card shadow-sm">
                <h3 className="font-display text-lg text-cream tracking-wide mb-6 pb-2 border-b border-border/40">
                  1. Delivery Address
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="flex flex-col">
                    <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col">
                    <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="^[6-9]\d{9}$"
                      placeholder="e.g. 9876543210"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Street */}
                  <div className="flex flex-col md:col-span-2">
                    <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                      Flat/House No., Building, Street *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apartment 4B, Shanti Enclave, Block C"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Area */}
                  <div className="flex flex-col">
                    <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                      Area / Locality *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Connaught Place"
                      value={address.area}
                      onChange={(e) => setAddress({ ...address, area: e.target.value })}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Pincode */}
                  <div className="flex flex-col">
                    <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="^\d{6}$"
                      placeholder="e.g. 110001"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Landmark */}
                  <div className="flex flex-col md:col-span-2">
                    <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Opposite Metro Gate 2"
                      value={address.landmark}
                      onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Notes */}
                  <div className="flex flex-col md:col-span-2">
                    <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                      Delivery Instructions / Kitchen Notes
                    </label>
                    <textarea
                      placeholder="e.g. Please ring bell, make dal makhani spicy..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section (Select online or COD) */}
              <div className="card-warm p-6 md:p-8 border border-border bg-mahogany-card shadow-sm space-y-6">
                <PaymentSection
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  isCodEnabled={isCodEnabled}
                  maxCodAmount={maxCodAmount}
                  totalAmount={totalAmount}
                />

                {/* Sub-form render based on selection */}
                <AnimatePresence mode="wait">
                  {paymentMethod === "card" && (
                    <motion.div
                      key="stripe-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden pt-4 border-t border-border/40"
                    >
                      <StripePaymentForm
                        amount={totalAmount}
                        address={address}
                        notes={notes}
                        placeOrder={(method) => placeOrder(method, "card")}
                        clearCart={clearCart}
                        onError={(msg) => setCheckoutError(msg)}
                      />
                    </motion.div>
                  )}

                  {paymentMethod === "upi" && (
                    <motion.div
                      key="upi-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden pt-4 border-t border-border/40 space-y-5"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <label className="font-body text-[11px] text-cream-muted mb-1.5 font-medium">
                            Enter UPI ID (VPA) *
                          </label>
                          <div className="flex rounded-md border border-border overflow-hidden bg-mahogany-surface focus-within:border-spice transition-colors">
                            <input
                              type="text"
                              placeholder="e.g. rajesh@okaxis"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value);
                                setActiveUpiApp(null);
                              }}
                              className="bg-transparent px-4 py-2.5 text-xs text-cream focus:outline-none w-full"
                            />
                          </div>
                        </div>

                        {/* Quick select apps */}
                        <div className="space-y-2">
                          <span className="font-body text-[10px] text-cream-muted font-medium block">
                            Or pay with popular UPI Apps:
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {["GPay", "PhonePe", "Paytm"].map((app) => (
                              <button
                                key={app}
                                type="button"
                                onClick={() => {
                                  setActiveUpiApp(app);
                                  setUpiId(`${address.fullName.replace(/\s+/g, "").toLowerCase()}@${app.toLowerCase()}`);
                                }}
                                className={`py-2 px-3 text-xs rounded border font-semibold transition-all ${
                                  activeUpiApp === app
                                    ? "bg-spice/20 border-spice text-cream"
                                    : "bg-mahogany-surface border-border text-cream-muted hover:border-border-hover/60 hover:text-cream"
                                }`}
                              >
                                {app}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* QR Code toggle */}
                        <div className="border border-border bg-mahogany-surface/30 p-4 rounded-lg flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowQrCode(!showQrCode)}
                            className="text-xs text-spice hover:underline font-semibold flex items-center gap-1.5"
                          >
                            <span>{showQrCode ? "Hide QR Code" : "Show QR Code to Scan"}</span>
                          </button>

                          {showQrCode && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white p-3 rounded-lg border border-border flex flex-col items-center"
                            >
                              {/* Simulated QR Code SVG */}
                              <svg width="120" height="120" viewBox="0 0 100 100" className="text-mahogany">
                                <rect width="100" height="100" fill="white" />
                                <rect x="10" y="10" width="20" height="20" fill="black" />
                                <rect x="15" y="15" width="10" height="10" fill="white" />
                                <rect x="70" y="10" width="20" height="20" fill="black" />
                                <rect x="75" y="15" width="10" height="10" fill="white" />
                                <rect x="10" y="70" width="20" height="20" fill="black" />
                                <rect x="15" y="75" width="10" height="10" fill="white" />
                                <rect x="40" y="40" width="20" height="20" fill="black" />
                                <rect x="45" y="45" width="10" height="10" fill="white" />
                                <rect x="40" y="15" width="10" height="15" fill="black" />
                                <rect x="15" y="40" width="15" height="10" fill="black" />
                                <rect x="70" y="70" width="20" height="20" fill="black" />
                                <rect x="75" y="75" width="10" height="10" fill="white" />
                                <rect x="45" y="70" width="15" height="15" fill="black" />
                                <rect x="70" y="45" width="15" height="15" fill="black" />
                              </svg>
                              <span className="text-[10px] text-mahogany font-bold mt-2">
                                Scan with any UPI App
                              </span>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleUpiSubmit}
                        disabled={submitting}
                        className="w-full bg-spice text-cream py-4 rounded-sm font-semibold text-sm hover:bg-spice-light active:scale-98 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Processing UPI Payment...</span>
                          </>
                        ) : (
                          <span>Pay ₹{totalAmount} via UPI</span>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {paymentMethod === "wallet" && (
                    <motion.div
                      key="wallet-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden pt-4 border-t border-border/40 space-y-5"
                    >
                      <div className="bg-mahogany-surface/40 border border-border p-5 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-body text-xs text-cream-muted">
                            Rasoi Royal Wallet Balance
                          </span>
                          <span className="font-mono text-base font-bold text-turmeric-dark">
                            ₹{walletBalance.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-cream-muted">Order Grand Total</span>
                          <span className="font-mono text-cream">₹{totalAmount.toFixed(2)}</span>
                        </div>

                        <div className="w-full h-[1px] bg-border/40" />

                        {totalAmount <= walletBalance ? (
                          <div className="flex items-center gap-2 text-xs text-forest">
                            <span className="text-lg">✓</span>
                            <span>Sufficient balance. Payment will be deducted instantly.</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-red-400">
                              <span className="text-lg">⚠</span>
                              <span>Insufficient balance. Short by ₹{(totalAmount - walletBalance).toFixed(2)}.</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleWalletSubmit}
                        disabled={submitting || totalAmount > walletBalance}
                        className="w-full bg-spice text-cream py-4 rounded-sm font-semibold text-sm hover:bg-spice-light active:scale-98 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Deducting Wallet Balance...</span>
                          </>
                        ) : (
                          <span>Pay ₹{totalAmount} from Wallet</span>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {paymentMethod === "cod" && (
                    <motion.div
                      key="cod-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="pt-4 border-t border-border/40"
                    >
                      <button
                        onClick={handleCodSubmit}
                        disabled={submitting || totalAmount > maxCodAmount}
                        className="w-full bg-spice text-cream py-4 rounded-sm font-semibold text-sm hover:bg-spice-light active:scale-98 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Placing Order...</span>
                          </>
                        ) : (
                          <span>Place Order (COD)</span>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* RIGHT: Order Summary info */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Summary Card */}
              <div className="card-warm p-6 border border-border bg-mahogany-card shadow-sm">
                <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4 select-none">
                  <ShoppingBag size={18} className="text-spice" />
                  <h3 className="font-display text-base text-cream tracking-wide">
                    Order Summary
                  </h3>
                </div>

                {/* Items List scroll */}
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-2">
                        <span
                          className={`text-xs mt-1 shrink-0 ${
                            item.isVeg ? "text-forest" : "text-red-800"
                          }`}
                        >
                          {item.isVeg ? "🟢" : "🔴"}
                        </span>
                        <div>
                          <h4 className="font-body text-xs font-semibold text-cream line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="font-body text-[10px] text-cream-muted">
                            Qty: {item.quantity} · ₹{item.price}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-cream shrink-0">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="w-full h-[1px] bg-border/40 my-5" />

                {/* Pricing Details */}
                <div className="space-y-3 font-body text-xs leading-normal">
                  <div className="flex justify-between text-cream-muted">
                    <span>Subtotal</span>
                    <span className="font-mono text-sm font-medium">₹{subtotal}</span>
                  </div>
                  
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-forest">
                      <span>Referral Discount ({discountPercent}%)</span>
                      <span className="font-mono text-sm font-medium">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-cream-muted">
                    <span>Delivery Charge</span>
                    <span className="font-mono text-sm font-medium">
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-cream-muted">
                    <span>GST (5%)</span>
                    <span className="font-mono text-sm font-medium">₹{gstTax}</span>
                  </div>

                  <div className="w-full h-[1px] bg-border/40 my-4" />

                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-base text-cream">Grand Total</span>
                    <span className="font-mono text-lg font-bold text-turmeric-dark">
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>

              </div>

              {/* Go Back Link */}
              <Link
                href="/menu"
                className="flex items-center gap-1.5 text-xs text-cream-muted hover:text-spice transition-colors font-medium pl-2"
              >
                <ArrowLeft size={13} />
                <span>Change dishes in menu</span>
              </Link>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
