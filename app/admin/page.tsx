"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  User, ShoppingBag, TrendingUp, DollarSign, Check, X, AlertCircle, 
  Filter, Clock, ArrowUpRight, Shield, ShieldOff, Edit3, Search, Play
} from "lucide-react";
import CODToggle from "@/components/admin/CODToggle";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  totalPoints: number;
  codEnabled: boolean;
  maxCodAmount: number;
  totalOrders: number;
  monthlyOrderBill: number;
  lastMonthOrders: number;
}

interface Order {
  id: string;
  user_id: string;
  status: "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  payment_method: "cod" | "stripe" | "online";
  payment_method_type?: string | null;
  payment_status: string;
  total_amount: number;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  
  // Page authentication and loading state
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Dashboard Tabs: 'overview' or 'customers'
  const [activeTab, setActiveTab] = useState<"overview" | "customers">("overview");

  // API Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    orders_today: 0,
    revenue_today: 0,
    new_customers_today: 0,
    pending_orders: 0,
  });

  // UI interaction states
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [globalCodModal, setGlobalCodModal] = useState<{ show: boolean; enable: boolean }>({ show: false, enable: false });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);
  
  // Check auth first
  useEffect(() => {
    async function verifyAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (res.ok && json.authenticated && json.user.role === "admin") {
          setIsAdmin(true);
        } else {
          router.push("/login?error=unauthorized");
        }
      } catch (e) {
        router.push("/login?error=unauthorized");
      } finally {
        setAuthLoading(false);
      }
    }
    verifyAdmin();
  }, [router]);

  // Load dashboard dataset
  const fetchDashboardData = async () => {
    if (!isAdmin) return;
    setLoadingData(true);
    try {
      // 1. Fetch stats
      const statsRes = await fetch("/api/admin/stats");
      const statsJson = await statsRes.json();
      if (statsRes.ok && statsJson.success) {
        setStats(statsJson.data);
      }

      // 2. Fetch customers
      const custRes = await fetch("/api/admin/customers");
      const custJson = await custRes.json();
      if (custRes.ok && custJson.success) {
        setCustomers(custJson.data.customers);
      }

      // 3. Fetch orders
      const ordRes = await fetch("/api/admin/orders");
      const ordJson = await ordRes.json();
      if (ordRes.ok && ordJson.success) {
        setOrders(ordJson.data);
      }
    } catch (error) {
      console.error("Failed to load admin dashboard data", error);
      showToast("Error loading metrics. Reconnecting...", "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Enable/Disable COD Globally API
  const handleToggleGlobalCod = async (enable: boolean) => {
    setGlobalCodModal({ show: false, enable: false });
    showToast(`${enable ? "Enabling" : "Disabling"} COD for all accounts...`, "success");
    try {
      const res = await fetch("/api/admin/settings/global-cod", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod_enabled: enable, max_cod_amount: 1000 }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.data.message, "success");
        // Refetch to reflect changes
        fetchDashboardData();
      } else {
        throw new Error(json.error?.message || "Failed to update global settings.");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Modify individual customer COD setting in local state on successful patch from CODToggle
  const handleUpdateCustomerCodSettings = (userId: string, codEnabled: boolean, maxCodAmount: number) => {
    setCustomers(prev => 
      prev.map(c => c.id === userId ? { ...c, codEnabled, maxCodAmount } : c)
    );
  };

  // Advance Order Status API
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Order ${orderId} updated to ${nextStatus.toUpperCase()}`, "success");
        fetchDashboardData();
      } else {
        throw new Error(json.error?.message || "Failed to update status.");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Filter lists
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ? true : o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate monthly stats based on loaded orders
  const totalMonthlyBilling = orders
    .filter(o => o.status !== "cancelled" && o.status === "delivered")
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Hourly/daily rate analytics mock (SVG coordinates)
  // Let's generate a waving line based on seeded orders (we have June and July orders)
  const linePoints = "50,150 150,120 250,180 350,90 450,140 550,60 650,110 750,50";

  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-mahogany flex flex-col items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-spice mb-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="font-display text-cream animate-pulse text-sm uppercase tracking-widest">Verifying Royal Clearance...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-mahogany relative">
      <Header />

      {/* Glassmorphic Toast Alerts */}
      <AnimatePresence>
        {toast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl px-6 py-3 rounded-full flex items-center gap-2.5 text-xs md:text-sm font-medium border text-cream ${
              toast.type === "success"
                ? "bg-forest border-forest/30"
                : "bg-red-950 border-red-900/60 text-red-200"
            }`}
          >
            {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-spice uppercase text-xs font-semibold tracking-widest mb-1.5">
                <Shield size={14} className="text-turmeric animate-pulse" />
                Restaurant Administrative Portal
              </div>
              <h1 className="font-display text-4xl text-cream tracking-wide">
                Rasoi House Control
              </h1>
              <span className="font-devanagari text-base text-cream-muted tracking-wide mt-0.5 block">
                शाही प्रबंधन और ई-कॉमर्स डैशबोर्ड
              </span>
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => setGlobalCodModal({ show: true, enable: true })}
                className="bg-forest/10 border border-forest/40 text-cream px-4 py-2.5 rounded text-xs font-semibold hover:bg-forest/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check size={14} className="text-forest" />
                Enable COD for All
              </button>
              <button
                onClick={() => setGlobalCodModal({ show: true, enable: false })}
                className="bg-red-950/20 border border-red-900/40 text-cream px-4 py-2.5 rounded text-xs font-semibold hover:bg-red-950/40 active:scale-95 transition-all flex items-center gap-2"
              >
                <X size={14} className="text-red-400" />
                Disable COD for All
              </button>
              <button
                onClick={fetchDashboardData}
                className="bg-mahogany-surface border border-border text-cream px-4 py-2.5 rounded text-xs font-semibold hover:bg-border/20 transition-all"
              >
                Reload Data
              </button>
            </div>
          </div>

          {/* Stats Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Metric 1: Monthly billing */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="card-warm p-6 border border-border bg-mahogany-card shadow-lg flex items-center gap-4 relative overflow-hidden"
            >
              <div className="p-3 bg-spice/10 text-spice rounded-lg">
                <DollarSign size={24} />
              </div>
              <div>
                <span className="text-[10px] text-cream-muted uppercase font-bold tracking-wider">Monthly Revenue</span>
                <h3 className="text-2xl font-display text-cream font-bold mt-1">₹{totalMonthlyBilling.toLocaleString()}</h3>
                <span className="text-[9px] text-forest flex items-center gap-0.5 mt-0.5 font-semibold">
                  <ArrowUpRight size={10} /> +24% vs last month
                </span>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.03] text-cream scale-150 transform translate-x-2 translate-y-2 pointer-events-none">
                <DollarSign size={80} />
              </div>
            </motion.div>

            {/* Metric 2: Total orders */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="card-warm p-6 border border-border bg-mahogany-card shadow-lg flex items-center gap-4 relative overflow-hidden"
            >
              <div className="p-3 bg-turmeric/10 text-turmeric rounded-lg">
                <ShoppingBag size={24} />
              </div>
              <div>
                <span className="text-[10px] text-cream-muted uppercase font-bold tracking-wider">Total Orders</span>
                <h3 className="text-2xl font-display text-cream font-bold mt-1">{orders.length}</h3>
                <span className="text-[9px] text-cream-muted/70 mt-0.5 block font-mono">
                  {stats.pending_orders} awaiting dispatch
                </span>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.03] text-cream scale-150 transform translate-x-2 translate-y-2 pointer-events-none">
                <ShoppingBag size={80} />
              </div>
            </motion.div>

            {/* Metric 3: Ordering Rate */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="card-warm p-6 border border-border bg-mahogany-card shadow-lg flex items-center gap-4 relative overflow-hidden"
            >
              <div className="p-3 bg-forest/10 text-forest rounded-lg">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-[10px] text-cream-muted uppercase font-bold tracking-wider">Ordering Rate</span>
                <h3 className="text-2xl font-display text-cream font-bold mt-1">
                  {(orders.length / 30).toFixed(1)} <span className="text-xs font-sans text-cream-muted font-normal">/ day</span>
                </h3>
                <span className="text-[9px] text-forest flex items-center gap-0.5 mt-0.5 font-semibold">
                  <ArrowUpRight size={10} /> Stable growth trend
                </span>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.03] text-cream scale-150 transform translate-x-2 translate-y-2 pointer-events-none">
                <TrendingUp size={80} />
              </div>
            </motion.div>

            {/* Metric 4: Total customers */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="card-warm p-6 border border-border bg-mahogany-card shadow-lg flex items-center gap-4 relative overflow-hidden"
            >
              <div className="p-3 bg-cream-muted/10 text-cream-muted rounded-lg">
                <User size={24} />
              </div>
              <div>
                <span className="text-[10px] text-cream-muted uppercase font-bold tracking-wider">Total Customers</span>
                <h3 className="text-2xl font-display text-cream font-bold mt-1">{customers.length}</h3>
                <span className="text-[9px] text-turmeric mt-0.5 block font-semibold">
                  {stats.new_customers_today} registered today
                </span>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.03] text-cream scale-150 transform translate-x-2 translate-y-2 pointer-events-none">
                <User size={80} />
              </div>
            </motion.div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex border-b border-border/40 gap-6 mb-8 text-sm font-semibold">
            <button
              onClick={() => { setActiveTab("overview"); setSearchQuery(""); }}
              className={`pb-4 transition-all relative ${
                activeTab === "overview" ? "text-turmeric" : "text-cream-muted hover:text-cream"
              }`}
            >
              Overview & Analytics
              {activeTab === "overview" && (
                <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-turmeric" />
              )}
            </button>
            <button
              onClick={() => { setActiveTab("customers"); setSearchQuery(""); }}
              className={`pb-4 transition-all relative ${
                activeTab === "customers" ? "text-turmeric" : "text-cream-muted hover:text-cream"
              }`}
            >
              Customer Settings & COD Limits
              {activeTab === "customers" && (
                <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-turmeric" />
              )}
            </button>
          </div>

          {/* Search/Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted/50" />
              <input
                type="text"
                placeholder={activeTab === "overview" ? "Search by order number or customer name..." : "Search by name, email, or phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-mahogany-surface border border-border rounded pl-10 pr-4 py-2 text-xs text-cream placeholder-cream-muted/40 focus:border-spice focus:outline-none transition-colors"
              />
            </div>

            {activeTab === "overview" && (
              <div className="flex items-center gap-2 text-xs text-cream-muted font-medium shrink-0">
                <Filter size={14} className="text-cream-muted/60" />
                <span>Filter status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-mahogany-surface border border-border rounded px-3 py-1.5 text-xs text-cream focus:outline-none focus:border-spice"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: Overview & Analytics */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Graphic Chart Panel */}
              <div className="card-warm p-6 border border-border bg-mahogany-card shadow-xl relative overflow-hidden">
                <h3 className="font-display text-lg text-cream tracking-wide mb-4">
                  Daily Ordering Rate Analytics
                </h3>
                
                {/* Framer Motion Animated SVG Chart */}
                <div className="relative w-full h-[220px] bg-mahogany-surface/40 rounded-lg p-4 border border-border/20">
                  <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D25C27" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#D25C27" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {/* Gradient fill path */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d={`M 50,200 L ${linePoints} L 750,200 Z`}
                      fill="url(#chartGradient)"
                    />

                    {/* Waving line path */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d={`M ${linePoints}`}
                      fill="none"
                      stroke="#D25C27"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive points */}
                    {linePoints.split(" ").map((pt, idx) => {
                      const [x, y] = pt.split(",");
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="5.5"
                          className="fill-turmeric stroke-mahogany cursor-pointer hover:r-7 transition-all"
                        />
                      );
                    })}
                  </svg>
                  
                  {/* Axis labels */}
                  <div className="flex justify-between text-[9px] text-cream-muted/50 mt-1 font-mono uppercase font-semibold">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              {/* Interactive Ordering Log Table */}
              <div className="card-warm border border-border bg-mahogany-card shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-border/40 flex items-center justify-between">
                  <h3 className="font-display text-lg text-cream tracking-wide">
                    Live Ordering History Log
                  </h3>
                  <span className="text-xs text-cream-muted font-mono">{filteredOrders.length} records resolved</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border/40 text-cream-muted font-medium uppercase tracking-wider text-[10px] bg-mahogany-surface/40 select-none">
                        <th className="py-4 pl-6">Order Code</th>
                        <th className="py-4">User Details</th>
                        <th className="py-4">Status & Action</th>
                        <th className="py-4">Billing</th>
                        <th className="py-4">Method</th>
                        <th className="py-4 pr-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 font-light">
                      {loadingData ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-cream-muted font-light animate-pulse">
                            Accessing registry transactions...
                          </td>
                        </tr>
                      ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((ord) => {
                          const dateStr = new Date(ord.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          });
                          
                          // Style based on status
                          let badgeStyle = "bg-yellow-950/20 text-yellow-300 border-yellow-800/40";
                          if (ord.status === "delivered") badgeStyle = "bg-forest/10 text-forest border-forest/30";
                          if (ord.status === "cancelled") badgeStyle = "bg-red-950/20 text-red-300 border-red-900/60";
                          if (ord.status === "preparing") badgeStyle = "bg-spice/10 text-spice border-spice/30";
                          if (ord.status === "out_for_delivery") badgeStyle = "bg-turmeric/10 text-turmeric border-turmeric/30";

                          return (
                            <tr key={ord.id} className="hover:bg-mahogany-surface/20">
                              <td className="py-5 pl-6 font-mono font-semibold text-cream">
                                {ord.id}
                              </td>
                              <td className="py-5">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-cream">{ord.profiles?.full_name || "Guest User"}</span>
                                  <span className="text-[10px] text-cream-muted font-mono">{ord.profiles?.email}</span>
                                </div>
                              </td>
                              <td className="py-5">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border tracking-wider ${badgeStyle}`}>
                                    {ord.status}
                                  </span>

                                  {/* Advancing Status Quick Controls */}
                                  {["pending", "confirmed", "preparing", "out_for_delivery"].includes(ord.status) && (
                                    <button
                                      onClick={() => {
                                        const nextMap: Record<string, string> = {
                                          pending: "confirmed",
                                          confirmed: "preparing",
                                          preparing: "out_for_delivery",
                                          out_for_delivery: "delivered"
                                        };
                                        handleUpdateOrderStatus(ord.id, nextMap[ord.status]);
                                      }}
                                      className="p-1 rounded bg-spice/10 text-spice hover:bg-spice/20 transition-colors"
                                      title="Advance order status"
                                    >
                                      <Play size={10} className="fill-current" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-5 font-mono text-cream font-semibold">
                                ₹{ord.total_amount}
                              </td>
                              <td className="py-5">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-cream uppercase font-mono text-[10px]">
                                    {ord.payment_method === "cod" ? "Cash" : "Stripe"}
                                  </span>
                                  <span className="text-[10px] text-cream-muted font-mono capitalize">
                                    {ord.payment_status}
                                  </span>
                                </div>
                              </td>
                              <td className="py-5 pr-6 font-mono text-cream-muted text-xs">
                                {dateStr}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-cream-muted font-light">
                            No orders match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Customer Settings & COD Limits */}
          {activeTab === "customers" && (
            <div className="card-warm border border-border bg-mahogany-card shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-border/40 flex items-center justify-between">
                <h3 className="font-display text-lg text-cream tracking-wide">
                  Customer Directory & Payment Control
                </h3>
                <span className="text-xs text-cream-muted font-mono">{filteredCustomers.length} registered profiles</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-cream-muted font-medium uppercase tracking-wider text-[10px] bg-mahogany-surface/40 select-none">
                      <th className="py-4 pl-6">Customer Details</th>
                      <th className="py-4">Order Activity</th>
                      <th className="py-4">Verification Status</th>
                      <th className="py-4">Monthly Spending</th>
                      <th className="py-4 text-center pr-6">Cash On Delivery (COD) Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-light">
                    {loadingData ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-cream-muted font-light animate-pulse">
                          Accessing user directories...
                        </td>
                      </tr>
                    ) : filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => {
                        const isBothVerified = cust.emailVerified && cust.phoneVerified;
                        return (
                          <tr key={cust.id} className="hover:bg-mahogany-surface/20">
                            {/* Details */}
                            <td className="py-5 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-spice/10 border border-spice/20 flex items-center justify-center text-spice font-display font-semibold text-sm">
                                  {cust.name.slice(0, 1)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-cream text-base flex items-center gap-2">
                                    {cust.name}
                                    {/* Highlight last month's active customers */}
                                    {cust.lastMonthOrders > 0 && (
                                      <span className="text-[9px] bg-turmeric/10 text-turmeric px-1.5 py-0.5 rounded font-bold uppercase border border-turmeric/20 animate-pulse">
                                        Last Month Active
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-cream-muted text-xs font-mono">{cust.email}</span>
                                  <span className="text-cream-muted text-xs font-mono">+91 {cust.phone}</span>
                                </div>
                              </div>
                            </td>

                            {/* Orders Activity */}
                            <td className="py-5 font-mono text-cream font-medium">
                              <div className="flex flex-col">
                                <span className="font-semibold">{cust.totalOrders} Orders</span>
                                <span className="text-[10px] text-cream-muted">{cust.lastMonthOrders} last month</span>
                              </div>
                            </td>

                            {/* Verification */}
                            <td className="py-5">
                              <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-xs text-cream-muted font-light">
                                  <span>{cust.emailVerified ? "🟢" : "🔴"}</span>
                                  Email Verified
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-cream-muted font-light">
                                  <span>{cust.phoneVerified ? "🟢" : "🔴"}</span>
                                  Phone Verified
                                </span>
                                {!isBothVerified && (
                                  <span className="text-[9px] text-turmeric mt-0.5 font-bold flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    Bypassed Verification
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Monthly bill */}
                            <td className="py-5 font-mono text-cream font-semibold text-base">
                              {cust.monthlyOrderBill > 0 ? (
                                <span className="text-turmeric font-bold">₹{cust.monthlyOrderBill}</span>
                              ) : (
                                <span className="text-cream-muted font-light">₹0</span>
                              )}
                            </td>

                            {/* COD Control switch */}
                            <td className="py-5 pr-6 text-center">
                              <CODToggle
                                userId={cust.id}
                                codEnabled={cust.codEnabled}
                                maxCodAmount={cust.maxCodAmount}
                                customerName={cust.name}
                                onUpdate={handleUpdateCustomerCodSettings}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-cream-muted font-light">
                          No customer profiles match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />

      {/* Global COD Modal Confirmation Dialog */}
      <AnimatePresence>
        {globalCodModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-mahogany/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="card-warm p-8 bg-mahogany-card border border-border w-full max-w-md shadow-2xl relative"
            >
              <div className="flex items-center gap-3 text-turmeric mb-4">
                <AlertCircle size={24} />
                <h3 className="font-display text-xl text-cream tracking-wide">
                  Global Configuration Toggle
                </h3>
              </div>
              <p className="font-body text-xs text-cream-muted leading-relaxed font-light mb-6">
                Are you sure you want to {globalCodModal.enable ? "ENABLE" : "DISABLE"} Cash on Delivery for{" "}
                <strong className="text-cream font-semibold">ALL registered customer profiles</strong> in the database?
                This action overrides all individual user settings.
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setGlobalCodModal({ show: false, enable: false })}
                  className="flex-1 border border-border text-cream py-3 rounded-sm text-sm font-semibold hover:border-spice hover:text-spice transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGlobalCod(globalCodModal.enable)}
                  className="flex-1 bg-spice text-cream py-3 rounded-sm text-sm font-semibold hover:bg-spice-light transition-colors"
                >
                  Confirm Toggle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
