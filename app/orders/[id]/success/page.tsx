"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CheckCircle2, ChevronRight, MapPin, ClipboardCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface OrderDetail {
  order: {
    id: string;
    order_number: string;
    status: string;
    payment_method: string;
    payment_status: string;
    subtotal: number;
    discount_amount: number;
    tax: number;
    delivery_charge: number;
    total_amount: number;
    created_at: string;
    notes: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    special_note: string | null;
    menu_items?: {
      image_url: string;
      is_veg: boolean;
    } | null;
  }>;
}

export default function OrderSuccessPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setData(json.data);
          
          // Trigger royal confetti showers
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#C4622D", "#E8A020", "#F4650A", "#FAF0DC", "#1E5C2E"],
          });
        } else {
          setError(json.error?.message || "Failed to load order details.");
        }
      } catch (err) {
        setError("Could not establish a connection to fetch order.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-mahogany">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-spice" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="font-body text-xs text-cream-muted">Preparing receipt details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-mahogany">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-24">
          <div className="card-warm p-8 text-center max-w-md mx-6 bg-mahogany-card border border-border">
            <span className="text-3xl">⚠️</span>
            <h2 className="font-display text-lg text-cream mt-2 mb-1">Receipt Load Failure</h2>
            <p className="font-body text-xs text-cream-muted mb-6">{error || "Order not found."}</p>
            <Link href="/" className="bg-spice text-cream px-6 py-2.5 text-xs font-semibold hover:bg-spice-light rounded-sm">
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { order, items } = data;
  const isCod = order.payment_method === "cod";

  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      <Header />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card-warm p-8 md:p-10 border border-border bg-mahogany-card shadow-2xl space-y-8 relative overflow-hidden"
          >
            {/* Header Success Section */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center text-forest bg-forest/5 p-3 rounded-full border border-forest/10 mb-2">
                <CheckCircle2 size={40} className="animate-scaleIn" />
              </div>
              <h1 className="font-display text-3xl text-cream tracking-wide">
                {isCod ? "Order Placed Successfully! 🛵" : "Payment Confirmed! 🎉"}
              </h1>
              <p className="font-body text-xs md:text-sm text-cream-muted max-w-md mx-auto leading-relaxed">
                {isCod
                  ? `Namaste! Your order has been placed. Keep ₹${order.total_amount} ready. Delivery is estimated in ~30 mins.`
                  : "Namaste! Your payment was verified and accepted. Our royal chefs are cooking up your selection."}
              </p>
            </div>

            {/* Quick Summary Info Box */}
            <div className="bg-mahogany-surface/50 border border-border/30 rounded-xl p-4 md:p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-body select-none">
              <div>
                <span className="text-[10px] text-cream-muted/70 uppercase block mb-1">Order Code</span>
                <span className="font-mono font-semibold text-cream">{order.order_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-cream-muted/70 uppercase block mb-1">Method</span>
                <span className="font-semibold text-cream uppercase">{isCod ? "COD" : "Online"}</span>
              </div>
              <div>
                <span className="text-[10px] text-cream-muted/70 uppercase block mb-1">Paid Status</span>
                <span
                  className={`font-semibold uppercase ${
                    order.payment_status === "paid" ? "text-forest" : "text-turmeric-dark"
                  }`}
                >
                  {order.payment_status === "paid" ? "Paid" : "COD Pending"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-cream-muted/70 uppercase block mb-1">Grand Total</span>
                <span className="font-mono font-bold text-spice">₹{order.total_amount}.00</span>
              </div>
            </div>

            {/* Itemized Order Details */}
            <div className="space-y-4">
              <h3 className="font-display text-sm text-cream uppercase tracking-wider border-b border-border/30 pb-2 flex items-center gap-1.5 select-none">
                <ClipboardCheck size={14} className="text-spice" />
                Receipt Details
              </h3>

              <div className="divide-y divide-border/20 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center gap-4 text-xs font-body">
                    <div className="flex items-center gap-3">
                      {item.menu_items?.image_url ? (
                        <img
                          src={item.menu_items.image_url}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-md border border-border/30 shrink-0 select-none"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-mahogany-surface rounded-md border border-border/20 flex items-center justify-center text-lg select-none">
                          🍲
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className={item.menu_items?.is_veg ? "text-forest text-[10px]" : "text-red-800 text-[10px]"}>
                            {item.menu_items?.is_veg ? "🟢" : "🔴"}
                          </span>
                          <h4 className="font-semibold text-cream">{item.name}</h4>
                        </div>
                        <span className="text-[10px] text-cream-muted">
                          Qty: {item.quantity} · ₹{item.price} each
                        </span>
                        {item.special_note && (
                          <p className="text-[10px] text-turmeric-dark italic mt-0.5">
                            Note: &quot;{item.special_note}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-medium text-cream text-right">
                      ₹{item.price * item.quantity}.00
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation details summary */}
              <div className="bg-mahogany-surface/30 rounded-lg p-4 space-y-2 border border-border/10 font-body text-xs">
                <div className="flex justify-between text-cream-muted">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{order.subtotal}.00</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-forest">
                    <span>Discount Applied</span>
                    <span className="font-mono">-₹{order.discount_amount}.00</span>
                  </div>
                )}
                <div className="flex justify-between text-cream-muted">
                  <span>Delivery Charge</span>
                  <span className="font-mono">
                    {order.delivery_charge === 0 ? "FREE" : `₹${order.delivery_charge}.00`}
                  </span>
                </div>
                <div className="flex justify-between text-cream-muted">
                  <span>GST / Tax (5%)</span>
                  <span className="font-mono">₹{order.tax}.00</span>
                </div>
                <div className="border-t border-border/30 pt-2.5 mt-1 flex justify-between items-baseline">
                  <span className="font-semibold text-cream">Amount Total</span>
                  <span className="font-mono text-base font-bold text-turmeric-dark">
                    ₹{order.total_amount}.00
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction Details */}
            {order.notes && (
              <div className="bg-mahogany-surface/20 border border-border/25 rounded-xl p-4 text-xs font-body">
                <div className="flex gap-2 text-cream-muted">
                  <MapPin size={15} className="shrink-0 mt-0.5 text-spice" />
                  <div>
                    <span className="font-semibold text-cream block mb-1">Kitchen Directions</span>
                    <p className="leading-relaxed font-light">{order.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 border-t border-border/40 pt-8">
              <Link
                href={`/orders/${order.id}`}
                className="flex-1 bg-spice text-cream py-3.5 rounded-sm font-semibold text-sm hover:bg-spice-light active:scale-95 transition-all text-center shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Track Live Progress</span>
                <ArrowRight size={15} className="animate-pulse" />
              </Link>
              <Link
                href="/menu"
                className="flex-1 bg-mahogany border border-border text-cream py-3.5 rounded-sm font-semibold text-sm hover:border-spice hover:text-spice transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <span>Order Something Else</span>
                <ChevronRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
