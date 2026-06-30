"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";

export default function CTASection() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guests: "2",
    date: "",
    time: "19:30",
    notes: "",
  });
  const [isBooked, setIsBooked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date) return;
    setIsBooked(true);
  };

  return (
    <section id="reservations" className="py-24 bg-mahogany overflow-hidden border-t border-border/20 relative">
      {/* Background soft lighting glow */}
      <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-spice/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        {/* Left Info Column */}
        <div className="lg:col-span-5 text-left">
          <span className="font-body text-xs md:text-sm font-semibold text-spice uppercase tracking-[0.25em] mb-3 block">
            Table Booking
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-cream leading-tight mb-6">
            Reserve a Royal Table
          </h2>
          <p className="font-body text-cream-muted text-sm md:text-base leading-[1.8] font-light mb-8">
            Experience traditional Indian seating and custom menu services. For corporate events, kitty parties, or customized family lunches, reserve your space in advance.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-spice/10 flex items-center justify-center text-spice border border-spice/20 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="font-body text-sm font-semibold text-cream">Opening Hours</h4>
                <p className="font-body text-xs text-cream-muted mt-1 leading-normal">
                  Lunch: 12:00 PM – 3:30 PM <br />
                  Dinner: 7:00 PM – 11:30 PM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-spice/10 flex items-center justify-center text-spice border border-spice/20 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h4 className="font-body text-sm font-semibold text-cream">Contact Reservations</h4>
                <p className="font-body text-xs text-cream-muted mt-1 leading-normal font-mono">
                  +91 98765 43210 / bookings@rasoihouse.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 w-full">
          <div className="card-warm p-8 border border-border bg-mahogany-card relative">
            <AnimatePresence mode="wait">
              {!isBooked ? (
                <motion.form
                  key="booking-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-2 font-medium">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-mahogany-surface border border-border rounded-md px-4 py-3 text-sm text-cream placeholder-cream-muted/40 focus:border-spice focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-2 font-medium">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="^[6-9]\d{9}$"
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-mahogany-surface border border-border rounded-md px-4 py-3 text-sm text-cream placeholder-cream-muted/40 focus:border-spice focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Guests Select */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-2 font-medium">
                        Number of Guests
                      </label>
                      <select
                        value={formData.guests}
                        onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                        className="bg-mahogany-surface border border-border rounded-md px-4 py-3 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num} className="bg-mahogany-card text-cream">
                            {num} {num === 1 ? "Guest" : "Guests"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date picker */}
                    <div className="flex flex-col">
                      <label className="font-body text-xs text-cream-muted mb-2 font-medium">
                        Select Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full bg-mahogany-surface border border-border rounded-md px-4 py-3 text-sm text-cream focus:border-spice focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Notes */}
                  <div className="flex flex-col">
                    <label className="font-body text-xs text-cream-muted mb-2 font-medium">
                      Special Requests (e.g. Jain Food, Birthday, High Chair)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Let us know if you require Jain food, have allergies, or are celebrating a special occasion..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-mahogany-surface border border-border rounded-md px-4 py-3 text-sm text-cream placeholder-cream-muted/40 focus:border-spice focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-spice text-cream py-4 rounded-sm font-semibold hover:bg-spice-light active:scale-98 transition-all duration-200"
                  >
                    Confirm Booking
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="booking-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center text-forest mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="font-display text-2xl text-cream mb-2">
                    Table Reserved Successfully!
                  </h3>
                  <p className="font-body text-sm text-cream-muted max-w-sm leading-relaxed mb-8">
                    Namaste, <span className="text-turmeric font-medium">{formData.name}</span>. We have blocked a table for {formData.guests} guests on {formData.date} at {formData.time}. A confirmation SMS has been sent to {formData.phone}.
                  </p>
                  <button
                    onClick={() => {
                      setIsBooked(false);
                      setFormData({
                        name: "",
                        phone: "",
                        guests: "2",
                        date: "",
                        time: "19:30",
                        notes: "",
                      });
                    }}
                    className="border border-border text-cream px-6 py-2.5 rounded-sm hover:border-spice hover:text-spice transition-colors text-sm"
                  >
                    Book Another Table
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
