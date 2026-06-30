import Header from "@/components/layout/Header";
import HeroSection from "@/components/landing/HeroSection";
import FoodShowcaseSlider from "@/components/landing/FoodShowcaseSlider";
import FeaturesSection from "@/components/landing/FeaturesSection";
import MenuCategoriesSection from "@/components/landing/MenuCategoriesSection";
import OurStorySection from "@/components/landing/OurStorySection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ReferralBannerSection from "@/components/landing/ReferralBannerSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      {/* Scroll-responsive Nav Header */}
      <Header />

      <main className="flex-grow">
        {/* Full Viewport Hero Slider */}
        <HeroSection />

        {/* Feature Highlights Grid */}
        <FeaturesSection />

        {/* Bestseller Food Showcase Slider */}
        <FoodShowcaseSlider />

        {/* Asymmetric Our Story Heritage Section */}
        <OurStorySection />

        {/* Swiper Menu Categories Grid */}
        <MenuCategoriesSection />

        {/* Testimonials Review Slider */}
        <TestimonialsSection />

        {/* Terracotta Referral rewards section */}
        <ReferralBannerSection />

        {/* Royal Table Reservations Section */}
        <CTASection />
      </main>

      {/* Brand Footer */}
      <Footer />
    </div>
  );
}
