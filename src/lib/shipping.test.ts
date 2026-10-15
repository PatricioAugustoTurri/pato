import { describe, expect, it } from "vitest";
import {
  SHIPPING_COUNTRIES,
  SHIPPING_CURRENCY,
  isShippingRegion,
  shippingRateByName,
  stripeShippingOptions,
} from "@/lib/shipping";

describe("zonas de envío", () => {
  it("solo acepta las dos zonas declaradas", () => {
    expect(isShippingRegion("it")).toBe(true);
    expect(isShippingRegion("eu")).toBe(true);
    expect(isShippingRegion("us")).toBe(false);
    expect(isShippingRegion(undefined)).toBe(false);
  });

  it("Italia no está en la zona del resto de la UE, y son 27 países en total", () => {
    expect(SHIPPING_COUNTRIES.eu).not.toContain("IT");
    expect(new Set([...SHIPPING_COUNTRIES.it, ...SHIPPING_COUNTRIES.eu]).size).toBe(27);
  });

  it("Stripe recibe UNA sola tarifa, la de la zona elegida, en euros", () => {
    const options = stripeShippingOptions("it");
    expect(options).toHaveLength(1);
    expect(options[0].shipping_rate_data.fixed_amount).toEqual({ amount: 500, currency: SHIPPING_CURRENCY });
    expect(stripeShippingOptions("eu")[0].shipping_rate_data.fixed_amount.amount).toBe(1000);
  });

  it("el nombre que vuelve de Stripe lleva a la misma tarifa", () => {
    for (const region of ["it", "eu"] as const) {
      const name = stripeShippingOptions(region)[0].shipping_rate_data.display_name;
      expect(shippingRateByName(name)?.region).toBe(region);
    }
    expect(shippingRateByName(null)).toBeNull();
  });
});
