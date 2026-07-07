"use client";

import React from "react";
import { useCart } from "@/lib/cart-context";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    updateQty,
    removeFromCart,
    isAuthenticated,
    user,
  } = useCart();

  // Price calculations
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

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-[#1A0800]/40 backdrop-blur-sm"
          />

          {/* Sliding Cart Sidebar Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-mahogany-surface shadow-2xl border-l border-border flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} className="text-spice" />
                <h2 className="font-display text-xl text-cream tracking-wide">
                  Your Order Cart
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-mahogany hover:text-spice transition-colors text-cream-muted"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content / Items List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-white border border-border/40 rounded-xl flex gap-3.5 shadow-sm group hover:border-spice/20 transition-all select-none"
                  >
                    {/* Item Image */}
                    <div className="relative w-18 h-18 rounded-lg overflow-hidden shrink-0 bg-mahogany">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-grow flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-body text-xs font-semibold text-cream line-clamp-1">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-cream-muted/50 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <span className="text-[10px] font-body text-cream-muted">
                          Unit Price: ₹{item.price}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-mahogany border border-border/80 rounded-md p-0.5">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-cream-muted hover:text-cream transition-colors"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-6 text-center font-mono text-[11px] font-bold text-cream">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-cream-muted hover:text-cream transition-colors"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        <span className="font-mono text-xs font-bold text-cream shrink-0">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <span className="text-4xl mb-4 opacity-75">🍲</span>
                  <h3 className="font-display text-base text-cream mb-1">Your cart is empty</h3>
                  <p className="font-body text-xs text-cream-muted max-w-[200px] leading-relaxed">
                    Explore our menu and add authentic Indian dishes to begin your feast.
                  </p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-6 bg-spice text-cream px-5 py-2.5 rounded-sm text-xs font-semibold hover:bg-spice-light active:scale-95 transition-all shadow-md"
                  >
                    Browse Menu
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-border/60 bg-white space-y-4 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
                {/* Cost Breakdown */}
                <div className="space-y-2.5 font-body text-xs leading-normal">
                  <div className="flex justify-between text-cream-muted">
                    <span>Subtotal</span>
                    <span className="font-mono text-sm font-medium">₹{subtotal}</span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-forest">
                      <span>Referral discount ({discountPercent}%)</span>
                      <span className="font-mono text-sm font-medium">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-cream-muted">
                    <span>Delivery Charge</span>
                    <span className="font-mono text-sm font-medium">
                      {deliveryCharge === 0 ? (
                        <span className="text-forest">FREE</span>
                      ) : (
                        `₹${deliveryCharge}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-cream-muted">
                    <span>GST (5%)</span>
                    <span className="font-mono text-sm font-medium">₹{gstTax}</span>
                  </div>

                  <div className="w-full h-[1px] bg-border/40 my-3" />

                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-sm text-cream">Total Amount</span>
                    <span className="font-mono text-base font-bold text-turmeric-dark">
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/budget"
                    onClick={() => setCartOpen(false)}
                    className="text-xs font-semibold text-spice hover:text-spice-light underline flex items-center justify-center gap-1 transition-all"
                  >
                    🎉 Planning a party? Try our Catering Budget Estimator
                  </Link>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="w-full bg-spice text-cream py-3.5 rounded-sm font-semibold text-sm flex items-center justify-center gap-2 hover:bg-spice-light active:scale-[0.98] transition-all shadow-md"
                >
                  Proceed to Checkout
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
