export interface PriceCalcOptions {
  subtotal: number;
  discountTier?: string | null;
  deliveryCharge?: number;
  paymentMethod?: "cod" | "stripe" | "online";
  codEnabled?: boolean;
  maxCodAmount?: number;
  minOrderAmount?: number;
}

export interface PriceCalcResult {
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  error?: string;
  errorCode?: string;
}

export function calculateOrderTotal(options: PriceCalcOptions): PriceCalcResult {
  const {
    subtotal,
    discountTier = null,
    deliveryCharge = 50,
    paymentMethod = "stripe",
    codEnabled = false,
    maxCodAmount = 500,
    minOrderAmount = 100, // Flat minimum order amount limit
  } = options;

  // 1. Minimum order validation
  if (minOrderAmount && subtotal < minOrderAmount) {
    return {
      subtotal,
      discountRate: 0,
      discountAmount: 0,
      taxAmount: 0,
      deliveryCharge,
      totalAmount: 0,
      error: `Minimum order amount is ₹${minOrderAmount}.`,
      errorCode: "MIN_ORDER_NOT_MET",
    };
  }

  // 2. Discount tiers check (applied on subtotal before tax)
  // Bronze(20%), Silver(30%), Gold(40%), Platinum(50%), Diamond(60%)
  // If tier is not found or is "guest" or empty/null, it is 0.
  let discountRate = 0;
  if (discountTier) {
    const tier = discountTier.toLowerCase();
    if (tier === "bronze") discountRate = 0.20;
    else if (tier === "silver") discountRate = 0.30;
    else if (tier === "gold") discountRate = 0.40;
    else if (tier === "platinum") discountRate = 0.50;
    else if (tier === "diamond") discountRate = 0.60;
  }

  // 60% cap
  if (discountRate > 0.60) {
    discountRate = 0.60;
  }

  const discountAmount = Math.round(subtotal * discountRate);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  // 3. 5% GST
  const taxAmount = Math.round(taxableAmount * 0.05);
  
  // 4. Delivery charge: Free for orders >= ₹500 (after discount), otherwise the passed delivery charge (default ₹50).
  const finalDeliveryCharge = (subtotal > 0 && taxableAmount < 500) ? deliveryCharge : 0;
  const totalAmount = taxableAmount + taxAmount + finalDeliveryCharge;

  // 5. COD validity check
  if (paymentMethod === "cod") {
    if (!codEnabled) {
      return {
        subtotal,
        discountRate,
        discountAmount,
        taxAmount,
        deliveryCharge: finalDeliveryCharge,
        totalAmount,
        error: "Cash on Delivery is currently disabled for your account. Please pay online.",
        errorCode: "COD_DISABLED",
      };
    }
    if (totalAmount > maxCodAmount) {
      return {
        subtotal,
        discountRate,
        discountAmount,
        taxAmount,
        deliveryCharge: finalDeliveryCharge,
        totalAmount,
        error: `Cash on Delivery is only available for orders up to ₹${maxCodAmount}.`,
        errorCode: "COD_LIMIT_EXCEEDED",
      };
    }
  }

  return {
    subtotal,
    discountRate,
    discountAmount,
    taxAmount,
    deliveryCharge: finalDeliveryCharge,
    totalAmount,
  };
}
