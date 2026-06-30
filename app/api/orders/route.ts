import { NextResponse } from "next/server";
import { requireVerified } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const createOrderSchema = z.object({
  address_id: z.string().min(1, "Address is required"),
  payment_method: z.enum(["cod", "stripe"]),
  payment_method_type: z.enum(["card", "upi", "wallet"]).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// POST /api/orders: place order and reset active cart
export async function POST(request: Request) {
  try {
    const profile = await requireVerified(request);
    const body = await request.json();

    const parsed = createOrderSchema.parse(body);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    // 2. Fetch cart and resolve items
    let cartItems: any[] = [];
    let cartId = "";
    
    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", profile.id)
        .single();
      
      if (!cart) {
        return errorResponse("Shopping cart is empty.", 400, "EMPTY_CART");
      }
      cartId = cart.id;

      const { data: items } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          special_note,
          menu_items (
            id,
            name,
            price,
            is_available
          )
        `)
        .eq("cart_id", cart.id);
      
      cartItems = items || [];
    } else {
      cartId = mockDb.getCartId(profile.id);
      const items = mockDb.getCartItems(cartId);
      cartItems = items.map((item) => {
        const m = mockDb.getMenuItem(item.menu_item_id);
        return {
          id: item.id,
          quantity: item.quantity,
          special_note: item.special_note,
          menu_items: m,
        };
      });
    }

    if (cartItems.length === 0) {
      return errorResponse("Shopping cart is empty.", 400, "EMPTY_CART");
    }

    // 3. Compute calculations
    let subtotal = 0;
    const itemsSnapshot: any[] = [];

    for (const item of cartItems) {
      const dbItem = item.menu_items;
      if (!dbItem || !dbItem.is_available) {
        return errorResponse(`Item '${dbItem?.name || "Unknown"}' is no longer available.`, 400, "ITEM_UNAVAILABLE");
      }
      subtotal += dbItem.price * item.quantity;
      itemsSnapshot.push({
        menu_item_id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: item.quantity,
        special_note: item.special_note,
      });
    }

    // Discount Tiers: Bronze(20%), Silver(30%), Gold(40%), Platinum(50%), Diamond(60%)
    const discountMap = { bronze: 0.2, silver: 0.3, gold: 0.4, platinum: 0.5, diamond: 0.6 };
    const discountRate = discountMap[profile.discount_tier || "bronze"] || 0.2;
    const discountAmount = Math.round(subtotal * discountRate);

    const taxAmount = Math.round((subtotal - discountAmount) * 0.05); // 5% GST
    const deliveryCharge = 50; // ₹50 flat
    const totalAmount = subtotal - discountAmount + taxAmount + deliveryCharge;

    // 4. COD Settings & Limits Checks
    if (parsed.payment_method === "cod") {
      let codEnabled = false;
      let maxCodAmount = 500.00; // default cap from schema

      if (!isMock) {
        const supabase = createSupabaseServer();
        const { data: settings } = await supabase
          .from("customer_settings")
          .select("cod_enabled, max_cod_amount")
          .eq("user_id", profile.id)
          .maybeSingle();
        
        codEnabled = !!settings?.cod_enabled;
        if (settings?.max_cod_amount !== undefined && settings?.max_cod_amount !== null) {
          maxCodAmount = Number(settings.max_cod_amount);
        }
      } else {
        const settings = mockDb.getCustomerSettings(profile.id);
        codEnabled = settings.cod_enabled;
        maxCodAmount = settings.max_cod_amount || 500.00;
      }

      if (!codEnabled) {
        return errorResponse("Cash on Delivery is currently disabled for your account. Please pay online.", 403, "COD_DISABLED");
      }

      if (totalAmount > maxCodAmount) {
        return errorResponse(`Cash on Delivery is only available for orders up to ₹${maxCodAmount}.`, 400, "COD_LIMIT_EXCEEDED");
      }
    }

    let order: any;

    if (!isMock) {
      const supabase = createSupabaseServer();
      
      // Create order (map "stripe" -> "online" for DB schema check constraints)
      const isPaidInstantly = parsed.payment_method === "stripe" && (parsed.payment_method_type === "upi" || parsed.payment_method_type === "wallet");
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: profile.id,
          status: (parsed.payment_method === "cod" || isPaidInstantly) ? "confirmed" : "pending",
          payment_method: parsed.payment_method === "stripe" ? "online" : "cod",
          payment_method_type: parsed.payment_method_type || (parsed.payment_method === "stripe" ? "card" : null),
          payment_status: parsed.payment_method === "cod"
            ? "cod_pending"
            : (isPaidInstantly ? "paid" : "pending"),
          subtotal,
          discount_amount: discountAmount,
          tax: taxAmount,
          delivery_charge: deliveryCharge,
          total_amount: totalAmount,
          address_id: parsed.address_id,
          notes: parsed.notes,
        })
        .select("*")
        .single();

      if (orderErr || !newOrder) throw new Error(orderErr?.message || "Failed to create order record");
      order = newOrder;

      // Create order items
      const insertItems = itemsSnapshot.map((i) => ({
        order_id: order.id,
        ...i,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(insertItems);
      if (itemsErr) throw new Error(itemsErr.message);

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: profile.id,
        title: parsed.payment_method === "cod" ? "Order Confirmed (COD)! 🛵" : "Order Placed! 🍲",
        message: parsed.payment_method === "cod"
          ? `Your order will be delivered in ~30 mins. Keep ₹${totalAmount} ready.`
          : `Your order #${order.id} was successfully placed. View progress on orders dashboard.`,
        is_read: false,
      });

      // Clear cart
      await supabase.from("cart_items").delete().eq("cart_id", cartId);

      // Trigger email notification Edge function for COD or instantly paid orders immediately
      if (parsed.payment_method === "cod" || isPaidInstantly) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/edge-notification-trigger`, {
            method: "POST",
            body: JSON.stringify({ order, customer: profile }),
          });
        } catch (e) {
          console.log("[EMAIL TRIGGER ERROR]", e);
        }
      }
    } else {
      const isPaidInstantly = parsed.payment_method === "stripe" && (parsed.payment_method_type === "upi" || parsed.payment_method_type === "wallet");
      order = mockDb.createOrder(
        {
          user_id: profile.id,
          status: (parsed.payment_method === "cod" || isPaidInstantly) ? "confirmed" : "pending",
          payment_method: parsed.payment_method === "stripe" ? "online" : "cod",
          payment_method_type: parsed.payment_method_type || (parsed.payment_method === "stripe" ? "card" : null),
          payment_status: parsed.payment_method === "cod"
            ? "cod_pending"
            : (isPaidInstantly ? "paid" : "pending"),
          subtotal,
          discount_amount: discountAmount,
          tax: taxAmount,
          delivery_charge: deliveryCharge,
          total_amount: totalAmount,
          address_id: parsed.address_id,
          notes: parsed.notes || null,
        },
        itemsSnapshot
      );

      const isCod = parsed.payment_method === "cod";
      mockDb.createNotification(
        profile.id,
        isCod ? "Order Confirmed (COD)! 🛵" : "Order Placed! 🍲",
        isCod
          ? `Your order will be delivered in ~30 mins. Keep ₹${totalAmount} ready.`
          : `Your order #${order.id} was successfully placed. View progress on orders dashboard.`
      );

      mockDb.clearCart(cartId);
    }

    return successResponse({
      order,
      stripe_client_secret: parsed.payment_method === "stripe" ? "mock_stripe_secret_key_12345" : null,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "CREATE_ORDER_FAILED");
  }
}

// GET /api/orders: retrieve user's order history
export async function GET(request: Request) {
  try {
    const profile = await requireVerified(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return successResponse(orders || []);
    } else {
      const orders = mockDb.getOrders(profile.id).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return successResponse(orders);
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_ORDERS_FAILED");
  }
}
