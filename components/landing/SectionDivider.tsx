"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SectionDivider() {
  return (
    <div className="w-full flex items-center justify-center py-6 bg-mahogany-surface/40">
      <div className="w-full max-w-7xl px-6 flex items-center justify-center gap-4">
        {/* Left Fading Line */}
        <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-border to-border/70" />
        
        {/* Center Decorative Lotus Graphic */}
        <motion.div
          initial={{ rotate: -10, opacity: 0.5 }}
          whileInView={{ rotate: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-spice/70 flex items-center justify-center shrink-0"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform scale-95"
          >
            {/* Center Bud */}
            <path
              d="M50 20 C45 40, 45 65, 50 80 C55 65, 55 40, 50 20 Z"
              fill="currentColor"
            />
            {/* Left Inner Petal */}
            <path
              d="M50 40 C30 35, 25 55, 48 70 C42 55, 45 45, 50 40 Z"
              fill="currentColor"
              opacity="0.9"
            />
            {/* Right Inner Petal */}
            <path
              d="M50 40 C70 35, 75 55, 52 70 C58 55, 55 45, 50 40 Z"
              fill="currentColor"
              opacity="0.9"
            />
            {/* Base Support */}
            <path
              d="M25 80 C35 85, 65 85, 75 80 C60 77, 40 77, 25 80 Z"
              fill="currentColor"
              opacity="0.75"
            />
          </svg>
        </motion.div>

        {/* Right Fading Line */}
        <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent via-border to-border/70" />
      </div>
    </div>
  );
}
