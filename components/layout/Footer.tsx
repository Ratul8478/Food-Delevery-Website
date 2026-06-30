"use client";

import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-mahogany border-t border-border/40 py-16 text-cream-muted">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* About column */}
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <svg
              width="28"
              height="28"
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
            </svg>
            <span className="font-display text-lg text-cream tracking-[0.05em]">
              Rasoi House
            </span>
          </div>
          <p className="font-body text-xs md:text-sm text-cream-muted leading-relaxed font-light mt-2">
            Experience the royal flavors of India. Traditional recipes passed down through three generations, crafted with stone-ground spices in clay oven tandoors.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a href="https://instagram.com" className="text-cream-muted hover:text-spice transition-colors" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://facebook.com" className="text-cream-muted hover:text-spice transition-colors" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://twitter.com" className="text-cream-muted hover:text-spice transition-colors" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display text-sm text-cream tracking-wider uppercase mb-6">
            Quick Links
          </h4>
          <ul className="space-y-3 font-body text-xs md:text-sm font-light">
            <li>
              <Link href="/" className="hover:text-spice transition-colors">Home</Link>
            </li>
            <li>
              <Link href="/menu" className="hover:text-spice transition-colors">Menu</Link>
            </li>
            <li>
              <Link href="/#our-story" className="hover:text-spice transition-colors">Our Story</Link>
            </li>
            <li>
              <Link href="/#reservations" className="hover:text-spice transition-colors">Reservations</Link>
            </li>
            <li>
              <Link href="/referrals" className="hover:text-spice transition-colors">Referrals & Rewards</Link>
            </li>
          </ul>
        </div>

        {/* Operating Hours */}
        <div>
          <h4 className="font-display text-sm text-cream tracking-wider uppercase mb-6">
            Hours of Service
          </h4>
          <ul className="space-y-3 font-body text-xs md:text-sm font-light leading-relaxed">
            <li>
              <span className="text-cream font-medium block">Monday – Friday</span>
              12:00 PM – 3:30 PM <br />
              7:00 PM – 11:00 PM
            </li>
            <li>
              <span className="text-cream font-medium block">Saturday – Sunday</span>
              12:00 PM – 4:00 PM <br />
              7:00 PM – 11:30 PM
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="font-display text-sm text-cream tracking-wider uppercase mb-6">
            Visit Us
          </h4>
          <ul className="space-y-4 font-body text-xs md:text-sm font-light">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-spice shrink-0 mt-0.5" />
              <span>12, Kasturba Gandhi Marg, Connaught Place, New Delhi, 110001</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-spice shrink-0" />
              <span className="font-mono">+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-spice shrink-0" />
              <span>contact@rasoihouse.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-border/40 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-body text-xs">
        <span>© {new Date().getFullYear()} Rasoi House. All Rights Reserved.</span>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-spice transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-spice transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
