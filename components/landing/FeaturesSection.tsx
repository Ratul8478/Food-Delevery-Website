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

  return (
    <section className="py-24 bg-mahogany-surface border-t border-border/20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feat, idx) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
            className="card-warm p-8 border border-border/60 hover:border-spice/30 hover:spice-glow transition-all duration-300 flex flex-col items-start"
          >
            <div className="w-12 h-12 rounded-lg bg-mahogany-surface flex items-center justify-center border border-border mb-6">
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
      </div>
    </section>
  );
}
