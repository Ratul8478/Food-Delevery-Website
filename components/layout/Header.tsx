"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import CartDrawer from "../cart/CartDrawer";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, setCartOpen, isAuthenticated, user } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "Our Story", href: "/#our-story" },
    { name: "Gallery", href: "/#gallery" },
    { name: "Reservations", href: "/#reservations" },
    { name: "Contact", href: "/#contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-350 ease-in-out ${
          isScrolled
            ? "bg-mahogany/92 backdrop-blur-xl border-b border-border"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          {/* LEFT - Logo */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Link href="/" className="flex items-center gap-3">
              {/* Custom SVG Lotus Logo (6 Petals) */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-spice animate-pulse"
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
                {/* Left Outer Petal */}
                <path
                  d="M45 55 C15 50, 10 75, 45 80 C35 70, 38 60, 45 55 Z"
                  fill="currentColor"
                  opacity="0.8"
                />
                {/* Right Outer Petal */}
                <path
                  d="M55 55 C85 50, 90 75, 55 80 C65 70, 62 60, 55 55 Z"
                  fill="currentColor"
                  opacity="0.8"
                />
                {/* Ground support / leaf base */}
                <path
                  d="M25 80 C35 85, 65 85, 75 80 C60 77, 40 77, 25 80 Z"
                  fill="currentColor"
                  opacity="0.75"
                />
              </svg>
              <div>
                <h1 className="font-display text-xl text-cream tracking-[0.05em] leading-none">
                  Rasoi House
                </h1>
                <span className="font-body text-[10px] text-cream-muted uppercase tracking-[0.15em] block mt-0.5">
                  Authentic Indian Kitchen
                </span>
              </div>
            </Link>
          </motion.div>

          {/* CENTER - Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href.startsWith("/#") && pathname === "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative font-body text-sm font-medium transition-colors duration-250 py-1 ${
                    isActive ? "text-turmeric" : "text-cream-muted hover:text-cream"
                  } group`}
                >
                  {item.name}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[2px] bg-spice origin-center transition-transform duration-250 ease-out scale-x-0 group-hover:scale-x-100 ${
                      isActive ? "scale-x-100 bg-turmeric" : ""
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* RIGHT - Actions */}
          <div className="flex items-center gap-4">
            {/* Reserve Button */}
            <Link
              href="/#reservations"
              className="hidden lg:inline-block border border-border/60 text-cream px-5 py-2 rounded-sm text-sm font-medium hover:border-spice hover:text-spice hover:bg-spice/8 transition-all duration-200"
            >
              Reserve
            </Link>

            {/* Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-cream hover:text-spice transition-colors"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-spice text-cream font-mono text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center text-center leading-none">
                  <span>{cartCount}</span>
                </span>
              )}
            </button>

            {/* Profile / Account link */}
            {isAuthenticated ? (
              <Link
                href="/referrals"
                className="p-2 text-cream hover:text-spice transition-colors flex items-center gap-1.5"
                title="Referrals Dashboard"
              >
                <User size={18} className="text-turmeric" />
                <span className="hidden lg:inline text-xs font-semibold text-cream">
                  {user?.fullName?.split(" ")[0] || "Profile"}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-2 text-cream-muted hover:text-spice transition-colors text-xs font-semibold"
              >
                Log In
              </Link>
            )}

            {/* Order Now Button */}
            <Link
              href="/menu"
              className="hidden sm:inline-block bg-spice text-cream px-6 py-2 rounded-sm text-sm font-medium hover:bg-spice-light hover:spice-glow hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              Order Now
            </Link>

            {/* Hamburger button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-cream hover:text-spice transition-colors md:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Render CartDrawer */}
      <CartDrawer />

      {/* MOBILE FULLSCREEN OVERLAY MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-mahogany/98 backdrop-blur-xl flex flex-col justify-between p-6"
          >
            {/* Header Area inside Overlay */}
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-spice"
                >
                  <path
                    d="M50 20 C45 40, 45 65, 50 80 C55 65, 55 40, 50 20 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M50 40 C30 35, 25 55, 48 70 C42 55, 45 45, 50 40 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <path
                    d="M50 40 C70 35, 75 55, 52 70 C58 55, 55 45, 50 40 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <path
                    d="M25 80 C35 85, 65 85, 75 80 C60 77, 40 77, 25 80 Z"
                    fill="currentColor"
                    opacity="0.75"
                  />
                </svg>
                <h1 className="font-display text-xl text-cream tracking-[0.05em]">
                  Rasoi House
                </h1>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-cream hover:text-spice transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Menu Links */}
            <nav className="flex flex-col items-center gap-6 my-auto">
              {navItems.map((item, idx) => (
                <motion.div
                  key={item.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-display text-3xl text-cream hover:text-turmeric transition-colors block text-center"
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Footer Buttons in Overlay */}
            <div className="flex flex-col gap-3 w-full pb-8">
              <Link
                href="/menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-spice text-cream py-4 rounded-sm text-center font-medium hover:bg-spice-light active:scale-95 transition-all text-base"
              >
                Order Now
              </Link>
              <Link
                href="/#reservations"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full border border-border text-cream py-4 rounded-sm text-center font-medium hover:border-spice hover:text-spice transition-all text-base"
              >
                Book Table
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
