export type QueryRequest = {
  question: string;
  top_k?: number;
  use_llm?: boolean;
  llm_model?: string;
  session_id?: string;
};

export type QueryResponse = {
  intent: string;
  entity_hint: string | null;
  answer: string;
  records_used: {
    route_records: number;
    schema_records: number;
    module_summaries: number;
  };
  context_text: string;
  session_id?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_RAG_API_BASE_URL ||
  'http://localhost:8000';

export async function queryRag(payload: QueryRequest): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      top_k: 5,
      use_llm: true,
      llm_model: 'gemini-2.5-flash',
      ...payload,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RAG query failed (${res.status}): ${text}`);
  }

  return (await res.json()) as QueryResponse;
}
