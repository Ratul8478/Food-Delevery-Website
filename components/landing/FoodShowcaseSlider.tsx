"use client";

import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

// Import Swiper styles
import "swiper/css";

interface FoodItem {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  price: number;
  discountPrice?: number;
  isVeg: boolean;
  spiceLevel: number;
  isBestseller: boolean;
  image: string;
}

export default function FoodShowcaseSlider() {
  const bestsellers: FoodItem[] = [
    {
      id: "1",
      name: "Paneer Butter Masala",
      nameHindi: "पनीर बटर मसाला",
      description: "Soft paneer cubes cooked in a rich, creamy tomato gravy with butter and cream.",
      price: 389,
      isVeg: true,
      spiceLevel: 2,
      isBestseller: true,
      image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "2",
      name: "Chicken Dum Biryani",
      nameHindi: "चिकन दम बिरयानी",
      description: "Succulent chicken pieces layered with long grain basmati rice, slow-cooked in a sealed handi.",
      price: 429,
      isVeg: false,
      spiceLevel: 4,
      isBestseller: true,
      image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "3",
      name: "Garlic Naan",
      nameHindi: "लहसुन नान",
      description: "Leavened clay oven flatbread infused with chopped garlic, butter, and fresh coriander.",
      price: 109,
      discountPrice: 89,
      isVeg: true,
      spiceLevel: 1,
      isBestseller: true,
      image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "4",
      name: "Chicken Tikka Masala",
      nameHindi: "चिकन टिक्का मसाला",
      description: "Tandoori grilled chicken chunks cooked in a spicy, creamy tomato-onion gravy.",
      price: 459,
      discountPrice: 399,
      isVeg: false,
      spiceLevel: 3,
      isBestseller: true,
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "5",
      name: "Dal Makhani",
      nameHindi: "दाल मखनी",
      description: "Slow-cooked black lentils and kidney beans simmered overnight with cream, butter, and tomatoes.",
      price: 329,
      isVeg: true,
      spiceLevel: 2,
      isBestseller: true,
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "6",
      name: "Rasmalai (2 Pcs)",
      nameHindi: "रसमलाई",
      description: "Flattened cottage cheese patties soaked in sweet, saffron-flavored thickened milk.",
      price: 159,
      discountPrice: 139,
      isVeg: true,
      spiceLevel: 1,
      isBestseller: true,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <section className="py-24 bg-mahogany overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col items-start md:flex-row md:items-end justify-between gap-4">
        {/* Title Block */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl text-cream tracking-wide">
            Our Bestsellers
          </h2>
          <span className="font-devanagari text-base text-cream-muted tracking-wide mt-1 block">
            हमारे बेस्टसेलर्स
          </span>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-body text-sm text-cream-muted max-w-sm"
        >
          Highly recommended signatures, prepared using authentic tandoor techniques and hand-ground spice blends.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="pl-6 md:pl-12 lg:pl-20"
      >
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          loop={true}
          grabCursor={true}
          spaceBetween={24}
          breakpoints={{
            320: { slidesPerView: 1.2 },
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.2 },
            1280: { slidesPerView: 4.2 },
          }}
          className="w-full !overflow-visible"
        >
          {bestsellers.map((item) => (
            <SwiperSlide key={item.id} className="!w-[280px]">
              <div className="card-warm overflow-hidden border border-border hover:border-spice/40 transition-colors duration-300 group select-none">
                {/* Image Section */}
                <div className="aspect-square relative w-full overflow-hidden bg-mahogany-surface">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-600 ease-out group-hover:scale-106"
                  />
                  
                  {/* VEG / NON-VEG INDICATOR */}
                  <div className="absolute top-4 left-4 z-10">
                    <div
                      className={`w-5 h-5 flex items-center justify-center border-2 ${
                        item.isVeg ? "border-forest" : "border-red-800"
                      } bg-mahogany-surface/80 p-0.5 rounded-sm backdrop-blur-sm`}
                      title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.isVeg ? "bg-forest" : "bg-red-800"
                        }`}
                      />
                    </div>
                  </div>

                  {/* BESTSELLER BADGE */}
                  {item.isBestseller && (
                    <div className="absolute top-4 right-4 z-10 bg-turmeric text-mahogany text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-md">
                      ★ Bestseller
                    </div>
                  )}

                  {/* SPICE LEVEL */}
                  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-0.5 bg-mahogany-surface/60 backdrop-blur-sm px-2 py-1 rounded-full">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${i < item.spiceLevel ? "opacity-100" : "opacity-20 grayscale"}`}
                      >
                        🌶️
                      </span>
                    ))}
                  </div>

                  {/* HOVER OVERLAY & QUICK ADD BUTTON */}
                  <div className="absolute inset-0 bg-mahogany/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="bg-spice text-cream px-6 py-2.5 rounded-full font-body text-xs font-semibold uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg hover:bg-spice-light"
                    >
                      Quick Add
                    </motion.button>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="p-5 flex flex-col justify-between h-[180px]">
                  <div>
                    <span className="font-devanagari text-[10px] text-cream-muted block mb-0.5">
                      {item.nameHindi}
                    </span>
                    <h3 className="font-body text-base font-semibold text-cream tracking-wide group-hover:text-turmeric transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="font-body text-xs text-cream-muted line-clamp-2 mt-1.5 font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* BOTTOM ROW */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                      {item.discountPrice ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-lg font-bold text-turmeric">
                            ₹{item.discountPrice}
                          </span>
                          <span className="font-mono text-xs text-cream-muted line-through">
                            ₹{item.price}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-lg font-bold text-turmeric">
                          ₹{item.price}
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="w-9 h-9 rounded-full bg-spice/15 text-spice hover:bg-spice hover:text-cream flex items-center justify-center transition-colors duration-200"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
    </section>
  );
}
