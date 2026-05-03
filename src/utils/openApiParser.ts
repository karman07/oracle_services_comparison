import type { OpenApiSpec, FileStats } from '../types/diff.types';

export async function parseOpenApiFile(file: File): Promise<OpenApiSpec> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON: failed to parse file');
  }
  const spec = parsed as OpenApiSpec;
  if (typeof spec.openapi !== 'string' || !spec.openapi.startsWith('3.')) {
    throw new Error('Not an OpenAPI 3.x spec — missing or invalid "openapi" field');
  }
  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('OpenAPI spec is missing "paths" object');
  }
  return spec;
}

export function getFileStats(spec: OpenApiSpec): FileStats {
  return {
    pathCount: Object.keys(spec.paths ?? {}).length,
    schemaCount: Object.keys(spec.components?.schemas ?? {}).length,
    tagCount: (spec.tags ?? []).length,
    title: spec.info?.title ?? 'Unknown',
    version: spec.info?.version ?? 'Unknown',
  };
}
