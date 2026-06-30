"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Check, ClipboardList, ChefHat, Bike, ShieldCheck, Home } from "lucide-react";
import { motion } from "framer-motion";

interface TrackingStep {
  label: string;
  description: string;
  icon: React.ReactNode;
  time?: string;
  status: "completed" | "active" | "pending";
}

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // Mock starting at "Preparing" status
  const orderNumber = "ORD-2206-081490"; // Mock order number

  // Simulate status progression over time
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStepIndex(3); // transition to Out for Delivery
    }, 8000);

    const timer2 = setTimeout(() => {
      setCurrentStepIndex(4); // transition to Delivered
    }, 18000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const stepsData = [
    {
      label: "Order Received",
      description: "We have received your royal order and sent it to the kitchen.",
      icon: <ClipboardList size={18} />,
      time: "03:02 PM",
    },
    {
      label: "Confirmed",
      description: "Our kitchen chef has accepted the order and started selection.",
      icon: <Check size={18} />,
      time: "03:04 PM",
    },
    {
      label: "Preparing",
      description: "Your dishes are firing in our clay tandoor and stone spice mills.",
      icon: <ChefHat size={18} />,
      time: "03:05 PM",
    },
    {
      label: "Out for Delivery",
      description: "Our delivery partner is speed-routing hot to your location.",
      icon: <Bike size={18} />,
      time: "Estimated: 03:25 PM",
    },
    {
      label: "Delivered",
      description: "Enjoy your fresh feast! Namaste and thank you for ordering.",
      icon: <ShieldCheck size={18} />,
      time: "Estimated: 03:30 PM",
    },
  ];

  const steps: TrackingStep[] = stepsData.map((step, index) => {
    let status: "completed" | "active" | "pending" = "pending";
    if (index < currentStepIndex) {
      status = "completed";
    } else if (index === currentStepIndex) {
      status = "active";
    }
    return { ...step, status };
  });

  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          
          {/* Main Card */}
          <div className="card-warm p-8 border border-border bg-mahogany-card shadow-2xl">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8">
              <div>
                <span className="font-body text-xs text-cream-muted uppercase tracking-wider">
                  Order Status Tracker
                </span>
                <h1 className="font-display text-2xl text-cream tracking-wide mt-1">
                  Tracking Order #{orderNumber}
                </h1>
              </div>
              <div className="bg-spice/10 border border-spice/20 text-spice px-4 py-2 rounded text-right">
                <span className="font-body text-xs text-cream-muted block leading-none mb-1">
                  Est. Delivery Time
                </span>
                <span className="font-mono text-base font-bold text-turmeric">
                  {currentStepIndex >= 4 ? "Delivered" : "25 Mins"}
                </span>
              </div>
            </div>

            {/* Simulated Live status badge */}
            <div className="bg-mahogany-surface border border-border p-4 rounded-lg mb-8 flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  currentStepIndex >= 4 ? "bg-forest" : "bg-spice"
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  currentStepIndex >= 4 ? "bg-forest" : "bg-spice"
                }`} />
              </span>
              <p className="font-body text-xs md:text-sm text-cream-muted">
                <strong className="text-cream">Status update:</strong> {steps[currentStepIndex].label} - {steps[currentStepIndex].description}
              </p>
            </div>

            {/* Stepper Timeline */}
            <div className="relative pl-8 border-l border-border/60 ml-3 space-y-12">
              {steps.map((step, idx) => (
                <div key={step.label} className="relative">
                  
                  {/* Step Dot Icon */}
                  <div
                    className={`absolute left-[-46px] top-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      step.status === "completed"
                        ? "bg-forest border-forest text-cream"
                        : step.status === "active"
                        ? "bg-spice border-spice text-cream scale-110 spice-glow"
                        : "bg-mahogany-surface border-border text-cream-muted"
                    }`}
                  >
                    {step.icon}
                  </div>

                  {/* Step Text Info */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <h3
                        className={`font-display text-lg tracking-wide ${
                          step.status === "active"
                            ? "text-turmeric"
                            : step.status === "completed"
                            ? "text-cream font-medium"
                            : "text-cream-muted/50"
                        }`}
                      >
                        {step.label}
                      </h3>
                      {step.time && (
                        <span className="font-mono text-xs text-cream-muted select-none">
                          {step.time}
                        </span>
                      )}
                    </div>
                    <p
                      className={`font-body text-xs md:text-sm mt-2 leading-relaxed font-light ${
                        step.status === "pending" ? "text-cream-muted/30" : "text-cream-muted"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                </div>
              ))}
            </div>

            {/* Back to Home CTA */}
            <div className="border-t border-border/40 mt-12 pt-8 flex items-center justify-between">
              <span className="font-body text-xs text-cream-muted font-light max-w-xs">
                Have questions about your order? Call support at +91 98765 43210.
              </span>
              <Link
                href="/"
                className="flex items-center gap-2 bg-mahogany border border-border text-cream hover:border-spice hover:text-spice px-6 py-3 rounded transition-colors text-sm font-semibold"
              >
                <Home size={16} />
                Back to Home
              </Link>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
