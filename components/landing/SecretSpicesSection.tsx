"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

const SPOTLIGHT_R = 260;

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
  opacity: number;
}

function RevealLayer({ image, cursorX, cursorY, opacity }: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maskUrl, setMaskUrl] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redraw mask on cursor or dimension change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Only draw gradient if cursor coordinates are on screen
    if (cursorX !== -999 && cursorY !== -999) {
      const gradient = ctx.createRadialGradient(
        cursorX,
        cursorY,
        0,
        cursorX,
        cursorY,
        SPOTLIGHT_R
      );

      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.4, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.75)");
      gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.4)");
      gradient.addColorStop(0.88, "rgba(255, 255, 255, 0.12)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
      ctx.fill();
    }

    try {
      const url = canvas.toDataURL();
      setMaskUrl(url);
    } catch (e) {
      console.error("Canvas toDataURL failed: ", e);
    }
  }, [cursorX, cursorY, dimensions]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-30 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: "none" }}
      />
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{
          backgroundImage: `url(${image})`,
          maskImage: maskUrl ? `url(${maskUrl})` : "none",
          WebkitMaskImage: maskUrl ? `url(${maskUrl})` : "none",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          opacity: opacity,
          transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}

export default function SecretSpicesSection() {
  const BG_IMAGE_1 = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1600&auto=format&fit=crop";
  const BG_IMAGE_2 = "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1600&auto=format&fit=crop";

  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate coordinates relative to the viewport/window for canvas alignment
      // since the canvas covers the full viewport/window height
      mouse.current = {
        x: e.clientX,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      mouse.current = { x: -999, y: -999 };
      smooth.current = { x: -999, y: -999 };
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    const tick = () => {
      if (mouse.current.x !== -999) {
        if (smooth.current.x === -999) {
          smooth.current = { ...mouse.current };
        } else {
          smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
          smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
        }
        setCursorPos({ x: smooth.current.x, y: smooth.current.y });
      } else {
        setCursorPos({ x: -999, y: -999 });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black select-none"
      style={{ height: "80vh", minHeight: "600px" }}
    >
      {/* Base Spices Image Layer */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom brightness-[0.4]"
        style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
      />

      {/* Spotlight Reveal Layer showing Cooked Biryani */}
      <RevealLayer
        image={BG_IMAGE_2}
        cursorX={cursorPos.x}
        cursorY={cursorPos.y}
        opacity={isHovered ? 1 : 0}
      />

      {/* Dark tint overlay for ambient contrast */}
      <div className="absolute inset-0 bg-black/35 z-20 pointer-events-none" />

      {/* Floating Sparkle Hint Icon when not hovered */}
      {!isHovered && (
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-40 pointer-events-none flex flex-col items-center gap-3 text-turmeric/85 animate-bounce">
          <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: "6s" }} />
          <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF0DC] drop-shadow-md">
            Hover to reveal our secrets
          </span>
        </div>
      )}

      {/* Section Content */}
      <div className="absolute inset-0 z-40 flex flex-col justify-between p-8 md:p-16 pointer-events-none">
        
        {/* Top Header Label */}
        <div className="flex items-center gap-2 self-center md:self-start bg-black/55 backdrop-blur-md px-4 py-1.5 rounded-full border border-turmeric/35">
          <span className="w-2 h-2 rounded-full bg-turmeric animate-pulse" />
          <span className="font-body text-[10px] md:text-xs text-[#FAF0DC] font-medium uppercase tracking-[0.15em]">
            Culinary Alchemy
          </span>
        </div>

        {/* Center Main Heading */}
        <div className="flex flex-col items-center text-center my-auto px-4 max-w-4xl mx-auto">
          <h2 className="text-white leading-[1.05] tracking-tight">
            <span className="block font-display italic font-normal text-5xl sm:text-7xl md:text-8xl text-turmeric/95 hero-anim hero-reveal">
              Spices hold
            </span>
            <span className="block font-body font-bold text-5xl sm:text-7xl md:text-8xl -mt-1 text-white hero-anim hero-reveal" style={{ animationDelay: "0.2s" }}>
              tales of taste
            </span>
          </h2>
        </div>

        {/* Bottom Metadata & CTA Row */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 w-full">
          {/* Bottom-left description */}
          <div className="hidden md:block max-w-[320px] hero-anim hero-fade" style={{ animationDelay: "0.4s" }}>
            <p className="font-body text-xs md:text-sm text-[#FAF0DC]/85 leading-relaxed drop-shadow-sm">
              Every blend of roasted cardamom, cinnamon, and hand-ground turmeric records a chapter of our family legacy, layered over three generations of cooking.
            </p>
          </div>

          {/* Bottom-right CTA block */}
          <div className="max-w-[320px] flex flex-col items-center md:items-end gap-4 hero-anim hero-fade" style={{ animationDelay: "0.55s" }}>
            <p className="font-body text-center md:text-right text-xs text-[#FAF0DC]/80 leading-relaxed drop-shadow-sm">
              Our interactive kitchen lets you peel back the layers to see how raw organic ingredients combine to shape our signature heritage dishes.
            </p>
            <Link
              href="/menu"
              className="pointer-events-auto bg-spice hover:bg-spice-light text-white text-xs md:text-sm font-semibold px-6 py-2.5 rounded-full transition-all hover:scale-[1.05] active:scale-95 hover:shadow-lg hover:shadow-spice/30 flex items-center gap-1.5"
            >
              Order Signature Dishes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
