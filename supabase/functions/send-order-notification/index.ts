import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

serve(async (req) => {
  try {
    const { order, customer } = await req.json();

    if (!order || !customer) {
      return new Response(JSON.stringify({ error: "Missing required details" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailHtml = `
      <div style="background-color: #FAF0DC; color: #1A0800; font-family: sans-serif; padding: 40px; border-radius: 8px;">
        <h1 style="color: #C4622D;">Rasoi House</h1>
        <p>Namaste ${customer.full_name},</p>
        <p>Your order <strong>#${order.id}</strong> has been successfully placed!</p>
        <p>Total amount: ₹${order.total_amount}</p>
        <p>Payment Mode: ${order.payment_method.toUpperCase()}</p>
        <hr style="border: 0; border-top: 1px solid #E3D1B4; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6B4F3E;">We are preparing your hot delicious meal now. Thank you for choosing Rasoi House.</p>
      </div>
    `;

    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Rasoi House <noreply@rasoihouse.com>",
          to: customer.email,
          subject: `Order #${order.id} Placed — Rasoi House`,
          html: emailHtml,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
    } else {
      console.log(`[EDGE FUNCTION SEND NOTIFICATION] Mock Email to: ${customer.email} regarding Order: ${order.id}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Notification handled" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
