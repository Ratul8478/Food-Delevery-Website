"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Search, Flame, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";

interface MenuItem {
  id: string;
  name: string;
  nameHindi: string;
  category: string; // starters, breads, main-course, rice-biryani, desserts, beverages
  description: string;
  price: number;
  discountPrice?: number;
  isVeg: boolean;
  spiceLevel: number;
  isAvailable: boolean;
  image: string;
}

const allMenuItems: MenuItem[] = [
  // Starters
  {
    id: "1",
    name: "Paneer Tikka",
    nameHindi: "पनीर टिक्का",
    category: "starters",
    description: "Cottage cheese cubes marinated in yogurt and spices, grilled in a clay oven.",
    price: 289,
    isVeg: true,
    spiceLevel: 3,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Chicken Seekh Kebab",
    nameHindi: "मटन सीख कबाब",
    category: "starters",
    description: "Skewered minced chicken blended with aromatic herbs and grilled to perfection.",
    price: 349,
    discountPrice: 299,
    isVeg: false,
    spiceLevel: 4,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Hara Bhara Kabab",
    nameHindi: "हरा भरा कबाब",
    category: "starters",
    description: "Crispy pan-fried patties made with spinach, green peas, and fresh cottage cheese.",
    price: 219,
    isVeg: true,
    spiceLevel: 2,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Samosa Duo",
    nameHindi: "समोसा",
    category: "starters",
    description: "Crispy pastry pyramids filled with seasoned mashed potatoes and green peas.",
    price: 149,
    discountPrice: 119,
    isVeg: true,
    spiceLevel: 2,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop",
  },
  // Breads
  {
    id: "5",
    name: "Butter Naan",
    nameHindi: "बटर नान",
    category: "breads",
    description: "Soft and fluffy leavened flatbread brushed with premium melted butter.",
    price: 89,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "6",
    name: "Tandoori Roti",
    nameHindi: "तन्दूरी रोटी",
    category: "breads",
    description: "Traditional whole wheat flatbread baked on the hot clay walls of the tandoor.",
    price: 49,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "7",
    name: "Garlic Naan",
    nameHindi: "लहसुन नान",
    category: "breads",
    description: "Leavened clay oven flatbread infused with chopped garlic and fresh coriander.",
    price: 109,
    discountPrice: 89,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=400&auto=format&fit=crop",
  },
  // Main Course
  {
    id: "8",
    name: "Paneer Butter Masala",
    nameHindi: "पनीर बटर मसाला",
    category: "main-course",
    description: "Soft paneer cubes cooked in a rich, creamy tomato gravy with butter and cream.",
    price: 389,
    isVeg: true,
    spiceLevel: 2,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "9",
    name: "Dal Makhani",
    nameHindi: "दाल मखनी",
    category: "main-course",
    description: "Slow-cooked black lentils simmered overnight with cream, butter, and tomatoes.",
    price: 329,
    isVeg: true,
    spiceLevel: 2,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "10",
    name: "Chicken Tikka Masala",
    nameHindi: "चिकन टिक्का मसाला",
    category: "main-course",
    description: "Tandoori grilled chicken chunks cooked in a spicy, creamy tomato-onion gravy.",
    price: 459,
    discountPrice: 399,
    isVeg: false,
    spiceLevel: 3,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "11",
    name: "Mutton Rogan Josh",
    nameHindi: "मटन रोगन जोश",
    category: "main-course",
    description: "Tender lamb chunks cooked in a rich Kashmiri gravy colored with red chiles and saffron.",
    price: 549,
    isVeg: false,
    spiceLevel: 4,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "12",
    name: "Chana Masala",
    nameHindi: "चना मसाला",
    category: "main-course",
    description: "Tangy chickpea curry cooked with onions, tomatoes, green chilies, and ground spices.",
    price: 249,
    isVeg: true,
    spiceLevel: 3,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400&auto=format&fit=crop",
  },
  // Rice & Biryani
  {
    id: "13",
    name: "Veg Dum Biryani",
    nameHindi: "वेज दम बिरयानी",
    category: "rice-biryani",
    description: "Fragrant basmati rice layered with mixed vegetables, herbs, and saffron, slow-cooked.",
    price: 349,
    discountPrice: 299,
    isVeg: true,
    spiceLevel: 3,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "14",
    name: "Chicken Dum Biryani",
    nameHindi: "चिकन दम बिरयानी",
    category: "rice-biryani",
    description: "Succulent chicken pieces layered with long grain basmati rice and saffron.",
    price: 429,
    isVeg: false,
    spiceLevel: 4,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "15",
    name: "Jeera Rice",
    nameHindi: "जीरा राइस",
    category: "rice-biryani",
    description: "Fluffy steamed basmati rice tempered with cumin seeds and pure ghee.",
    price: 179,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400&auto=format&fit=crop",
  },
  // Desserts
  {
    id: "16",
    name: "Gulab Jamun (2 Pcs)",
    nameHindi: "गुलाब जामुन",
    category: "desserts",
    description: "Golden fried milk dumplings soaked in a warm rose-scented cardamom sugar syrup.",
    price: 129,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "17",
    name: "Rasmalai (2 Pcs)",
    nameHindi: "रसमलाई",
    category: "desserts",
    description: "Flattened cottage cheese patties soaked in sweet, saffron-flavored thickened milk.",
    price: 159,
    discountPrice: 139,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "18",
    name: "Gajar Ka Halwa",
    nameHindi: "गाजर का हलवा",
    category: "desserts",
    description: "Rich dessert made by slow-cooking grated carrots with milk, ghee, sugar, and dried fruits.",
    price: 189,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400&auto=format&fit=crop",
  },
  // Beverages
  {
    id: "19",
    name: "Masala Chai",
    nameHindi: "मसाला चाय",
    category: "beverages",
    description: "Brewed black tea infused with milk and a blend of aromatic spices.",
    price: 79,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "20",
    name: "Mango Lassi",
    nameHindi: "मैंगो लस्सी",
    category: "beverages",
    description: "Creamy, yogurt-based drink blended with fresh mango pulp and sweet syrup.",
    price: 119,
    discountPrice: 99,
    isVeg: true,
    spiceLevel: 1,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400&auto=format&fit=crop",
  },
];

const categories = [
  { slug: "all", name: "All Dishes" },
  { slug: "starters", name: "Starters" },
  { slug: "breads", name: "Breads" },
  { slug: "main-course", name: "Main Course" },
  { slug: "rice-biryani", name: "Rice & Biryani" },
  { slug: "desserts", name: "Desserts" },
  { slug: "beverages", name: "Beverages" },
];

function MenuContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const { addToCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [spiceFilter, setSpiceFilter] = useState<number | null>(null);

  // Sync category if URL parameter changes
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  // Filter logic
  const filteredItems = allMenuItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.nameHindi.includes(searchQuery) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet = dietFilter === "all" || 
                        (dietFilter === "veg" && item.isVeg) || 
                        (dietFilter === "non-veg" && !item.isVeg);
    const matchesSpice = spiceFilter === null || item.spiceLevel === spiceFilter;

    return matchesCategory && matchesSearch && matchesDiet && matchesSpice;
  });

  return (
    <div className="flex flex-col min-h-screen bg-mahogany">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header Description */}
          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl text-cream tracking-wide">
              Culinary Menu
            </h1>
            <span className="font-devanagari text-base text-cream-muted tracking-wide mt-1 block">
              हमारी भोजन सूची
            </span>
          </div>

          {/* Filtering Tools Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* STICKY LEFT COLUMN: Categories Sidebar */}
            <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-2">
              <h3 className="font-display text-lg text-cream tracking-wide mb-4 pl-3">
                Categories
              </h3>
              <div className="flex flex-row overflow-x-auto lg:flex-col gap-1 pb-4 lg:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`font-body text-sm text-left px-4 py-3 rounded-md font-medium transition-all shrink-0 ${
                      selectedCategory === cat.slug
                        ? "bg-spice text-cream shadow-md"
                        : "text-cream-muted hover:text-cream hover:bg-mahogany-surface"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Search + Filters + Dishes Grid */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Search Bar & Toggles bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-mahogany-surface border border-border p-4 rounded-xl">
                
                {/* Search Input */}
                <div className="md:col-span-6 relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted/50" />
                  <input
                    type="text"
                    placeholder="Search dishes or Hindi names..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-mahogany border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-cream placeholder-cream-muted/40 focus:border-spice focus:outline-none transition-colors"
                  />
                </div>

                {/* Diet toggles */}
                <div className="md:col-span-3 flex bg-mahogany border border-border rounded-md p-1">
                  {(["all", "veg", "non-veg"] as const).map((diet) => (
                    <button
                      key={diet}
                      onClick={() => setDietFilter(diet)}
                      className={`flex-1 text-center font-body text-xs font-semibold py-1.5 rounded-sm capitalize transition-all ${
                        dietFilter === diet
                          ? "bg-mahogany-card text-cream shadow-sm"
                          : "text-cream-muted hover:text-cream"
                      }`}
                    >
                      {diet === "all" ? "All" : diet === "veg" ? "Veg 🟢" : "Non 🔴"}
                    </button>
                  ))}
                </div>

                {/* Spice filter */}
                <div className="md:col-span-3 flex items-center justify-between gap-1.5 bg-mahogany border border-border rounded-md px-3 py-1.5">
                  <span className="font-body text-xs text-cream-muted">Spice</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSpiceFilter(spiceFilter === lvl ? null : lvl)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          spiceFilter === lvl
                            ? "bg-spice text-cream scale-110"
                            : "bg-mahogany-surface text-cream-muted hover:text-cream"
                        }`}
                      >
                        <Flame size={10} className={spiceFilter === lvl ? "fill-cream" : ""} />
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Grid of Menu Items */}
              <AnimatePresence mode="popLayout">
                {filteredItems.length > 0 ? (
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="card-warm overflow-hidden border border-border group hover:border-spice/30 transition-all select-none"
                      >
                        {/* Image section */}
                        <div className="aspect-[4/3] relative w-full overflow-hidden bg-mahogany-surface">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          
                          {/* Diet indicator badge */}
                          <div className="absolute top-3 left-3 z-10">
                            <div
                              className={`w-5 h-5 flex items-center justify-center border-2 ${
                                item.isVeg ? "border-forest" : "border-red-800"
                              } bg-mahogany-surface/80 p-0.5 rounded-sm`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? "bg-forest" : "bg-red-800"}`} />
                            </div>
                          </div>

                          {/* Spice indicator badge */}
                          <div className="absolute bottom-3 left-3 z-10 bg-mahogany-surface/75 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-0.5">
                            {[...Array(item.spiceLevel)].map((_, i) => (
                              <Flame key={i} size={11} className="fill-saffron text-saffron" />
                            ))}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="p-5 flex flex-col justify-between min-h-[170px]">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-body text-base font-semibold text-cream group-hover:text-turmeric transition-colors line-clamp-1">
                                {item.name}
                              </h3>
                              <span className="font-devanagari text-[10px] text-cream-muted text-right shrink-0">
                                {item.nameHindi}
                              </span>
                            </div>
                            <p className="font-body text-xs text-cream-muted font-light leading-relaxed line-clamp-2 mt-2">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-baseline gap-1.5">
                              {item.discountPrice ? (
                                <>
                                  <span className="font-mono text-lg font-bold text-turmeric">
                                    ₹{item.discountPrice}
                                  </span>
                                  <span className="font-mono text-xs text-cream-muted line-through">
                                    ₹{item.price}
                                  </span>
                                </>
                              ) : (
                                <span className="font-mono text-lg font-bold text-turmeric">
                                  ₹{item.price}
                                </span>
                              )}
                            </div>

                            <motion.button
                              onClick={() => addToCart(item)}
                              whileTap={{ scale: 0.8 }}
                              className="w-9 h-9 rounded-full bg-spice/15 text-spice hover:bg-spice hover:text-cream flex items-center justify-center transition-colors"
                            >
                              <Plus size={18} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <span className="text-4xl mb-4">🍽️</span>
                    <h4 className="font-display text-lg text-cream mb-1">No items match your filters</h4>
                    <p className="font-body text-xs text-cream-muted max-w-xs leading-relaxed">
                      Try clearing search parameters, widening spice filters, or picking a different category.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setDietFilter("all");
                        setSpiceFilter(null);
                        setSelectedCategory("all");
                      }}
                      className="mt-6 border border-border text-cream px-5 py-2 rounded-sm text-xs hover:border-spice hover:text-spice transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-mahogany flex items-center justify-center">
        <span className="font-display text-cream animate-pulse">Namaste...</span>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
