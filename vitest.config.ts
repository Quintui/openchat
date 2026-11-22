import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts: the app's server plugins (nitro, TanStack Start) stop tests
// from importing packages in node_modules.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
