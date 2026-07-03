"use client";

import React from "react";
import { motion } from "framer-motion";
import { Leaf, Flame, Truck, Award } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeaturesSection() {
  const features: Feature[] = [
    {
      icon: <Leaf size={24} className="text-forest" />,
      title: "100% Pure Veg & Jain",
      description: "Dedicated kitchen sections ensuring zero cross-contamination. Custom Jain menu prepared without root vegetables available.",
    },
    {
      icon: <Flame size={24} className="text-spice" />,
      title: "Traditional Clay Tandoor",
      description: "Our naans, rotis, and kebabs are fired in authentic earth tandoors for that distinctive smokiness.",
    },
    {
      icon: <Award size={24} className="text-turmeric" />,
      title: "Stone Ground Spices",
      description: "Spices sourced from legacy farms and stone-ground by hand in-house to retain natural oils and absolute aroma.",
    },
    {
      icon: <Truck size={24} className="text-saffron" />,
      title: "30-Min Hot Delivery",
      description: "Packed in custom moisture-locking thermal bags to ensure your food arrives piping hot within 30 minutes.",
    },
  ];

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
      },
    },
  };

  return (
    <section className="py-24 bg-mahogany-surface/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-body text-xs md:text-sm font-semibold text-spice uppercase tracking-[0.25em] mb-2 block"
          >
            The Rasoi Standards
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl text-cream tracking-wide"
          >
            Our Promise of Quality
          </motion.h2>
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-devanagari text-base text-cream-muted tracking-wide mt-2 block"
          >
            गुणवत्ता का वादा
          </motion.span>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feat) => (
            <motion.div
              key={feat.title}
              variants={cardVariants}
              whileHover={{ 
                y: -6, 
                boxShadow: "0 12px 30px rgba(196,98,45,0.12)",
                borderColor: "rgba(196, 98, 45, 0.4)" 
              }}
              className="card-warm p-8 bg-mahogany border border-border/40 hover:border-spice/40 transition-all duration-300 flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-lg bg-mahogany-surface flex items-center justify-center border border-border mb-6 transition-colors group-hover:bg-spice/10">
                {feat.icon}
              </div>
              <h3 className="font-display text-lg text-cream mb-3 tracking-wide">
                {feat.title}
              </h3>
              <p className="font-body text-xs md:text-sm text-cream-muted leading-relaxed font-light">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
