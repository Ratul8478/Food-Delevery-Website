import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { order, customer } = await request.json();
    if (!order || !customer) {
      return NextResponse.json({ error: "Missing order or customer details" }, { status: 400 });
    }

    const email = customer.email;
    const name = customer.full_name;
    const orderNumber = order.order_number || `ORD-${order.id}`;
    const totalAmount = order.total_amount;
    const paymentMethod = order.payment_method;

    const resendApiKey = process.env.RESEND_API_KEY;
    
    const emailHtml = `
      <div style="background-color: #1A0800; color: #FAF0DC; font-family: 'Poppins', sans-serif; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #3D2010;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C4622D; font-family: 'Yeseva One', serif; margin: 0; font-size: 28px;">Rasoi House</h1>
          <p style="color: #B8A090; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Authentic Indian Kitchen</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #FAF0DC;">Namaste ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #FAF0DC;">Your order <strong>${orderNumber}</strong> has been successfully confirmed!</p>
        
        <div style="background-color: #2B1206; padding: 20px; border-radius: 8px; border: 1px solid #3D2010; margin: 25px 0;">
          <h3 style="color: #E8A020; margin-top: 0; margin-bottom: 15px; font-size: 16px; font-family: 'Yeseva One', serif;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 5px 0; color: #B8A090;">Order ID:</td>
              <td style="padding: 5px 0; text-align: right; color: #FAF0DC; font-family: monospace;">#${order.id}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #B8A090;">Total Amount:</td>
              <td style="padding: 5px 0; text-align: right; color: #E8A020; font-weight: bold; font-size: 16px;">₹${totalAmount}.00</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #B8A090;">Payment Method:</td>
              <td style="padding: 5px 0; text-align: right; color: #FAF0DC; text-transform: uppercase;">${paymentMethod === 'online' ? 'Online Payment (Stripe)' : 'Cash on Delivery (COD)'}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #FAF0DC;">
          ${paymentMethod === 'cod' 
            ? "Your food is being prepared and will be delivered in approximately 30 minutes. Please keep the cash ready." 
            : "Your payment was processed successfully. Our royal kitchen chefs are firing up the clay oven to prepare your fresh feast!"}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}" 
             style="background-color: #C4622D; color: #FAF0DC; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 14px; transition: background-color 0.2s;">
             Track Your Order Live
          </a>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #3D2010; padding-top: 20px; text-align: center; font-size: 11px; color: #B8A090;">
          Rasoi House · 12, Kasturba Gandhi Marg, Connaught Place, New Delhi
        </div>
      </div>
    `;

    if (resendApiKey && !resendApiKey.includes("placeholder")) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: "Rasoi House <noreply@rasoihouse.com>",
        to: email,
        subject: `Your order is confirmed! — Rasoi House (${orderNumber})`,
        html: emailHtml,
      });
      console.log(`[RESEND EMAIL SENT] Confirmed order ${orderNumber} for ${email}`);
    } else {
      console.log("\n========================================");
      console.log(`[EMAIL DEMO] ORDER CONFIRMED FOR: ${email}`);
      console.log(`ORDER NUMBER: ${orderNumber}`);
      console.log(`TOTAL AMOUNT: ₹${totalAmount}`);
      console.log(`PAYMENT METHOD: ${paymentMethod}`);
      console.log("========================================\n");
    }

    return NextResponse.json({ success: true, message: "Confirmation email sent" });
  } catch (error: any) {
    console.error("[EDGE NOTIFICATION ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
