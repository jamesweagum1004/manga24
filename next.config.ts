import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    // Next.js 15 clones request bodies that pass through middleware and otherwise
    // truncates the clone at 10 MB. Keep this above the import endpoint's limit.
    middlewareClientMaxBodySize: "200mb",
    serverActions: {
      bodySizeLimit: "150mb"
    }
  },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  }
};

export default nextConfig;
