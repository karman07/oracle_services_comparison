# RAG Action Plan For API Change Questions

## Goal

Build a retrieval system on top of the existing Oracle SCM diff data so a user can ask questions like:

- What changed recently?
- Which routes were deleted?
- What are the major route changes?
- What changed in schema X?
- Which routes were affected by this schema change?
- Show me all modified routes under a module.

The system should:

- avoid sending huge OpenAPI files to the model
- avoid burning too many tokens
- answer route, schema, and summary questions cleanly
- support both broad and narrow questions

---

## Core Idea

Do not use the raw OpenAPI files directly for question answering.

Instead, create a compact knowledge layer from the diff output you already compute in [src/services/comparisonEngine.ts](src/services/comparisonEngine.ts).

The RAG system should retrieve from:

1. structured change records
2. route-level summaries
3. schema-level summaries
4. release-level rollups

That gives you much lower token usage and much better answers.

---

## Recommended Architecture

### 1. Source Layer

Use the existing diff output from [app/api/diff/route.ts](/Users/karmansingh/release_notes_simplifier/app/api/diff/route.ts) or from the shared diff engine in [src/services/comparisonEngine.ts](/Users/karmansingh/release_notes_simplifier/src/services/comparisonEngine.ts) as the source of truth.

Current useful entities already available:

- `pathDiffs`
- `schemaDiffs`
- `tagDiffs`
- `summary`

Do not embed the original OpenAPI specs unless you later need deep field-level semantic lookup.

---

### 2. Retrieval Layer

Create normalized records in a compact form.

Recommended record types:

#### Route Change Record

One record per route, for example:

```json
{
  "entityType": "route_change",
  "path": "/fscmRestApi/resources/11.13.18.05/suppliers",
  "changeType": "modified",
  "methodsAdded": ["POST"],
  "methodsRemoved": [],
  "methodsModified": ["GET"],
  "details": ["GET param added: expand:query"],
  "tags": ["suppliers"],
  "module": "suppliers",
  "searchText": "modified route suppliers GET changed POST added"
}
```

#### Schema Change Record

One record per schema:

```json
{
  "entityType": "schema_change",
  "schemaName": "Supplier",
  "changeType": "modified",
  "fieldsAdded": 4,
  "fieldsRemoved": 1,
  "fieldsModified": 2,
  "impactedRoutes": [
    "GET /.../suppliers",
    "POST /.../suppliers"
  ],
  "searchText": "Supplier schema modified supplier routes impacted"
}
```

#### Release Summary Record

One compact top-level summary:

```json
{
  "entityType": "release_summary",
  "pathsAdded": 100,
  "pathsRemoved": 20,
  "pathsModified": 300,
  "schemasAdded": 400,
  "schemasRemoved": 50,
  "schemasModified": 900,
  "topModulesChanged": ["suppliers", "items", "orders"]
}
```

#### Optional Module Summary Record

One record per business area:

- suppliers
- items
- orders
- shipments

This is useful for questions like:

- what changed in supplier APIs?
- what are the major order route changes?

---

### 3. Index Layer

Use hybrid retrieval, not embeddings only.

Recommended stack:

1. metadata filter
2. keyword search
3. embeddings for semantic matching

Reason:

- route questions usually match exact terms like path fragments, method names, and schema names
- semantic questions need embeddings
- metadata filters keep token usage low

Good storage choices:

1. SQLite + FTS5 + JSON columns for local prototype
2. Postgres + pgvector for production
3. OpenSearch / Elasticsearch if you want strong filtering and ranking

For a fast prototype, SQLite is enough.

---

## Token-Saving Strategy

This is the most important design rule.

### Never send these directly to the model

- raw OpenAPI specs
- all route diffs at once
- all schema diffs at once

### Always send only compact retrieved records

For example:

- top 5 matching route records
- top 3 schema records
- one release summary

### Precompute short summaries

Each route/schema record should also contain a short natural-language summary, for example:

- `GET suppliers route modified; new query parameter added`
- `Supplier schema modified; 4 fields added, 1 removed, 2 type changes`

This reduces model work and token usage.

### Use answer templates

For repeated question classes, do not rely fully on free-form generation.

Examples:

- deleted routes
- added routes
- modified routes by module
- schema changes for a route
- route impact for a schema

Use structured response assembly first, then let the model polish the answer.

---

## Query Types To Support

Your retrieval layer should classify questions into one of these intents.

### A. Summary Questions

Examples:

- what changed recently
- what major changes took place
- summarize the latest route changes

Use:

- release summary record
- top changed modules
- top modified routes

### B. Route Questions

Examples:

- which routes were deleted
- what changed in supplier routes
- show main route changes
- what changed in GET supplier endpoint

Use:

- route change records
- metadata filters on `changeType`, `method`, `module`, `path`

### C. Schema Questions

Examples:

- what changed in Supplier schema
- which schemas changed for route X
- which routes are affected by schema Y

Use:

- schema change records
- impacted route mapping

### D. Comparative Questions

Examples:

- what was added vs removed
- which routes changed the most

Use:

- precomputed aggregates
- ranked route records

---

## Best Data Model For RAG

Create a derived dataset from the diff result.

Recommended files:

1. `rag/route_changes.jsonl`
2. `rag/schema_changes.jsonl`
3. `rag/release_summary.json`
4. `rag/module_summaries.jsonl`

Each JSONL line should be a small self-contained retrieval document.

This is much better than embedding one giant JSON.

---

## Recommended Pipeline

### Phase 1. Build Compact Artifacts

Create a script that:

1. calls the same diff computation logic
2. transforms the diff into compact route/schema/module records
3. writes JSONL output for retrieval

Suggested script names:

- `scripts/build-rag-artifacts.ts`
- `scripts/query-rag.ts`

### Phase 2. Add FastAPI Retrieval API

Build a separate FastAPI service, for example:

- `rag_api/main.py`
- `rag_api/routes/query.py`
- `rag_api/routes/artifacts.py`

Flow:

1. classify user question
2. retrieve top matching records
3. optionally re-rank
4. build a compact context window
5. send only the compact context to the LLM

### Phase 3. Connect UI Chat Layer

Add a new screen or side panel:

- Ask about changes

The frontend can call the FastAPI service over HTTP instead of serving RAG answers from Next.js directly.

Example prompts:

- What routes were removed?
- What changed in supplier APIs?
- Which schemas changed the most?
- Show me recent route updates.

### Phase 4. Add Caching

Cache:

- query classification
- retrieval results
- final answers for repeated questions

This reduces latency and token cost.

---

## Retrieval Design Details

### Route Record Fields

Keep these fields for filtering and ranking:

- `path`
- `changeType`
- `methodsAdded`
- `methodsRemoved`
- `methodsModified`
- `details`
- `module`
- `tags`
- `summaryText`
- `searchText`

### Schema Record Fields

- `schemaName`
- `changeType`
- `fieldsAdded`
- `fieldsRemoved`
- `fieldsModified`
- `topFieldChanges`
- `impactedRoutes`
- `summaryText`
- `searchText`

### Ranking Heuristics

Prefer records where:

1. exact path match exists
2. exact schema name match exists
3. exact method match exists
4. change type matches the query intent
5. module/tag match exists

Then use embeddings for the remaining tie-breaking.

---

## How To Keep Answers Clean

The answer formatter should not dump raw JSON.

Good answer structure:

1. short summary
2. grouped changes
3. exact routes or schemas affected
4. optional before/after details

Example answer for deleted routes:

```text
3 main routes were removed.

Removed routes:
- DELETE /.../supplierContacts
- GET /.../legacyOrders
- POST /.../shipmentRequests

Notes:
- 2 of these were under the suppliers module.
- 1 removed route also affected the Contact schema.
```

---

## Recommended LLM Prompt Contract

Pass the model:

1. user question
2. classified intent
3. top retrieved records only
4. explicit formatting instruction

Example system rule:

```text
Answer only from the retrieved change records.
If the answer is about routes, list exact route paths and change types.
If the answer is about schemas, include impacted routes when available.
Do not speculate beyond the retrieved records.
Prefer concise grouped summaries.
```

This avoids hallucination and token waste.

---

## Suggested FastAPI Implementation

### Step 1

Keep [src/services/comparisonEngine.ts](/Users/karmansingh/release_notes_simplifier/src/services/comparisonEngine.ts) as the canonical diff engine for generating the source diff.

### Step 2

Add a transformation layer that converts diff output into RAG documents.

Suggested new file:

- `src/services/ragArtifactBuilder.ts`

### Step 3

Add persistent artifact output.

Suggested folder:

- `rag/`

### Step 4

Build the FastAPI backend in a separate service folder or repo.

Suggested FastAPI files:

- `rag_api/main.py`
- `rag_api/config.py`
- `rag_api/models.py`
- `rag_api/routes/query.py`
- `rag_api/routes/health.py`
- `rag_api/services/retriever.py`
- `rag_api/services/answer_builder.py`
- `rag_api/services/artifact_loader.py`
- `rag_api/services/intent_classifier.py`

### Step 5

Expose chat/query endpoints from FastAPI.

Suggested endpoints:

- `POST /query`
- `POST /retrieve`
- `GET /health`
- `POST /reload-artifacts`

### Step 6

Point the Next.js frontend to the FastAPI service.

Suggested frontend env var:

- `NEXT_PUBLIC_RAG_API_BASE_URL`

The UI should call FastAPI for question answering while keeping visualization in the Next.js app.

---

## FastAPI-Specific Design

### Why FastAPI Fits Well

FastAPI is a good choice here because:

- the RAG layer is naturally API-driven
- Python has better support for retrieval, embeddings, and vector libraries
- you can keep the UI and RAG backend separated cleanly
- background jobs and artifact refresh are easier to add later

### Recommended FastAPI Stack

For MVP:

1. FastAPI
2. Pydantic models for request and response schemas
3. SQLite with FTS5 for keyword retrieval
4. JSONL artifact files loaded into memory or SQLite
5. simple template-based answer formatting

For production:

1. FastAPI
2. Postgres + pgvector
3. Redis cache
4. background artifact rebuild job
5. optional async worker for embedding generation

### Suggested FastAPI Request Shape

```json
{
  "question": "what routes were removed recently",
  "top_k": 5,
  "filters": {
    "entityType": "route_change",
    "changeType": "removed"
  }
}
```

### Suggested FastAPI Response Shape

```json
{
  "intent": "route_question",
  "answer": "3 main routes were removed...",
  "records": [
    {
      "entityType": "route_change",
      "path": "/.../suppliers",
      "changeType": "removed"
    }
  ],
  "tokenUsageEstimate": 1200
}
```

### Recommended FastAPI Endpoints

#### `POST /query`

Full pipeline:

1. classify question
2. retrieve records
3. build compact answer
4. return answer plus supporting records

#### `POST /retrieve`

Debug endpoint for retrieval only.

Use this while tuning ranking and filters.

#### `POST /reload-artifacts`

Reload JSONL or database records after regenerating artifacts.

#### `GET /health`

Basic health check for deployment.

### Recommended Python Modules

If you want to keep token use low, start with:

- `fastapi`
- `uvicorn`
- `pydantic`
- `sqlite3` or `sqlmodel`
- `orjson`

Only add heavier libraries later if needed:

- `sentence-transformers`
- `pgvector`
- `langchain` or `llama-index`

For this use case, avoid heavy frameworks early unless they solve a real problem.

---

## Updated Repo Boundary

Use this repo for:

1. computing diffs
2. generating compact RAG artifacts
3. serving the visualization UI

Use FastAPI for:

1. retrieval
2. intent classification
3. answer building
4. caching
5. optional embedding search

This keeps responsibilities clear and helps control tokens and latency.

---

## MVP Plan

If you want the fastest working version, do this first:

1. build compact route and schema JSONL files
2. use keyword plus metadata retrieval only
3. answer with templates for common question types
4. add embeddings later only if needed

This is enough for:

- deleted routes
- added routes
- modified routes
- route changes by module
- schema changes by name
- routes impacted by schema

This gives strong results with very low token usage.

---

## Production Plan

After MVP works, add:

1. embeddings for semantic questions
2. module summaries
3. daily artifact rebuilds
4. cached top questions
5. evaluation dataset of real user questions

---

## Evaluation Checklist

Before calling it complete, test questions like:

1. What routes were removed?
2. What changed recently?
3. What changed in supplier routes?
4. What changed in schema Supplier?
5. Which routes were impacted by Supplier schema?
6. Show me the major modified APIs.
7. What was added in 26B?
8. Which routes changed under orders?

Measure:

- retrieval precision
- token count per answer
- answer latency
- hallucination rate

---

## Final Recommendation

The best approach is:

1. keep the current diff engine
2. create compact RAG artifacts from the diff output
3. retrieve from route/schema/module summaries, not raw specs
4. use hybrid search with strong metadata filters
5. send only a few compact records to the LLM

That will give you a system that is:

- cheaper
- faster
- more accurate
- much easier to control for route and schema change questions

---

## Next Build Order

Implement in this order:

1. artifact builder
2. JSONL artifacts
3. FastAPI retrieval service
4. FastAPI answer formatter
5. FastAPI query endpoints
6. UI query panel wired to FastAPI
7. optional embeddings

If needed, the next concrete step after this document is to implement the artifact builder so the repo can generate the compact RAG documents automatically.

---

## Session-Aware Query Support (Backend Changes Required)

### Request/Response Model Updates

Add `session_id` to the Pydantic models for `POST /query`:

```python
class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    use_llm: bool = True
    llm_model: str = "gemini-2.5-flash"
    session_id: Optional[str] = None   # NEW

class QueryResponse(BaseModel):
    intent: str
    entity_hint: Optional[str]
    answer: str
    records_used: RecordsUsed
    context_text: str
    session_id: Optional[str] = None   # echo back
```

### Per-Session Context Store

Use a simple in-memory dict keyed by `session_id`. Store only:

```python
session_store: dict[str, dict] = {}

# Per-session keys:
# "last_intent"        – e.g. "schema"
# "last_entity_hint"   – e.g. "Supplier"
# "last_schema_name"   – e.g. "activeLocators-item-response"
```

Populate after every successful query. The store is process-scoped (no persistence needed for MVP).

### Follow-up Prompt Resolution

Before intent classification, check for follow-up triggers:

```python
FOLLOWUP_PHRASES = ["compare both", "previous schema", "earlier one", "that schema", "same schema"]

def resolve_followup(question: str, session: dict) -> str | None:
    q = question.lower()
    if any(p in q for p in FOLLOWUP_PHRASES):
        return session.get("last_schema_name")
    return None
```

If a prior schema is resolved, skip intent classification and force `intent = "schema"` with the resolved name.

### Schema Intent Extraction Fix

Current extraction likely fails on names containing hyphens (e.g. `activeLocators-item-response`).

Fix the regex to allow hyphens and dots:

```python
import re

SCHEMA_NAME_RE = re.compile(r"\b([A-Za-z][A-Za-z0-9\-\.]+(?:response|request|item|summary|detail|record))\b", re.IGNORECASE)

def extract_schema_hint(question: str) -> str | None:
    match = SCHEMA_NAME_RE.search(question)
    return match.group(1) if match else None
```

### Schema Retrieval Order

When `intent == "schema"`, retrieve in this priority order:

1. **Exact match** — `schema_name.lower() == hint.lower()`
2. **Partial match** — `hint.lower() in schema_name.lower()`
3. **Token scoring** — split hint on `-` and `.`, score by overlap with schema name tokens

```python
def find_schema_records(records: list[dict], hint: str) -> list[dict]:
    h = hint.lower()
    exact = [r for r in records if r["schema_name"].lower() == h]
    if exact:
        return exact

    partial = [r for r in records if h in r["schema_name"].lower()]
    if partial:
        return partial

    tokens = set(re.split(r"[-.]", h))
    scored = sorted(
        records,
        key=lambda r: len(tokens & set(re.split(r"[-.]", r["schema_name"].lower()))),
        reverse=True,
    )
    return scored[:5]
```

### Schema Answer Formatting

When answering schema questions, structure the answer as:

```
Schema: activeLocators-item-response
Change type: modified
Fields added (2): fieldA, fieldB
Fields removed (1): fieldC
Fields modified (3): fieldD (type changed), fieldE (description changed), fieldF (required added)
Impacted routes (4): GET /resources/.../activeLocators, ...
```

Build this from the schema change record rather than asking the LLM to format it — pass the pre-formatted string as context and instruct the LLM to summarize/explain it.

### Acceptance Test Sequence

1. `POST /query` — `{ "question": "Tell me changes in activeLocators-item-response", "session_id": "abc123" }`
   - Expected: `intent = "schema"`, answer contains field diffs, `session_id = "abc123"` echoed back
2. `POST /query` — `{ "question": "Compare both", "session_id": "abc123" }`
   - Expected: session resolves `last_schema_name = "activeLocators-item-response"`, same schema diff returned
   - No fallback "No change records were retrieved"