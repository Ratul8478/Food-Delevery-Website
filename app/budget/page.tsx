"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Check, AlertCircle, ShoppingBag, ArrowLeft, CreditCard, Sparkles, Calendar, MapPin, Phone, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import confetti from "canvas-confetti";

export default function BudgetCalculatorPage() {
  const { isAuthenticated, user } = useCart();

  // Calculator State
  const [serviceType, setServiceType] = useState<"food_only" | "food_setup" | "full_service">("full_service");
  const [guests, setGuests] = useState<number>(50);
  const [needDesserts, setNeedDesserts] = useState<boolean>(false);
  const [needLiveCounter, setNeedLiveCounter] = useState<boolean>(false);
  const [timeline, setTimeline] = useState<"advance" | "standard" | "express">("advance");

  // Booking Flow State
  const [step, setStep] = useState<"calculate" | "checkout" | "success">("calculate");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Checkout Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    eventDate: "",
    pincode: "",
    streetAddress: "",
    paymentMethod: "card" as "card" | "upi" | "wallet" | "cod",
  });

  // Keep user profile data in sync if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        phone: user.phone || prev.phone,
      }));
    }
  }, [isAuthenticated, user]);

  // Pricing calculations
  const calculatePrice = () => {
    let base = 15000;
    let perGuest = 900;

    if (serviceType === "food_only") {
      base = 5000;
      perGuest = 400;
    } else if (serviceType === "food_setup") {
      base = 8000;
      perGuest = 600;
    }

    let total = Math.max(base, base + (guests - 1) * perGuest);
    if (needDesserts) total += guests * 150;
    if (needLiveCounter) total += guests * 250;

    if (timeline === "express") {
      total += guests * 100;
    } else if (timeline === "standard") {
      total += guests * 50;
    }

    return total;
  };

  const calculateAgencyCost = () => {
    const perGuest = serviceType === "full_service" ? 1500 : 800;
    return 25000 + (guests - 1) * perGuest;
  };

  const calculateFreelancerCost = () => {
    const perGuest = serviceType === "full_service" ? 1000 : 500;
    return 12000 + (guests - 1) * perGuest;
  };

  const finalCost = calculatePrice();
  const agencyCost = calculateAgencyCost();
  const localRestaurantCost = calculateFreelancerCost();

  // Booking submit handler
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    // Validations
    if (!formData.fullName.trim()) {
      setCheckoutError("Please enter your full name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setCheckoutError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!formData.eventDate) {
      setCheckoutError("Please select the event date.");
      return;
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      setCheckoutError("Please enter a valid 6-digit delivery pincode.");
      return;
    }
    if (!formData.streetAddress.trim()) {
      setCheckoutError("Please enter the venue/delivery address.");
      return;
    }

    // Success transition
    setStep("success");
    // Trigger confetti
    try {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#F5C055", "#C4622D", "#F4650A", "#FFFFFF"],
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-mahogany flex flex-col">
      <Header />

      <main className="flex-grow pt-24 pb-16">
        <section id="calculator-section" className="py-16 md:py-24 px-4 md:px-16 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-turmeric font-semibold block mb-3">
              Catering & Banquet Budget Calculator
            </span>
            <h2 className="font-display text-3xl md:text-5xl text-cream-warm font-normal max-w-3xl mx-auto leading-tight">
              Plan a premium Indian feast within your budget
            </h2>
            <p className="font-body text-sm text-cream-muted max-w-xl mx-auto mt-4 leading-relaxed">
              Configure your event size, menu enhancements, and service style. Get immediate visual price comparisons and book your custom catering package directly.
            </p>
          </div>

          {/* Calculator Layout Box */}
          <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl border border-border/30 bg-warm-dark">
            {/* LEFT COLUMN: Calculator Config form */}
            <div className="bg-[#120500] p-8 lg:p-12 flex flex-col justify-between">
              <div className="space-y-8 divide-y divide-white/10 select-none">
                {/* 1. Service Type */}
                <div className="pb-8">
                  <h3 className="font-display text-lg text-turmeric-light mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-spice rounded-full block" />
                    What service model do you need?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "food_only", label: "Food Only", desc: "Premium delivery" },
                      { id: "food_setup", label: "Food & Setup", desc: "Buffet display" },
                      { id: "full_service", label: "Full Service", desc: "Staff & Live Chef" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (step === "calculate") {
                            setServiceType(item.id as any);
                          }
                        }}
                        disabled={step !== "calculate"}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all select-none ${
                          serviceType === item.id
                            ? "border-spice bg-spice/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                        } ${step !== "calculate" && "opacity-60 cursor-not-allowed"}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-body text-xs font-semibold text-white">
                            {item.label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              serviceType === item.id ? "border-spice" : "border-white/30"
                            }`}
                          >
                            {serviceType === item.id && (
                              <div className="w-2 h-2 rounded-full bg-spice" />
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/55 mt-2 block font-body">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Number of Guests (Slider) */}
                <div className="pt-8 pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-turmeric-light flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-spice rounded-full block" />
                      Number of Guests
                    </h3>
                    <span className="font-mono text-xl font-bold text-spice">
                      {guests} <span className="text-xs text-white/60">Guests</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={guests}
                    onChange={(e) => {
                      if (step === "calculate") {
                        setGuests(Number(e.target.value));
                      }
                    }}
                    disabled={step !== "calculate"}
                    className={`w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-spice ${
                      step !== "calculate" && "opacity-50 cursor-not-allowed"
                    }`}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-white/40 mt-2">
                    <span>10 guests</span>
                    <span>150 guests</span>
                    <span>300 guests</span>
                  </div>
                </div>

                {/* 3. Add-ons (Checkboxes) */}
                <div className="pt-8 pb-8">
                  <h3 className="font-display text-lg text-turmeric-light mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-spice rounded-full block" />
                    Event Add-ons
                  </h3>
                  <div className="space-y-3">
                    {/* Addon 1 */}
                    <label
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer select-none transition-all ${
                        needDesserts ? "border-spice bg-spice/5" : "border-white/10 bg-white/5 hover:bg-white/10"
                      } ${step !== "calculate" && "opacity-60 cursor-not-allowed pointer-events-none"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={needDesserts}
                          onChange={(e) => {
                            if (step === "calculate") {
                              setNeedDesserts(e.target.checked);
                            }
                          }}
                          disabled={step !== "calculate"}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 border rounded flex items-center justify-center shrink-0 transition-colors ${
                            needDesserts ? "border-spice bg-spice text-white" : "border-white/30 bg-transparent"
                          }`}
                        >
                          {needDesserts && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            Premium Desserts & Beverages Platter
                          </span>
                          <span className="text-[10px] text-white/50 block font-body">
                            Saffron Rasmalai, Gulab Jamuns, Shahi Lassis
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-spice shrink-0">
                        +₹150/guest
                      </span>
                    </label>

                    {/* Addon 2 */}
                    <label
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer select-none transition-all ${
                        needLiveCounter ? "border-spice bg-spice/5" : "border-white/10 bg-white/5 hover:bg-white/10"
                      } ${step !== "calculate" && "opacity-60 cursor-not-allowed pointer-events-none"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={needLiveCounter}
                          onChange={(e) => {
                            if (step === "calculate") {
                              setNeedLiveCounter(e.target.checked);
                            }
                          }}
                          disabled={step !== "calculate"}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 border rounded flex items-center justify-center shrink-0 transition-colors ${
                            needLiveCounter ? "border-spice bg-spice text-white" : "border-white/30 bg-transparent"
                          }`}
                        >
                          {needLiveCounter && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            Live Chef Tandoor Counters
                          </span>
                          <span className="text-[10px] text-white/50 block font-body">
                            Hot skewered kebabs, fresh naans, live chaats
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-spice shrink-0">
                        +₹250/guest
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. Prep Time / Timeline (Radio) */}
                <div className="pt-8">
                  <h3 className="font-display text-lg text-turmeric-light mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-spice rounded-full block" />
                    How fast do you need the catering?
                  </h3>
                  <div className="space-y-3">
                    {[
                      { id: "express", label: "Express Prep (Under 24 Hours Notice)", price: "+₹100/guest" },
                      { id: "standard", label: "Standard Prep (24–48 Hours Notice)", price: "+₹50/guest" },
                      { id: "advance", label: "Advance Booking (3+ Days Notice)", price: "No extra cost" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (step === "calculate") {
                            setTimeline(item.id as any);
                          }
                        }}
                        disabled={step !== "calculate"}
                        className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                          timeline === item.id
                            ? "border-spice bg-spice/5"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        } ${step !== "calculate" && "opacity-60 cursor-not-allowed"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              timeline === item.id ? "border-spice" : "border-white/30"
                            }`}
                          >
                            {timeline === item.id && (
                              <div className="w-2 h-2 rounded-full bg-spice" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-white">
                            {item.label}
                          </span>
                        </div>
                        <span className={`font-mono text-xs font-bold shrink-0 ${timeline === item.id ? "text-spice" : "text-white/60"}`}>
                          {item.price}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative brand footer in dark column */}
              <div className="border-t border-white/5 mt-10 pt-6 text-[10px] text-white/30 font-body flex justify-between items-center">
                <span>© Rasoi House Catering Services</span>
                <span>✨ Pure Hygiene & Integrity Certified</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Costs / Forms */}
            <div className="p-8 lg:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 min-h-[718px] bg-white">
              {/* STEP 1: CALCULATED ESTIMATIONS */}
              {step === "calculate" && (
                <div className="flex flex-col justify-between h-full space-y-6">
                  <div>
                    <h3 className="font-display text-2xl text-cream-warm mb-1">
                      Estimated Cost
                    </h3>
                    <p className="font-body text-xs text-cream-muted leading-relaxed">
                      Below is an estimate comparing our premium live kitchen packages against industry competitors.
                    </p>
                  </div>

                  {/* Comparisons */}
                  <div className="space-y-4">
                    {/* Card 1: Traditional Agency */}
                    <div className="bg-mahogany-surface/40 border border-border/40 rounded-xl p-5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-cream-muted uppercase font-bold tracking-wider">
                        <span>Traditional Premium Catering</span>
                        <span className="text-red-700">Minimum Charge</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-cream">Typical Agency Quote</span>
                        <span className="text-2xl font-bold font-mono text-cream-warm">
                          ₹{agencyCost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-cream-muted leading-normal">
                        ❌ High coordinator markups, rigid contracts, and hidden logistics charges.
                      </p>
                    </div>

                    {/* Card 2: Regular Local Restaurant */}
                    <div className="bg-mahogany-surface/40 border border-border/40 rounded-xl p-5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-cream-muted uppercase font-bold tracking-wider">
                        <span>Local Dine-In Catering</span>
                        <span className="text-red-700">Estimate</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-cream">Standard Local Restaurant</span>
                        <span className="text-2xl font-bold font-mono text-cream-warm">
                          ₹{localRestaurantCost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-cream-muted leading-normal">
                        ❌ Limited buffet layout items, standard packaging, and zero live counters support.
                      </p>
                    </div>

                    {/* Card 3: Our Premium Price Card */}
                    <div className="bg-gradient-to-br from-[#F5C055] via-[#C4622D] to-[#F4650A] text-white rounded-xl p-6 space-y-3 shadow-lg select-none relative overflow-hidden">
                      {/* Decorative background shape */}
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                      
                      <div className="flex justify-between items-center text-[10px] font-mono text-white/80 uppercase font-bold tracking-wider">
                        <span>Rasoi House Banquet Package</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-white flex items-center gap-1 font-sans">
                          <Sparkles size={9} /> Best Value
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-white">Your Custom Estimate</span>
                        <span className="text-4xl font-bold font-mono">
                          ₹{finalCost.toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-white/95 leading-relaxed font-body">
                        ✨ Save your money, coordination time, and prep headache. Handled entirely by our master chefs and premium setup crew.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("checkout")}
                    className="w-full bg-spice text-cream py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-spice-light active:scale-[0.98] transition-all shadow-md mt-6"
                  >
                    Proceed to Booking & Payment
                  </button>
                </div>
              )}

              {/* STEP 2: CHECKOUT & PAYMENT */}
              {step === "checkout" && (
                <div className="flex flex-col justify-between h-full space-y-6">
                  {/* Back button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setStep("calculate");
                        setCheckoutError(null);
                      }}
                      className="p-1.5 rounded-full hover:bg-mahogany-surface text-cream-muted hover:text-cream transition-all"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h3 className="font-display text-xl text-cream-warm">Delivery & Payment</h3>
                      <span className="text-[10px] text-cream-muted font-mono block">Catering Order value: ₹{finalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Form Container */}
                  <form onSubmit={handleBookingSubmit} className="space-y-4 font-body">
                    {checkoutError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg flex items-center gap-2 text-xs">
                        <AlertCircle size={16} className="text-red-700 shrink-0" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-cream-muted block">Full Name</label>
                        <div className="relative">
                          <User size={13} className="absolute left-3 top-3 text-cream-muted/50" />
                          <input
                            type="text"
                            placeholder="Rajesh Kumar"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full bg-mahogany-surface border border-border/80 rounded-lg pl-8.5 pr-3 py-2 text-xs text-cream focus:outline-none focus:border-spice transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-cream-muted block">Phone Number</label>
                        <div className="relative">
                          <Phone size={13} className="absolute left-3 top-3 text-cream-muted/50" />
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-mahogany-surface border border-border/80 rounded-lg pl-8.5 pr-3 py-2 text-xs text-cream focus:outline-none focus:border-spice transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-cream-muted block">Event Date</label>
                        <div className="relative">
                          <Calendar size={13} className="absolute left-3 top-3 text-cream-muted/50" />
                          <input
                            type="date"
                            value={formData.eventDate}
                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                            className="w-full bg-mahogany-surface border border-border/80 rounded-lg pl-8.5 pr-3 py-2 text-xs text-cream focus:outline-none focus:border-spice transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-cream-muted block">Venue Pincode</label>
                        <div className="relative">
                          <MapPin size={13} className="absolute left-3 top-3 text-cream-muted/50" />
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="110001"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            className="w-full bg-mahogany-surface border border-border/80 rounded-lg pl-8.5 pr-3 py-2 text-xs text-cream focus:outline-none focus:border-spice transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-cream-muted block">Complete Venue Address</label>
                      <textarea
                        rows={2}
                        placeholder="Floor, building, street, landmark details..."
                        value={formData.streetAddress}
                        onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                        className="w-full bg-mahogany-surface border border-border/80 rounded-lg px-3 py-2 text-xs text-cream focus:outline-none focus:border-spice transition-all resize-none"
                      />
                    </div>

                    {/* Payment methods */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cream-muted block">Select Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "card", label: "Credit Card", icon: <CreditCard size={13} /> },
                          { id: "upi", label: "UPI (Paytm/GPay)", icon: <span className="font-sans font-bold text-[10px]">UPI</span> },
                          { id: "wallet", label: "Rasoi Wallet", icon: <ShoppingBag size={13} /> },
                          { id: "cod", label: "Advance Deposit (COD)", icon: <Sparkles size={13} /> },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, paymentMethod: m.id as any })}
                            className={`p-3 border rounded-lg flex items-center gap-2 justify-center transition-all ${
                              formData.paymentMethod === m.id
                                ? "border-spice bg-spice/5 text-spice"
                                : "border-border/60 bg-transparent text-cream-muted hover:bg-mahogany-surface hover:text-cream"
                            }`}
                          >
                            {m.icon}
                            <span className="text-[11px] font-semibold">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stripe Card fields emulation */}
                    {formData.paymentMethod === "card" && (
                      <div className="p-3.5 bg-mahogany-surface/40 border border-border/50 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-mono text-cream-muted font-bold">
                          <span>STRIPE CARD TRANSACTION</span>
                          <span className="text-forest">SECURE</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Card Number (4242 4242 4242 4242)"
                          className="w-full bg-white border border-border/70 rounded px-2.5 py-1.5 text-xs text-cream focus:outline-none focus:border-spice"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="MM / YY"
                            className="w-full bg-white border border-border/70 rounded px-2.5 py-1.5 text-xs text-cream focus:outline-none focus:border-spice"
                          />
                          <input
                            type="text"
                            placeholder="CVC"
                            className="w-full bg-white border border-border/70 rounded px-2.5 py-1.5 text-xs text-cream focus:outline-none focus:border-spice"
                          />
                        </div>
                      </div>
                    )}

                    {/* UPI fields emulation */}
                    {formData.paymentMethod === "upi" && (
                      <div className="p-3.5 bg-mahogany-surface/40 border border-border/50 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-mono text-cream-muted font-bold">
                          <span>UPI ID OR QR CODE</span>
                          <span className="text-forest">FASTEST</span>
                        </div>
                        <input
                          type="text"
                          placeholder="yourname@okaxis / @ybl"
                          className="w-full bg-white border border-border/70 rounded px-2.5 py-1.5 text-xs text-cream focus:outline-none focus:border-spice"
                        />
                      </div>
                    )}

                    {/* Wallet fields emulation */}
                    {formData.paymentMethod === "wallet" && (
                      <div className="p-3.5 bg-mahogany-surface/40 border border-border/50 rounded-xl text-center">
                        <span className="text-[10px] text-cream-muted block">Available Wallet Balance</span>
                        <span className="text-lg font-bold font-mono text-cream block mt-0.5">₹1,200.00</span>
                        <span className="text-[9px] text-red-800 block mt-1">❌ Insufficient balance for this order. Please use another method.</span>
                      </div>
                    )}

                    {/* Submit Booking Button */}
                    <button
                      type="submit"
                      disabled={formData.paymentMethod === "wallet" && finalCost > 1200}
                      className="w-full bg-spice text-cream py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-spice-light active:scale-[0.98] transition-all shadow-md mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm & Pay ₹{finalCost.toLocaleString()}
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 3: BOOKING SUCCESS STATUS */}
              {step === "success" && (
                <div className="flex flex-col items-center justify-center text-center h-full space-y-6">
                  <div className="w-16 h-16 rounded-full bg-forest text-white flex items-center justify-center shadow-lg">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-cream-warm">Booking Successful!</h3>
                    <p className="font-body text-xs text-cream-muted max-w-sm mt-2 leading-relaxed">
                      Your premium catering booking has been confirmed. Our banquet coordinator will reach out to you within 2 hours at <span className="font-bold text-cream">{formData.phone}</span> to freeze the customized menu list.
                    </p>
                  </div>

                  <div className="bg-mahogany-surface/40 border border-border/60 rounded-xl p-5 w-full space-y-2.5 font-mono text-xs text-left">
                    <div className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-cream-muted font-sans font-semibold">Catering Model</span>
                      <span className="text-cream font-bold">
                        {serviceType === "food_only" ? "Food Only" : serviceType === "food_setup" ? "Food & Setup" : "Full Service"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-cream-muted font-sans font-semibold">Guests Count</span>
                      <span className="text-cream font-bold">{guests} Guests</span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-cream-muted font-sans font-semibold">Event Date</span>
                      <span className="text-cream font-bold">{formData.eventDate}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/30 pb-2">
                      <span className="text-cream-muted font-sans font-semibold">Payment Status</span>
                      <span className="text-forest font-bold font-sans uppercase">
                        {formData.paymentMethod === "cod" ? "Deposit Pending" : "Paid"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-sm">
                      <span className="text-cream-warm font-sans">Total Billed</span>
                      <span className="text-spice">₹{finalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStep("calculate");
                      setFormData({
                        fullName: "",
                        phone: "",
                        eventDate: "",
                        pincode: "",
                        streetAddress: "",
                        paymentMethod: "card",
                      });
                    }}
                    className="w-full bg-spice text-cream py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-spice-light active:scale-[0.98] transition-all shadow-md"
                  >
                    Calculate Another Feast
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
