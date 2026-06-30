"use client";

import React, { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Lock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK || "");

interface StripePaymentFormProps {
  amount: number;
  address: any;
  notes: string;
  placeOrder: (method: "cod" | "stripe") => Promise<any>;
  clearCart: () => void;
  onError: (msg: string) => void;
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const isStripeConfigured =
    !!process.env.NEXT_PUBLIC_STRIPE_PK &&
    !process.env.NEXT_PUBLIC_STRIPE_PK.includes("placeholder") &&
    process.env.NEXT_PUBLIC_STRIPE_PK.length > 0;

  if (isStripeConfigured) {
    const options = {
      mode: "payment" as const,
      amount: Math.round(props.amount * 100),
      currency: "inr",
      paymentMethodTypes: ["card", "upi", "netbanking"],
      appearance: {
        theme: "night" as const,
        variables: {
          colorPrimary: "#C4622D",
          colorBackground: "#3A1A0A",
          colorText: "#FAF0DC",
          colorDanger: "#F4650A",
          fontFamily: "Poppins, sans-serif",
          borderRadius: "4px",
        },
      },
    };

    return (
      <Elements stripe={stripePromise} options={options}>
        <RealStripeForm {...props} />
      </Elements>
    );
  } else {
    return <MockStripeForm {...props} />;
  }
}

function RealStripeForm({ amount, placeOrder, clearCart, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    // 1. Trigger form validation
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message || "An error occurred validating payment fields.");
      onError(submitError.message || "Validation failed.");
      setLoading(false);
      return;
    }

    try {
      // 2. Create order in database
      const order = await placeOrder("stripe");

      // 3. Create Stripe PaymentIntent
      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });
      const intentData = await res.json();
      if (!res.ok || !intentData.success) {
        throw new Error(intentData.error?.message || "Failed to create payment session.");
      }

      const clientSecret = intentData.data.client_secret;

      // 4. Confirm payment with Stripe (redirects if required)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${order.id}/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment confirmation failed.");
        onError(error.message || "Payment failed.");
      } else {
        // Clear frontend cart context
        await clearCart();

        // 5. If confirmation completed without redirect, confirm order on server
        if (paymentIntent && paymentIntent.status === "succeeded") {
          await fetch("/api/payment/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: order.id,
              stripe_payment_intent_id: paymentIntent.id,
            }),
          });
        }
        // Redirect to success route
        router.push(`/orders/${order.id}/success`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      onError(err.message || "Unexpected failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-body">
      <div className="flex items-center justify-between text-xs text-cream-muted pb-2 border-b border-border/40 select-none">
        <div className="flex items-center gap-1.5 font-medium">
          <Lock size={12} className="text-forest" />
          <span>Secure 256-Bit SSL Connection</span>
        </div>
        <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded uppercase font-bold">
          Stripe SDK Live
        </span>
      </div>

      {errorMessage && (
        <div className="bg-red-950/20 border border-red-900/60 p-3 rounded-md text-red-300 text-xs flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <PaymentElement />

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-spice text-cream py-4 rounded-sm font-semibold text-sm hover:bg-spice-light active:scale-98 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Processing Payment...</span>
          </>
        ) : (
          <span>Pay ₹{amount} & Place Order</span>
        )}
      </button>
    </form>
  );
}

function MockStripeForm({ amount, placeOrder, clearCart, onError }: StripePaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    let matches = value.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || "";
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\//g, "").replace(/[^0-9]/gi, "");
    if (value.length > 2) {
      setExpiry(value.substring(0, 2) + "/" + value.substring(2, 4));
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/gi, "");
    setCvv(value.substring(0, 3));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    if (cardNumber.replace(/\s/g, "").length < 16) {
      setCardError("Card number must be 16 digits.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setCardError("Expiration date must be in MM/YY format.");
      return;
    }
    const [month, year] = expiry.split("/");
    const mNum = parseInt(month, 10);
    if (mNum < 1 || mNum > 12) {
      setCardError("Expiration month must be between 01 and 12.");
      return;
    }
    if (cvv.length < 3) {
      setCardError("CVV must be 3 digits.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create order
      const order = await placeOrder("stripe");

      // 2. Simulate Payment Processing
      setTimeout(async () => {
        if (cardNumber.startsWith("4242")) {
          const mockIntentId = "pi_mock_" + Math.random().toString(36).substr(2, 9);
          
          await clearCart();

          await fetch("/api/payment/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: order.id,
              stripe_payment_intent_id: mockIntentId,
            }),
          });

          setLoading(false);
          router.push(`/orders/${order.id}/success`);
        } else {
          setLoading(false);
          const errMsg = "Your card was declined. Please try using a test card starting with 4242.";
          setCardError(errMsg);
          onError(errMsg);
        }
      }, 1500);
    } catch (err: any) {
      setCardError(err.message || "Order placement failed.");
      onError(err.message || "Order placement failed.");
      setLoading(false);
    }
  };

  const getCardIcon = () => {
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.startsWith("4")) {
      return (
        <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0">
          VISA
        </span>
      );
    }
    if (cleanNum.startsWith("5")) {
      return (
        <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0">
          MC
        </span>
      );
    }
    return <CreditCard size={15} className="text-cream-muted/50" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-cream-muted pb-2 border-b border-border/40 select-none">
        <div className="flex items-center gap-1.5 font-medium">
          <Lock size={12} className="text-forest" />
          <span>Secure 256-Bit SSL Connection</span>
        </div>
        <span className="text-[10px] bg-turmeric/10 text-turmeric px-2 py-0.5 rounded uppercase font-bold">
          Stripe Simulator
        </span>
      </div>

      <div className="bg-turmeric/10 border border-turmeric/30 p-3 rounded-lg text-turmeric-dark text-[11px] leading-normal flex items-start gap-2 select-none font-body">
        <span className="text-sm">💡</span>
        <p>
          <strong>Simulator Mode:</strong> Stripe API keys are not configured. You can simulate online payment using a test card starting with <strong className="font-mono text-xs">4242</strong>.
        </p>
      </div>

      {cardError && (
        <div className="bg-red-950/20 border border-red-900/60 p-3 rounded-md text-red-300 text-xs flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{cardError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <div className="flex flex-col">
          <label className="text-[11px] text-cream-muted mb-1 font-medium">
            Cardholder Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rajesh Kumar"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="bg-mahogany-surface border border-border rounded-md px-3.5 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] text-cream-muted mb-1.5 font-medium flex items-center justify-between">
            <span>Card Number</span>
            {getCardIcon()}
          </label>
          <input
            type="text"
            required
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={handleCardNumberChange}
            className="bg-mahogany-surface border border-border rounded-md px-3.5 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-[11px] text-cream-muted mb-1 font-medium">
              Expiration Date
            </label>
            <input
              type="text"
              required
              placeholder="MM/YY"
              value={expiry}
              onChange={handleExpiryChange}
              className="bg-mahogany-surface border border-border rounded-md px-3.5 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors font-mono"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-cream-muted mb-1 font-medium">
              CVV
            </label>
            <input
              type="password"
              required
              placeholder="123"
              value={cvv}
              onChange={handleCvvChange}
              className="bg-mahogany-surface border border-border rounded-md px-3.5 py-2.5 text-xs text-cream focus:border-spice focus:outline-none transition-colors font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-spice text-cream py-4 rounded-sm font-semibold text-sm hover:bg-spice-light active:scale-98 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-cream" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing Payment...</span>
            </>
          ) : (
            <span>Pay ₹{amount} & Place Order</span>
          )}
        </button>
      </form>
    </div>
  );
}
