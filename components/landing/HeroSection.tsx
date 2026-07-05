"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { ArrowRight, UtensilsCrossed, Star } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

export default function HeroSection() {
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1600&auto=format&fit=crop",
      alt: "Overhead shot of aromatic Indian Biryani in copper vessel",
    },
    {
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=1600&auto=format&fit=crop",
      alt: "Fresh tandoori bread being pulled in a rustic kitchen",
    },
    {
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1600&auto=format&fit=crop",
      alt: "Artfully arranged royal Indian thali spread",
    },
    {
      image: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?q=80&w=1600&auto=format&fit=crop",
      alt: "Warm luxury Indian fine-dining ambiance and lights",
    },
  ];

  // Headline staggered animations
  const line1Words = "Flavours Rooted".split(" ");
  const line2Words = "in Tradition".split(" ");

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    initial: { y: 20, opacity: 0, filter: "blur(12px)" },
    animate: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-mahogany">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={true}
          speed={1500}
          pagination={{
            clickable: true,
            el: ".hero-custom-pagination",
            renderBullet: (index, className) => {
              return `<span class="${className} hero-bullet"></span>`;
            },
          }}
          className="h-full w-full"
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={idx} className="relative h-full w-full">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={idx === 0}
                className="object-cover"
              />
              {/* Radial gradient shading */}
              <div className="absolute inset-0 bg-gradient-to-r from-mahogany/95 via-mahogany/70 to-transparent" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Rotating Background Mandala Ring */}
      <div className="absolute right-[5%] top-[50%] translate-y-[-50%] pointer-events-none z-0 hidden lg:block opacity-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="w-[500px] h-[500px] text-spice mandala-fade"
        >
          <svg
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="w-full h-full"
          >
            {/* Outer dotted rings */}
            <circle cx="100" cy="100" r="95" strokeDasharray="3,3" />
            <circle cx="100" cy="100" r="88" />
            <circle cx="100" cy="100" r="80" strokeDasharray="1,2" />

            {/* Geometric star patterns */}
            <polygon points="100,10 126,80 190,100 126,120 100,190 74,120 10,100 74,80" />
            <polygon points="100,20 118,85 180,100 118,115 100,180 82,115 20,100 82,85" rotate="45" style={{ transformOrigin: '100px 100px', transform: 'rotate(45deg)' }} />

            {/* Inner petaled rings */}
            <circle cx="100" cy="100" r="60" strokeDasharray="5,3" />
            <circle cx="100" cy="100" r="45" />

            {/* Center Lotus element */}
            <path d="M100,75 C95,90 95,105 100,120 C105,105 105,90 100,75 Z" fill="currentColor" opacity="0.4" />
            <path d="M100,85 C90,82 85,98 98,110 C93,98 95,90 100,85 Z" fill="currentColor" opacity="0.3" />
            <path d="M100,85 C110,82 115,98 102,110 C107,98 105,90 100,85 Z" fill="currentColor" opacity="0.3" />
          </svg>
        </motion.div>
      </div>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 flex flex-col items-start justify-center">
          {/* Vegetarian Badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-2 bg-mahogany-surface/60 backdrop-blur-sm px-5 py-2 rounded-full border border-turmeric/35 mb-6"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-forest animate-ping" />
            <span className="font-body text-xs text-cream-warm font-medium tracking-wide">
              Pure Vegetarian | Jain Options Available
            </span>
          </motion.div>

          {/* Staggered Word Reveal Headline */}
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="flex flex-col font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[1.05] tracking-tight max-w-4xl"
          >
            {/* Line 1 */}
            <div className="flex flex-wrap gap-x-4 overflow-visible py-1">
              {line1Words.map((word, index) => (
                <motion.span
                  key={index}
                  variants={wordVariants}
                  className="text-cream italic inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </div>
            {/* Line 2 */}
            <div className="flex flex-wrap gap-x-4 overflow-visible py-1">
              {line2Words.map((word, index) => (
                <motion.span
                  key={index}
                  variants={wordVariants}
                  className={`${word === "Tradition" ? "text-spice-gradient" : "text-cream"} inline-block`}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="font-body text-base md:text-lg text-cream-muted font-light leading-[1.8] max-w-lg mt-5"
          >
            From our kitchen in the heart of the city to your table — every dish carries the memory of a grandmother&apos;s recipe, blended with rich Indian spices.
          </motion.p>

          {/* Rating Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex items-center gap-4 mt-6 py-2 border-y border-border/30 font-mono text-xs md:text-sm text-cream-muted"
          >
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-turmeric text-turmeric" />
              ))}
              <span className="text-cream font-bold ml-1">4.9</span>
            </div>
            <span className="text-border">|</span>
            <span>2,800+ Orders</span>
            <span className="text-border">|</span>
            <span>30 mins Delivery</span>
          </motion.div>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="flex flex-wrap items-center gap-4 mt-8"
          >
            <Link
              href="/menu"
              className="group flex items-center gap-2 bg-spice text-cream px-8 py-4 rounded-sm text-base font-semibold hover:bg-spice-light hover:spice-glow transition-all duration-300"
            >
              Order Now
              <ArrowRight size={18} className="transform group-hover:translate-x-1.5 transition-transform" />
            </Link>

            <Link
              href="/menu"
              className="flex items-center gap-2 text-cream hover:text-turmeric transition-colors duration-300 px-6 py-4 font-semibold text-base"
            >
              <UtensilsCrossed size={18} />
              Explore Menu
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Slider Navigation Dots (Bullets) */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="hero-custom-pagination flex items-center gap-2" />
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <span className="font-body text-[10px] text-cream-muted uppercase tracking-[0.2em]">
          Scroll Down
        </span>
        <div className="w-[1px] h-12 bg-cream/20 relative overflow-hidden">
          <motion.div
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-4 bg-spice"
          />
        </div>
      </div>

      {/* Custom Styles for Pagination bullets */}
      <style jsx global>{`
        .hero-bullet {
          width: 8px !important;
          height: 8px !important;
          background: rgba(250, 240, 220, 0.3) !important;
          border-radius: 9999px !important;
          opacity: 1 !important;
          display: inline-block !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }
        .hero-bullet.swiper-pagination-bullet-active {
          width: 24px !important;
          background: #E8A020 !important;
        }
      `}</style>
    </section>
  );
}
