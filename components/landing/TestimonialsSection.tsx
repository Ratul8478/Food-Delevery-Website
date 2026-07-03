"use client";

import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  source: string;
  rating: number;
  review: string;
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      id: "1",
      name: "Amit Sharma",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      source: "via Google Reviews",
      rating: 5,
      review: "The Paneer Butter Masala was a revelation. It tasted exactly like the premium fine-dining spots in Delhi. Absolute perfection!",
    },
    {
      id: "2",
      name: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      source: "via Zomato Reviews",
      rating: 5,
      review: "Unbelievable depth of flavor in the Dal Makhani. You can taste the slow tandoor clay pot cook. My absolute favorite Indian kitchen!",
    },
    {
      id: "3",
      name: "Rahul Shah",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      source: "via Google Reviews",
      rating: 5,
      review: "Being Jain, finding truly premium restaurant food is a struggle. Their dedicated Jain menu items are authentic and spectacular.",
    },
    {
      id: "4",
      name: "Sonal Mehta",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      source: "via Zomato Reviews",
      rating: 5,
      review: "The Chicken Dum Biryani arrived steaming hot in a clay handi. The aroma of saffron and cardamom was breathtaking.",
    },
  ];

  return (
    <section className="py-32 bg-mahogany overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl md:text-5xl text-cream tracking-wide"
        >
          What Our Guests Say
        </motion.h2>
        <motion.span
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-devanagari text-base text-cream-muted tracking-wide mt-2 block"
        >
          मेहमानों की प्रतिक्रिया
        </motion.span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="max-w-7xl mx-auto px-6"
      >
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={true}
          spaceBetween={30}
          pagination={{
            clickable: true,
            el: ".testimonials-custom-pagination",
            renderBullet: (index, className) => {
              return `<span class="${className} testimonials-bullet"></span>`;
            },
          }}
          breakpoints={{
            320: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="w-full !pb-14"
        >
          {testimonials.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="card-warm p-8 border border-border/60 hover:border-spice/40 hover:spice-glow transition-all duration-350 select-none flex flex-col justify-between h-[320px]">
                {/* Quote Section */}
                <div>
                  <span className="font-display text-5xl text-spice leading-none block h-4 select-none">
                    “
                  </span>
                  <p className="font-display text-base md:text-lg italic text-cream leading-[1.7] mt-2 line-clamp-4">
                    {item.review}
                  </p>
                </div>

                {/* Reviewer Details */}
                <div>
                  <div className="w-full h-[1px] bg-border/40 my-5" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden relative border border-border">
                        <Image
                          src={item.avatar}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-body text-sm font-semibold text-cream">
                          {item.name}
                        </h4>
                        <span className="font-body text-[10px] text-cream-muted uppercase tracking-wider block">
                          {item.source}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} size={12} className="fill-turmeric text-turmeric" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination Bullet Area */}
        <div className="flex justify-center mt-4">
          <div className="testimonials-custom-pagination flex items-center gap-2" />
        </div>
      </motion.div>

      {/* Bullet styling override */}
      <style jsx global>{`
        .testimonials-bullet {
          width: 8px !important;
          height: 8px !important;
          background: rgba(250, 240, 220, 0.2) !important;
          border-radius: 9999px !important;
          opacity: 1 !important;
          display: inline-block !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }
        .testimonials-bullet.swiper-pagination-bullet-active {
          width: 20px !important;
          background: #C4622D !important;
        }
      `}</style>
    </section>
  );
}
