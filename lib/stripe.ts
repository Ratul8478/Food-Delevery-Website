import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
  appInfo: { name: "Rasoi House", version: "1.0.0" },
});

