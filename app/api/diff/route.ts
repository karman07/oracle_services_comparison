import { NextResponse } from 'next/server';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { isAbsolute, join } from 'path';
import { computeDiff } from '@/src/services/comparisonEngine';
import type { OpenApiSpec } from '@/src/types/diff.types';
import type { DiffResult } from '@/src/types/diff.types';

export const dynamic = 'force-dynamic';

// Module-level cache: computed once per server process lifetime
let cachedResult: DiffResult | null = null;

function toAbsolutePath(pathOrFile: string): string {
  return isAbsolute(pathOrFile)
    ? pathOrFile
    : join(/* turbopackIgnore: true */ process.cwd(), pathOrFile);
}

function getChunkDirectoryPath(filePath: string): string {
  return filePath.endsWith('.json')
    ? filePath.slice(0, -'.json'.length) + '.parts'
    : `${filePath}.parts`;
}

function readChunkedJsonFile(filePath: string): string | null {
  const chunkDir = getChunkDirectoryPath(filePath);
  if (!existsSync(chunkDir)) return null;

  const chunkFiles = readdirSync(chunkDir)
    .filter((name) => name.endsWith('.part'))
    .sort((a, b) => a.localeCompare(b));

  if (chunkFiles.length === 0) {
    throw new Error(`Chunk directory exists but contains no .part files: ${chunkDir}`);
  }

  return chunkFiles
    .map((chunkFile) => readFileSync(join(chunkDir, chunkFile), 'utf-8'))
    .join('');
}

function readOpenApiSpecFromCandidates(label: string, candidates: string[]): OpenApiSpec {
  const triedPaths: string[] = [];

  for (const candidate of candidates) {
    const absolute = toAbsolutePath(candidate);
    triedPaths.push(absolute);
    try {
      const raw = existsSync(absolute)
        ? readFileSync(absolute, 'utf-8')
        : readChunkedJsonFile(absolute);

      if (!raw) {
        continue;
      }

      return JSON.parse(raw) as OpenApiSpec;
    } catch {
      // Try next candidate path.
    }
  }

  throw new Error(
    `Unable to load ${label} OpenAPI JSON. Checked: ${triedPaths.join(', ')}`,
  );
}

async function readOpenApiSpecFromUrl(label: string, url: string): Promise<OpenApiSpec> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${label} OpenAPI JSON from ${url} (HTTP ${response.status})`);
  }

  return response.json() as Promise<OpenApiSpec>;
}

export async function GET() {
  try {
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    const spec25c = process.env.OPENAPI_25C_URL
      ? await readOpenApiSpecFromUrl('25C', process.env.OPENAPI_25C_URL)
      : readOpenApiSpecFromCandidates('25C', [
          process.env.OPENAPI_25C_PATH ?? 'data/openapi_scm_25c.json',
          'openapi_scm_25c.json',
        ]);
    const spec26b = process.env.OPENAPI_26B_URL
      ? await readOpenApiSpecFromUrl('26B', process.env.OPENAPI_26B_URL)
      : readOpenApiSpecFromCandidates('26B', [
          process.env.OPENAPI_26B_PATH ?? 'data/openapi_scm_26b.json',
          'openapi_scm_26b (1).json',
        ]);

    cachedResult = computeDiff(spec25c, spec26b);

    return NextResponse.json(cachedResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
