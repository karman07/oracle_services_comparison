import { useState } from 'react';
import { queryRag, type QueryResponse } from '../services/ragClient';

export function useRagQuery() {
  // Stable session ID for the lifetime of this hook instance.
  // useState lazy initializer runs once client-side, giving a consistent ID
  // for every request in this chat session.
  const [sessionId] = useState<string>(() => crypto.randomUUID());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QueryResponse | null>(null);

  async function ask(question: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await queryRag({ question, top_k: 5, use_llm: true, session_id: sessionId });
      setData(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setError(null);
    setData(null);
  }

  return { ask, retry, loading, error, data, sessionId };
}
