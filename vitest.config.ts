import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests import lib modules directly; this teaches Vitest the "@/" alias that tsconfig already maps.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
