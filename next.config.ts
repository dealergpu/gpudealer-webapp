import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` pick up Cloudflare bindings (env vars, KV, etc.) the same
// way they'd be available once deployed via the OpenNext adapter.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {};

export default nextConfig;
