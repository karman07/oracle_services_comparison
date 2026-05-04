import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { computeDiff } from '@/src/services/comparisonEngine';
import type { OpenApiSpec } from '@/src/types/diff.types';
import type { DiffResult } from '@/src/types/diff.types';

export const dynamic = 'force-dynamic';

const OPENAPI_25C_PATH = join(process.cwd(), 'data/openapi_scm_25c.json');
const OPENAPI_26B_PATH = join(process.cwd(), 'data/openapi_scm_26b.json');

// Module-level cache: computed once per server process lifetime
let cachedResult: DiffResult | null = null;

function readOpenApiSpec(label: string, filePath: string): OpenApiSpec {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as OpenApiSpec;
  } catch (err) {
    throw new Error(`Unable to load ${label} OpenAPI JSON from ${filePath}: ${err}`);
  }
}

export async function GET() {
  try {
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    const spec25c = readOpenApiSpec('25C', OPENAPI_25C_PATH);
    const spec26b = readOpenApiSpec('26B', OPENAPI_26B_PATH);

    cachedResult = computeDiff(spec25c, spec26b);

    return NextResponse.json(cachedResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
