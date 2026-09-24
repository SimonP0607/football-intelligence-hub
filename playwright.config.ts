/**
 * End-to-end checks against the RUNNING stack - start it first:
 *   (backend repo) scripts/dev-up api web
 *   bun run test:e2e
 *
 * E2E_BASE_URL  the web app   (default http://127.0.0.1:5173)
 * E2E_API_URL   the API       (default http://127.0.0.1:8010)
 *
 * A full run loads ~100 pages in a few minutes, above the API's default
 * per-client limit of 240 requests a minute: start the API for a run with
 * FBI_API_RATE_LIMIT=5000, or a 429 fails the page that hit it.
 * Browsers: `bunx playwright install chromium` once (not needed where
 * PLAYWRIGHT_BROWSERS_PATH already has chromium for Playwright 1.56).
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env["E2E_WORKERS"] ? Number(process.env["E2E_WORKERS"]) : 3,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  outputDir: "e2e-results",
  use: {
    baseURL: process.env["E2E_BASE_URL"] ?? "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
