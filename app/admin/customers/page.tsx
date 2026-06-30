"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Search, UserCheck, Shield, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CODToggle from "@/components/admin/CODToggle";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  totalPoints: number;
  codEnabled: boolean;
  maxCodAmount: number;
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationToast, setNotificationToast] = useState<{ show: boolean; message: string } | null>(null);

  // Mock initial list of registered customers
  const [customers, setCustomers] = useState<Customer[]>([
    { id: "usr_mock_123", name: "Rajesh Kumar", email: "rajesh.kumar@gmail.com", phone: "9876543210", emailVerified: true, phoneVerified: true, totalPoints: 1200, codEnabled: false, maxCodAmount: 500 },
    { id: "102", name: "Anish Gupta", email: "anish.gupta@yahoo.com", phone: "9823456789", emailVerified: true, phoneVerified: true, totalPoints: 500, codEnabled: true, maxCodAmount: 1000 },
    { id: "103", name: "Kirti Sen", email: "kirti.sen@outlook.com", phone: "9876123456", emailVerified: true, phoneVerified: false, totalPoints: 100, codEnabled: false, maxCodAmount: 500 },
    { id: "104", name: "Siddharth Roy", email: "siddharth.roy@gmail.com", phone: "9911223344", emailVerified: false, phoneVerified: true, totalPoints: 0, codEnabled: false, maxCodAmount: 500 },
    { id: "105", name: "Vikram Malhotra", email: "vikram.m@gmail.com", phone: "9899887766", emailVerified: true, phoneVerified: true, totalPoints: 2000, codEnabled: true, maxCodAmount: 1500 },
  ]);

  // Handle updates to COD state from the toggle component
  const handleUpdateCodSettings = (id: string, codEnabled: boolean, maxCodAmount: number) => {
    setCustomers(
      customers.map((c) => (c.id === id ? { ...c, codEnabled, maxCodAmount } : c))
    );
  };

  // Filter list
  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Toast Notification for DB update simulation */}
          <AnimatePresence>
            {notificationToast?.show && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-forest text-cream border border-forest/30 shadow-2xl px-6 py-3.5 rounded-full flex items-center gap-3 text-xs md:text-sm font-medium"
              >
                <Check size={18} className="shrink-0" />
                <span>{notificationToast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-spice uppercase text-xs font-semibold tracking-widest mb-1.5">
                <Shield size={14} />
                Admin Panel Control
              </div>
              <h1 className="font-display text-4xl text-cream tracking-wide">
                Customer Settings
              </h1>
              <span className="font-devanagari text-base text-cream-muted tracking-wide mt-0.5 block">
                ग्राहक सेटिंग्स और प्रबंधन
              </span>
            </div>

            {/* Search Input bar */}
            <div className="relative w-full max-w-sm shrink-0">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted/50" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-mahogany-surface border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-cream placeholder-cream-muted/40 focus:border-spice focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="card-warm overflow-hidden border border-border bg-mahogany-card shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-cream-muted font-medium uppercase tracking-wider text-[10px] bg-mahogany-surface/40">
                    <th className="py-4 pl-6">Customer Details</th>
                    <th className="py-4">Verification Status</th>
                    <th className="py-4">Loyalty Balance</th>
                    <th className="py-4 text-center pr-6">COD Authorization & Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-light">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((cust) => {
                      const isBothVerified = cust.emailVerified && cust.phoneVerified;
                      return (
                        <tr key={cust.id} className="hover:bg-mahogany-surface/20">
                          {/* Details column */}
                          <td className="py-5 pl-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-cream text-base">{cust.name}</span>
                              <span className="text-cream-muted text-xs mt-0.5 font-mono">{cust.email}</span>
                              <span className="text-cream-muted text-xs font-mono mt-0.5">+91 {cust.phone}</span>
                            </div>
                          </td>

                          {/* Verification column */}
                          <td className="py-5">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5 text-xs">
                                <span className={cust.emailVerified ? "text-forest" : "text-red-800"}>
                                  {cust.emailVerified ? "🟢" : "🔴"}
                                </span>
                                <span className="text-cream-muted font-light">Email Verified</span>
                              </span>
                              <span className="flex items-center gap-1.5 text-xs">
                                <span className={cust.phoneVerified ? "text-forest" : "text-red-800"}>
                                  {cust.phoneVerified ? "🟢" : "🔴"}
                                </span>
                                <span className="text-cream-muted font-light">Phone Verified</span>
                              </span>
                              {!isBothVerified && (
                                <span className="text-[10px] text-turmeric mt-1 font-semibold flex items-center gap-1">
                                  <AlertCircle size={10} />
                                  Cannot Order (Requires Verification)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Points column */}
                          <td className="py-5 font-mono text-cream font-medium">
                            {cust.totalPoints} PTS
                          </td>

                          {/* COD Switch & Limit column */}
                          <td className="py-5 pr-6 text-center">
                            <CODToggle
                              userId={cust.id}
                              codEnabled={cust.codEnabled}
                              maxCodAmount={cust.maxCodAmount}
                              customerName={cust.name}
                              onUpdate={handleUpdateCodSettings}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-cream-muted font-body font-light">
                        No customers match your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
