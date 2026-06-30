"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OurStorySection() {
  return (
    <section id="our-story" className="relative bg-mahogany-surface py-32 overflow-hidden border-t border-border/20">
      {/* Decorative faint background mandala in top-right */}
      <div className="absolute top-[-50px] right-[-100px] w-[350px] h-[350px] text-spice opacity-[0.03] pointer-events-none z-0">
        <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.8">
          <circle cx="100" cy="100" r="90" />
          <circle cx="100" cy="100" r="75" strokeDasharray="3,3" />
          <polygon points="100,10 126,80 190,100 126,120 100,190 74,120 10,100 74,80" />
          <circle cx="100" cy="100" r="45" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        {/* LEFT — Image composition (45% column span: lg:col-span-5) */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-5 relative flex justify-center lg:justify-start"
        >
          {/* Main Image */}
          <div className="relative w-full max-w-[380px] h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-border">
            <Image
              src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=500&auto=format&fit=crop"
              alt="Authentic head chef styling a premium Indian meal"
              fill
              className="object-cover"
            />
            {/* Soft dark vignetting */}
            <div className="absolute inset-0 bg-gradient-to-t from-mahogany/40 to-transparent" />
          </div>

          {/* Floating Heritage Badge */}
          <div className="absolute bottom-8 right-0 lg:right-[-20px] bg-mahogany-card/95 backdrop-blur-md border border-border p-5 rounded-xl shadow-2xl w-48 text-center">
            <span className="font-display text-4xl text-turmeric block leading-none mb-1">
              Since 1987
            </span>
            <span className="font-body text-[10px] text-cream-muted uppercase tracking-[0.1em] font-medium block">
              Family Recipe, Modern Kitchen
            </span>
          </div>
        </motion.div>

        {/* RIGHT — Content (55% column span: lg:col-span-7) */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="lg:col-span-7 flex flex-col items-start"
        >
          <span className="font-body text-xs md:text-sm font-semibold text-spice uppercase tracking-[0.25em] mb-3">
            Our Heritage
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-cream leading-tight mb-6">
            Three Generations,<br />One Sacred Kitchen
          </h2>
          <div className="space-y-4 font-body text-cream-muted text-sm md:text-base leading-[1.8] font-light">
            <p>
              Our culinary journey began in the heritage streets of Old Delhi, where our grandfather crafted custom spice blends for royal banquets. Today, those same secret formulations form the heartbeat of Rasoi House.
            </p>
            <p>
              We slow-cook black lentils for 16 hours, hand-pull tandoori naan from traditional clay ovens, and grind fresh cardamoms, saffron, and chilies every morning. We do not take shortcuts. Our commitment is to pure, unfiltered Indian hospitality.
            </p>
          </div>

          {/* Highlight Stat Row */}
          <div className="grid grid-cols-3 gap-6 border-y border-border/40 py-6 my-8 w-full">
            <div>
              <span className="font-display text-3xl text-turmeric block leading-none mb-1">
                35+
              </span>
              <span className="font-body text-xs text-cream-muted font-medium tracking-wide">
                Years of Legacy
              </span>
            </div>
            <div>
              <span className="font-display text-3xl text-turmeric block leading-none mb-1">
                3
              </span>
              <span className="font-body text-xs text-cream-muted font-medium tracking-wide">
                Generations of Chefs
              </span>
            </div>
            <div>
              <span className="font-display text-3xl text-turmeric block leading-none mb-1">
                50+
              </span>
              <span className="font-body text-xs text-cream-muted font-medium tracking-wide">
                Royal Recipes
              </span>
            </div>
          </div>

          <Link
            href="/#our-story"
            className="font-body text-sm font-semibold text-cream hover:text-turmeric group transition-colors flex items-center gap-1.5"
          >
            Read Our Full Story
            <span className="transform group-hover:translate-x-1.5 transition-transform duration-250">
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
