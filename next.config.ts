import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/diff': ['./data/**/*.json', './data/**/*.part', './openapi_scm_*.json', './openapi_scm_26b (1).json'],
  },
};

export default nextConfig;
