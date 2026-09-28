import path from "node:path";

import nextEnv from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Needs the compose stack (Keycloak + dev user) running: `pnpm compose:up` at the repo root.
nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, "../.."), true, undefined, true);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.WEB_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: `${process.env.WEB_BASE_URL ?? "http://localhost:3000"}/login`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
