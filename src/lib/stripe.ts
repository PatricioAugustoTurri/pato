import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export function getStripe(): Stripe {
  if (globalForStripe.stripe) {
    return globalForStripe.stripe;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar STRIPE_SECRET_KEY.");
  }

  const stripe = new Stripe(apiKey);

  if (process.env.NODE_ENV !== "production") {
    globalForStripe.stripe = stripe;
  }

  return stripe;
}
