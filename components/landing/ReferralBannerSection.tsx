"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";

interface Tier {
  name: string;
  percent: number;
  color: string;
  icon: string;
}

export default function ReferralBannerSection() {
  const tiers: Tier[] = [
    { name: "Bronze", percent: 20, color: "#CD7F32", icon: "🥉" },
    { name: "Silver", percent: 30, color: "#E0E0E0", icon: "🥈" }, 
    { name: "Gold", percent: 40, color: "#F5C055", icon: "🥇" },   
    { name: "Platinum", percent: 50, color: "#CCCCCC", icon: "💎" }, 
    { name: "Diamond", percent: 60, color: "#B9F2FF", icon: "👑" },  
  ];

  const badgeVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <section className="bg-spice w-full py-20 px-6 text-center relative overflow-hidden">
      {/* Dynamic particles or faint backdrop accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,240,220,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
        {/* Gift Icon */}
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 120, damping: 10 }}
          className="w-16 h-16 rounded-full bg-[#FAF0DC]/15 backdrop-blur-sm border border-[#FAF0DC]/30 flex items-center justify-center text-[#FAF0DC] mb-6"
        >
          <Gift size={32} />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl md:text-5xl text-[#FAF0DC] tracking-wide mb-3"
        >
          Share the Love. Earn Rewards.
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-body text-base md:text-lg text-[#FAF0DC]/90 font-light max-w-xl leading-relaxed"
        >
          Invite your friends to Rasoi House. Once they complete their first order, unlock discount tiers from 20% all the way up to 60% off every meal.
        </motion.p>

        {/* TIER PREVIEW ROW */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="flex flex-wrap items-center justify-center gap-4 mt-10 w-full"
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={badgeVariants}
              whileHover={{ scale: 1.05 }}
              style={{
                borderColor: tier.color,
                color: tier.color,
                backgroundColor: `${tier.color}1E`, 
              }}
              className="rounded-full px-5 py-2.5 border-2 text-sm font-semibold tracking-wide flex items-center gap-2 cursor-pointer transition-colors duration-200 hover:!bg-[currentColor] hover:!text-[#1A0800] select-none"
            >
              <span>{tier.icon}</span>
              <span>
                {tier.name} · {tier.percent}% Off
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <Link
            href="/referrals"
            className="inline-block bg-[#FAF0DC] text-spice px-10 py-4 rounded-sm font-body text-base font-bold tracking-wide shadow-2xl hover:bg-[#F5E6C8] active:scale-95 transition-all duration-200"
          >
            Start Referring
          </Link>
          <span className="font-body text-xs text-[#FAF0DC]/75 block mt-4 font-light tracking-wider">
            Free to join. Points never expire.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
