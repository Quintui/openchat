import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    colorScheme: "light",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Serves the production build, so run `bun run build` first.
  webServer: {
    command: "node .output/server/index.mjs",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      // src/mastra/tools/web-search.ts instantiates Exa at import time and every
      // route fails with 401 without a key. Page load never calls either API.
      EXA_API_KEY: process.env.EXA_API_KEY || "ci-dummy",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "ci-dummy",
    },
  },
});
