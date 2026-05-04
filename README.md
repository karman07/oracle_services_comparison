# Oracle SCM Release Notes Simplifier

Compare Oracle Fusion SCM OpenAPI specs (25C vs 26B) and view API path, schema, and tag-level differences.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Ensure the JSON specs exist in the data folder:

- data/openapi_scm_25c.json
- data/openapi_scm_26b.json

Large repository-safe alternative:

- data/openapi_scm_25c.parts/*.part
- data/openapi_scm_26b.parts/*.part

3. Optional: copy environment defaults:

```bash
cp .env.example .env.local
```

4. Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Deployment Preparation (JSON Files + Env)

The API route app/api/diff reads specs from env-configured paths with fallbacks.

If OPENAPI_25C_URL and OPENAPI_26B_URL are set, remote JSON files are used instead of local file paths.

Default lookup order:

1. OPENAPI_25C_PATH (or data/openapi_scm_25c.json)
2. openapi_scm_25c.json (legacy fallback)

and

1. OPENAPI_26B_PATH (or data/openapi_scm_26b.json)
2. openapi_scm_26b (1).json (legacy fallback)

If a .json file is not present, the API also checks for a matching chunk directory such as data/openapi_scm_25c.parts/ and reconstructs the JSON from sorted .part files.

### Recommended production setup

1. Commit both files under data/:

- data/openapi_scm_25c.json
- data/openapi_scm_26b.json

If GitHub size limits block those files, commit chunk directories instead:

- data/openapi_scm_25c.parts/
- data/openapi_scm_26b.parts/

2. Set deployment env vars (optional, but recommended):

- OPENAPI_25C_PATH=data/openapi_scm_25c.json
- OPENAPI_26B_PATH=data/openapi_scm_26b.json

Alternative for large files in serverless environments:

- OPENAPI_25C_URL=https://your-storage.example.com/openapi_scm_25c.json
- OPENAPI_26B_URL=https://your-storage.example.com/openapi_scm_26b.json

3. Build and run:

```bash
npm run build
npm run start
```

## Notes for Vercel / Serverless

- By default on Vercel builds, local OpenAPI files are not traced into serverless output to avoid oversized deployment artifacts.
- Set OPENAPI_25C_URL and OPENAPI_26B_URL in Vercel environment variables.
- If you must ship local files in Vercel, set OPENAPI_FORCE_LOCAL_TRACE=1 (only if artifact size remains within Vercel limits).
- If you change file names/locations, update env vars accordingly.
- For very large specs, prefer OPENAPI_*_URL so JSON is fetched at runtime instead of bundled.

## Scripts

- npm run dev: start local dev server
- npm run build: production build
- npm run start: run built app
- npm run lint: lint code
