// Centralized in-memory Mock Database for development
// Simulates PostgreSQL tables and triggers when Supabase keys are not set.

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  email_verified: boolean;
  phone_verified: boolean;
  role: "admin" | "customer";
  referral_code: string;
  referred_by: string | null;
  total_points: number;
  discount_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_veg: boolean;
  is_jain: boolean;
  spiciness: number;
  rating: number;
}

export interface Category {
  id: string;
  name: string;
  hindi_name: string;
  description: string;
  image_url: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  menu_item_id: string;
  quantity: number;
  special_note: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  payment_method: "cod" | "stripe" | "online";
  payment_method_type?: "card" | "upi" | "netbanking" | "wallet" | null;
  payment_status: "pending" | "paid" | "failed" | "cod_pending" | "refunded";
  subtotal: number;
  discount_amount: number;
  tax: number;
  delivery_charge: number;
  total_amount: number;
  address_id: string;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_note: string | null;
}

export interface CustomerSettings {
  user_id: string;
  cod_enabled: boolean;
  max_cod_amount: number;
  cod_enabled_by: string | null;
  cod_enabled_at: string | null;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  status: "registered" | "ordered";
  points_earned: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Global persistence store matching serverless reloads
const globalDb = global as unknown as {
  profiles: Profile[];
  categories: Category[];
  menuItems: MenuItem[];
  carts: Record<string, string>; // user_id -> cart_id
  cartItems: CartItem[];
  orders: Order[];
  orderItems: OrderItem[];
  customerSettings: Record<string, CustomerSettings>;
  referrals: Referral[];
  notifications: Notification[];
};

// Seed initial mockup data if empty
if (!globalDb.categories) {
  globalDb.categories = [
    { id: "cat-1", name: "Starters", hindi_name: "स्टार्टर्स", description: "Clay-fired clay appetizers", image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=300" },
    { id: "cat-2", name: "Tandoor", hindi_name: "तन्दूर से", description: "Clay oven roasted breads and kebabs", image_url: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=300" },
    { id: "cat-3", name: "Main Course", hindi_name: "मुख्य भोजन", description: "Rich slow-cooked curries", image_url: "https://images.unsplash.com/photo-1545247181-516773cae76d?q=80&w=300" },
    { id: "cat-4", name: "Biryani", hindi_name: "बिरयानी", description: "Saffron infused dum rice", image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300" },
    { id: "cat-5", name: "Breads", hindi_name: "रोटी-नान", description: "Hand-pulled hot tandoor breads", image_url: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=200" },
    { id: "cat-6", name: "Desserts", hindi_name: "मीठा", description: "Sweet Indian delicacies", image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=300" },
  ];
}

if (!globalDb.menuItems) {
  globalDb.menuItems = [
    { id: "1", category_id: "cat-1", name: "Paneer Tikka", description: "Cottage cheese cubes marinated in yogurt and spices, grilled in a clay oven.", price: 289, image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 3, rating: 4.8 },
    { id: "2", category_id: "cat-1", name: "Chicken Seekh Kebab", description: "Skewered minced chicken blended with aromatic herbs and grilled to perfection.", price: 299, image_url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=400", is_available: true, is_veg: false, is_jain: false, spiciness: 4, rating: 4.7 },
    { id: "3", category_id: "cat-1", name: "Hara Bhara Kabab", description: "Crispy pan-fried patties made with spinach, green peas, and fresh cottage cheese.", price: 219, image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 2, rating: 4.6 },
    { id: "4", category_id: "cat-1", name: "Samosa Duo", description: "Crispy pastry pyramids filled with seasoned mashed potatoes and green peas.", price: 119, image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 2, rating: 4.5 },
    { id: "5", category_id: "cat-5", name: "Butter Naan", description: "Soft and fluffy leavened flatbread brushed with premium melted butter.", price: 89, image_url: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=400", is_available: true, is_veg: true, is_jain: false, spiciness: 1, rating: 4.7 },
    { id: "6", category_id: "cat-5", name: "Tandoori Roti", description: "Traditional whole wheat flatbread baked on the hot clay walls of the tandoor.", price: 49, image_url: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 1, rating: 4.6 },
    { id: "7", category_id: "cat-5", name: "Garlic Naan", description: "Leavened clay oven flatbread infused with chopped garlic and fresh coriander.", price: 89, image_url: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=400", is_available: true, is_veg: true, is_jain: false, spiciness: 1, rating: 4.7 },
    { id: "8", category_id: "cat-3", name: "Paneer Butter Masala", description: "Soft paneer cubes cooked in a rich, creamy tomato gravy with butter and cream.", price: 389, image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=400", is_available: true, is_veg: true, is_jain: false, spiciness: 2, rating: 4.85 },
    { id: "9", category_id: "cat-3", name: "Dal Makhani", description: "Slow-cooked black lentils simmered overnight with cream, butter, and tomatoes.", price: 329, image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400", is_available: true, is_veg: true, is_jain: false, spiciness: 2, rating: 4.9 },
    { id: "10", category_id: "cat-3", name: "Chicken Tikka Masala", description: "Tandoori grilled chicken chunks cooked in a spicy, creamy tomato-onion gravy.", price: 399, image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400", is_available: true, is_veg: false, is_jain: false, spiciness: 3, rating: 4.8 },
    { id: "11", category_id: "cat-3", name: "Mutton Rogan Josh", description: "Tender lamb chunks cooked in a rich Kashmiri gravy colored with red chiles and saffron.", price: 549, image_url: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?q=80&w=400", is_available: true, is_veg: false, is_jain: false, spiciness: 4, rating: 4.9 },
    { id: "12", category_id: "cat-3", name: "Chana Masala", description: "Tangy chickpea curry cooked with onions, tomatoes, green chilies, and ground spices.", price: 249, image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 3, rating: 4.75 },
    { id: "13", category_id: "cat-4", name: "Veg Dum Biryani", description: "Fragrant basmati rice layered with mixed vegetables, herbs, and saffron, slow-cooked.", price: 299, image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 3, rating: 4.8 },
    { id: "14", category_id: "cat-4", name: "Chicken Dum Biryani", description: "Succulent chicken pieces layered with long grain basmati rice and saffron.", price: 429, image_url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=400", is_available: true, is_veg: false, is_jain: false, spiciness: 4, rating: 4.85 },
    { id: "15", category_id: "cat-4", name: "Jeera Rice", description: "Fluffy steamed basmati rice tempered with cumin seeds and pure ghee.", price: 179, image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 1, rating: 4.7 },
    { id: "16", category_id: "cat-6", name: "Gulab Jamun (2 Pcs)", description: "Golden fried milk dumplings soaked in a warm rose-scented cardamom sugar syrup.", price: 129, image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 1, rating: 4.85 },
    { id: "17", category_id: "cat-6", name: "Rasmalai (2 Pcs)", description: "Flattened cottage cheese patties soaked in sweet, saffron-flavored thickened milk.", price: 139, image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 1, rating: 4.8 },
    { id: "18", category_id: "cat-6", name: "Gajar Ka Halwa", description: "Rich dessert made by slow-cooking grated carrots with milk, ghee, sugar, and dried fruits.", price: 189, image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 1, rating: 4.85 },
    { id: "19", category_id: "cat-6", name: "Masala Chai", description: "Brewed black tea infused with milk and a blend of aromatic spices.", price: 79, image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 1, rating: 4.6 },
    { id: "20", category_id: "cat-6", name: "Mango Lassi", description: "Creamy, yogurt-based drink blended with fresh mango pulp and sweet syrup.", price: 99, image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400", is_available: true, is_veg: true, is_jain: true, spiciness: 1, rating: 4.8 }
  ];
}

if (!globalDb.profiles) {
  globalDb.profiles = [
    {
      id: "usr_mock_123",
      full_name: "Rajesh Kumar",
      email: "rajesh.kumar@gmail.com",
      phone: "9876543210",
      email_verified: true,
      phone_verified: true,
      role: "admin",
      referral_code: "SPICE8Y2",
      referred_by: null,
      total_points: 1200,
      discount_tier: "silver",
      created_at: new Date().toISOString(),
    },
  ];
}

if (!globalDb.carts) {
  globalDb.carts = {
    usr_mock_123: "cart_mock_123",
  };
}

if (!globalDb.cartItems) {
  globalDb.cartItems = [
    { id: "citem-1", cart_id: "cart_mock_123", menu_item_id: "1", quantity: 2, special_note: "Less spicy please" },
    { id: "citem-2", cart_id: "cart_mock_123", menu_item_id: "5", quantity: 3, special_note: null },
  ];
}

if (!globalDb.orders) {
  globalDb.orders = [];
}

if (!globalDb.orderItems) {
  globalDb.orderItems = [];
}

if (!globalDb.customerSettings) {
  globalDb.customerSettings = {
    usr_mock_123: {
      user_id: "usr_mock_123",
      cod_enabled: false, // COD is disabled by default per rule
      max_cod_amount: 5000,
      cod_enabled_by: null,
      cod_enabled_at: null,
    },
  };
}

if (!globalDb.referrals) {
  globalDb.referrals = [];
}

if (!globalDb.notifications) {
  globalDb.notifications = [
    { id: "notif-1", user_id: "usr_mock_123", title: "Welcome to Rasoi House", message: "Namaste, explore our tandoor specialties!", is_read: false, created_at: new Date().toISOString() },
  ];
}

// DATABASE INTERFACE
export const mockDb = {
  // Profiles
  getProfile(id: string): Profile | null {
    return globalDb.profiles.find((p) => p.id === id) || null;
  },
  
  getProfileByEmail(email: string): Profile | null {
    return globalDb.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getProfileByPhone(phone: string): Profile | null {
    return globalDb.profiles.find((p) => p.phone === phone) || null;
  },

  getProfiles(): Profile[] {
    return globalDb.profiles;
  },

  upsertProfile(profile: Profile) {
    const idx = globalDb.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      globalDb.profiles[idx] = profile;
    } else {
      globalDb.profiles.push(profile);
    }
  },

  // Customer Settings
  getCustomerSettings(userId: string): CustomerSettings {
    if (!globalDb.customerSettings[userId]) {
      globalDb.customerSettings[userId] = {
        user_id: userId,
        cod_enabled: false,
        max_cod_amount: 5000,
        cod_enabled_by: null,
        cod_enabled_at: null,
      };
    }
    return globalDb.customerSettings[userId];
  },

  updateCustomerSettings(userId: string, settings: Partial<CustomerSettings>) {
    const current = this.getCustomerSettings(userId);
    globalDb.customerSettings[userId] = {
      ...current,
      ...settings,
    };
    return globalDb.customerSettings[userId];
  },

  // Categories
  getCategories(): Category[] {
    return globalDb.categories;
  },

  // Menu Items
  getMenuItems(): MenuItem[] {
    return globalDb.menuItems;
  },

  getMenuItem(id: string): MenuItem | null {
    return globalDb.menuItems.find((m) => m.id === id) || null;
  },

  upsertMenuItem(item: MenuItem) {
    const idx = globalDb.menuItems.findIndex((m) => m.id === item.id);
    if (idx >= 0) {
      globalDb.menuItems[idx] = item;
    } else {
      globalDb.menuItems.push(item);
    }
  },

  // Carts & Cart Items
  getCartId(userId: string): string {
    if (!globalDb.carts[userId]) {
      globalDb.carts[userId] = "cart_" + Math.random().toString(36).substr(2, 9);
    }
    return globalDb.carts[userId];
  },

  getCartItems(cartId: string): CartItem[] {
    return globalDb.cartItems.filter((i) => i.cart_id === cartId);
  },

  addCartItem(cartId: string, item: Omit<CartItem, "id" | "cart_id">): CartItem {
    const existing = globalDb.cartItems.find((i) => i.cart_id === cartId && i.menu_item_id === item.menu_item_id);
    if (existing) {
      existing.quantity += item.quantity;
      if (item.special_note) existing.special_note = item.special_note;
      return existing;
    }
    const newItem: CartItem = {
      id: "citem_" + Math.random().toString(36).substr(2, 9),
      cart_id: cartId,
      ...item,
    };
    globalDb.cartItems.push(newItem);
    return newItem;
  },

  updateCartItemQuantity(id: string, quantity: number): CartItem | null {
    const item = globalDb.cartItems.find((i) => i.id === id);
    if (item) {
      item.quantity = quantity;
      return item;
    }
    return null;
  },

  removeCartItem(id: string): boolean {
    const len = globalDb.cartItems.length;
    globalDb.cartItems = globalDb.cartItems.filter((i) => i.id !== id);
    return globalDb.cartItems.length < len;
  },

  clearCart(cartId: string) {
    globalDb.cartItems = globalDb.cartItems.filter((i) => i.cart_id !== cartId);
  },

  // Orders
  getOrders(userId?: string): Order[] {
    if (userId) {
      return globalDb.orders.filter((o) => o.user_id === userId);
    }
    return globalDb.orders;
  },

  getOrder(id: string): Order | null {
    return globalDb.orders.find((o) => o.id === id) || null;
  },

  getOrderItems(orderId: string): OrderItem[] {
    return globalDb.orderItems.filter((oi) => oi.order_id === orderId);
  },

  createOrder(order: Omit<Order, "id" | "created_at">, items: Omit<OrderItem, "id" | "order_id">[]): Order {
    const orderId = "ORD-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      id: orderId,
      created_at: new Date().toISOString(),
      ...order,
    };
    globalDb.orders.push(newOrder);

    items.forEach((item) => {
      globalDb.orderItems.push({
        id: "oi_" + Math.random().toString(36).substr(2, 9),
        order_id: orderId,
        ...item,
      });
    });

    return newOrder;
  },

  updateOrderStatus(id: string, status: Order["status"]): Order | null {
    const order = this.getOrder(id);
    if (order) {
      order.status = status;
      return order;
    }
    return null;
  },

  updateOrderPayment(id: string, paymentStatus: Order["payment_status"]): Order | null {
    const order = this.getOrder(id);
    if (order) {
      order.payment_status = paymentStatus;
      return order;
    }
    return null;
  },

  // Notifications
  getNotifications(userId: string): Notification[] {
    return globalDb.notifications.filter((n) => n.user_id === userId);
  },

  createNotification(userId: string, title: string, message: string): Notification {
    const newNotif: Notification = {
      id: "notif_" + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    globalDb.notifications.push(newNotif);
    return newNotif;
  },

  markNotificationAsRead(id: string): boolean {
    const notif = globalDb.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      return true;
    }
    return false;
  },

  markAllNotificationsRead(userId: string) {
    globalDb.notifications.forEach((n) => {
      if (n.user_id === userId) {
        n.is_read = true;
      }
    });
  },

  // Referrals
  getReferrals(referrerId: string): Referral[] {
    return globalDb.referrals.filter((r) => r.referrer_id === referrerId);
  },

  createReferral(referrerId: string, refereeId: string): Referral {
    const newRef: Referral = {
      id: "ref_" + Math.random().toString(36).substr(2, 9),
      referrer_id: referrerId,
      referee_id: refereeId,
      status: "registered",
      points_earned: 0,
      created_at: new Date().toISOString(),
    };
    globalDb.referrals.push(newRef);
    return newRef;
  },

  completeReferral(refereeId: string, points = 200) {
    const ref = globalDb.referrals.find((r) => r.referee_id === refereeId);
    if (ref) {
      ref.status = "ordered";
      ref.points_earned = points;
      
      // Update referrer's points
      const referrer = this.getProfile(ref.referrer_id);
      if (referrer) {
        referrer.total_points += points;
        // recalculate tier
        if (referrer.total_points >= 2000) referrer.discount_tier = "diamond";
        else if (referrer.total_points >= 1500) referrer.discount_tier = "platinum";
        else if (referrer.total_points >= 1000) referrer.discount_tier = "gold";
        else if (referrer.total_points >= 500) referrer.discount_tier = "silver";
      }
    }
  },
};
