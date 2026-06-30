"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
  nameHindi: string;
  emoji: string;
  image: string;
}

export default function MenuCategoriesSection() {
  const categories: Category[] = [
    {
      id: "starters",
      name: "Starters",
      nameHindi: "स्टार्टर",
      emoji: "🥗",
      image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "breads",
      name: "Breads",
      nameHindi: "रोटी",
      emoji: "🫓",
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "main-course",
      name: "Main Course",
      nameHindi: "मुख्य व्यंजन",
      emoji: "🍛",
      image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "rice-biryani",
      name: "Rice & Biryani",
      nameHindi: "चावल व बिरयानी",
      emoji: "🍚",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "desserts",
      name: "Desserts",
      nameHindi: "मिठाई",
      emoji: "🍮",
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=500&auto=format&fit=crop",
    },
    {
      id: "beverages",
      name: "Beverages",
      nameHindi: "पेय",
      emoji: "🥤",
      image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=500&auto=format&fit=crop",
    },
  ];

  const cardVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const arrowVariants = {
    initial: { x: -10, opacity: 0 },
    hover: { x: 0, opacity: 1, transition: { duration: 0.25 } },
  };

  return (
    <section className="py-32 bg-mahogany-surface border-t border-border/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Title centered */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-cream tracking-wide">
            Explore Our Menu
          </h2>
          <span className="font-devanagari text-base text-cream-muted tracking-wide mt-2 block">
            व्यंजन सूची
          </span>
        </div>

        {/* Grid of Categories */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/menu?category=${cat.id}`} className="block group">
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="aspect-[4/3] rounded-2xl overflow-hidden relative border border-border/60 hover:border-spice/50 transition-colors duration-300 shadow-xl cursor-pointer"
              >
                {/* Full-bleed category background image */}
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-600 ease-out group-hover:scale-106"
                />

                {/* Dark shading gradient overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-mahogany via-mahogany/45 to-transparent" 
                  style={{
                    background: "linear-gradient(to top, rgba(26,8,0,0.90) 0%, rgba(26,8,0,0.4) 50%, transparent 100%)"
                  }}
                />

                {/* Content at bottom left */}
                <div className="absolute bottom-0 left-0 w-full p-5 flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-3xl mb-2 filter drop-shadow">{cat.emoji}</span>
                    <h3 className="font-display text-lg md:text-xl text-cream tracking-wide leading-none">
                      {cat.name}
                    </h3>
                    <span className="font-devanagari text-xs text-cream-muted mt-1.5 leading-none">
                      {cat.nameHindi}
                    </span>
                  </div>

                  {/* Hover Arrow Indicator */}
                  <motion.div
                    variants={arrowVariants}
                    initial="initial"
                    className="w-8 h-8 rounded-full bg-spice text-cream flex items-center justify-center font-bold"
                  >
                    →
                  </motion.div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
