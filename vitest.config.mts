import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/* Pruebas de la lógica que decide qué se cobra: validación del carrito y
   tarifas de envío. No tocan la base ni Stripe; corren con `npm test`. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
