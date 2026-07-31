import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors the "@/*" path mapping in tsconfig.json. Vitest resolves modules
  // itself, so the alias has to be repeated here rather than inherited.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      reporter: ["text", "json", "html"],
    },
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
