import type { NextConfig } from "next";

const isVercelBuild = process.env.VERCEL === '1';
const forceLocalSpecTracing = process.env.OPENAPI_FORCE_LOCAL_TRACE === '1';

const nextConfig: NextConfig = {
  // Avoid oversized serverless bundles on Vercel by default.
  // Set OPENAPI_FORCE_LOCAL_TRACE=1 only if local files are intentionally required in deployment.
  outputFileTracingIncludes: (!isVercelBuild || forceLocalSpecTracing)
    ? {
        '/api/diff': [
          './data/**/*.json',
          './data/**/*.part',
          './openapi_scm_*.json',
          './openapi_scm_26b (1).json',
        ],
      }
    : undefined,
};

export default nextConfig;
