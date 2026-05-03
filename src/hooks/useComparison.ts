'use client';

import { useState, useEffect } from 'react';
import type { DiffResult } from '../types/diff.types';

export type LoadStage =
  | 'idle'
  | 'fetching'
  | 'done'
  | 'error';

export function useComparison() {
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [stage, setStage] = useState<LoadStage>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStage('fetching');
    fetch('/api/diff')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<DiffResult>;
      })
      .then((data) => {
        setDiffResult(data);
        setStage('done');
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setStage('error');
      });
  }, []);

  return { diffResult, loading: stage === 'fetching', stage, error };
}
