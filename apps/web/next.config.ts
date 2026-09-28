import path from "node:path";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// One .env for the whole monorepo lives at the repo root (see .env.example). Next has already
// loaded apps/web's (empty) env by now and caches it, so force a reload from the root.
loadEnvConfig(
  path.resolve(import.meta.dirname, "../.."),
  process.env.NODE_ENV !== "production",
  undefined,
  true,
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@runway/spec"],
  poweredByHeader: false,
};

export default nextConfig;
