import type { Metadata } from "next";
import { Yeseva_One, Poppins, Noto_Sans_Devanagari, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

const yesevaOne = Yeseva_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yeseva-one",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  weight: ["300", "400", "500", "600"],
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rasoi House | Authentic Indian Fine Dining Kitchen",
  description: "Experience premium Indian dining. Culturally-rooted recipes with three generations of family secrets. Pure veg & Jain options available.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${yesevaOne.variable} ${poppins.variable} ${notoDevanagari.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-mahogany text-cream antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
