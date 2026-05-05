import type {
  OpenApiSpec,
  PathItem,
  OperationObject,
  SchemaObject,
  HttpMethod,
  PathDiff,
  SchemaDiff,
  TagDiff,
  SchemaFieldDiff,
  DiffResult,
  MethodDiff,
  ChangeType,
  SchemaRouteUsage,
  RouteSchemaChangeType,
} from '../types/diff.types';

const HTTP_METHODS: HttpMethod[] = [
  'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace',
];

function getPathMethods(item: PathItem): HttpMethod[] {
  return HTTP_METHODS.filter((m) => m in item);
}

function operationFingerprint(op: OperationObject): string {
  const params = (op.parameters ?? [])
    .map((p) => `${p.name}:${p.in}`)
    .sort()
    .join(',');
  const responses = Object.keys(op.responses ?? {}).sort().join(',');
  const summary = op.summary ?? '';
  return `params=${params}|responses=${responses}|summary=${summary}`;
}

function comparePathItem(
  path: string,
  oldItem: PathItem,
  newItem: PathItem,
): PathDiff {
  const oldMethodList = getPathMethods(oldItem).map((m) => m.toUpperCase());
  const newMethodList = getPathMethods(newItem).map((m) => m.toUpperCase());
  const oldMethods = new Set(getPathMethods(oldItem));
  const newMethods = new Set(getPathMethods(newItem));

  const added: string[] = [...newMethods]
    .filter((m) => !oldMethods.has(m))
    .map((m) => m.toUpperCase());
  const removed: string[] = [...oldMethods]
    .filter((m) => !newMethods.has(m))
    .map((m) => m.toUpperCase());
  const modified: string[] = [];
  const details: string[] = [];

  for (const method of oldMethods) {
    if (!newMethods.has(method)) continue;
    const oldOp = oldItem[method] as OperationObject | undefined;
    const newOp = newItem[method] as OperationObject | undefined;
    if (!oldOp || !newOp) continue;
    if (operationFingerprint(oldOp) !== operationFingerprint(newOp)) {
      modified.push(method.toUpperCase());
      if (oldOp.summary !== newOp.summary) {
        details.push(
          `${method.toUpperCase()} summary changed: "${oldOp.summary ?? ''}" → "${newOp.summary ?? ''}"`,
        );
      }
      const oldParams = new Set(
        (oldOp.parameters ?? []).map((p) => `${p.name}:${p.in}`),
      );
      const newParams = new Set(
        (newOp.parameters ?? []).map((p) => `${p.name}:${p.in}`),
      );
      for (const p of newParams) {
        if (!oldParams.has(p)) details.push(`${method.toUpperCase()} param added: ${p}`);
      }
      for (const p of oldParams) {
        if (!newParams.has(p)) details.push(`${method.toUpperCase()} param removed: ${p}`);
      }
    }
  }

  // Don't add method-added/removed lines — they're shown via method badges
  // Only keep meaningful operation-level details (param / summary changes)
  const methods: MethodDiff = { added, removed, modified };
  return {
    path,
    changeType: 'modified',
    oldMethods: oldMethodList,
    newMethods: newMethodList,
    methods,
    details,
  };
}

function flattenProperties(
  schema: SchemaObject,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};
  const props = schema.properties ?? {};
  for (const [key, val] of Object.entries(props)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    result[fullKey] = val.type ?? (val.$ref ? `$ref:${val.$ref}` : 'object');
    if (val.properties) {
      Object.assign(result, flattenProperties(val, fullKey));
    }
  }
  return result;
}

function diffSchemas(
  name: string,
  oldSchema: SchemaObject,
  newSchema: SchemaObject,
): Omit<SchemaDiff, 'impactedRoutes'> {
  const oldFields = flattenProperties(oldSchema);
  const newFields = flattenProperties(newSchema);
  const fieldDiffs: SchemaFieldDiff[] = [];

  const allFields = new Set([
    ...Object.keys(oldFields),
    ...Object.keys(newFields),
  ]);

  for (const field of allFields) {
    const inOld = field in oldFields;
    const inNew = field in newFields;
    if (inOld && !inNew) {
      fieldDiffs.push({
        fieldName: field,
        changeType: 'removed',
        oldType: oldFields[field],
      });
    } else if (!inOld && inNew) {
      fieldDiffs.push({
        fieldName: field,
        changeType: 'added',
        newType: newFields[field],
      });
    } else if (oldFields[field] !== newFields[field]) {
      fieldDiffs.push({
        fieldName: field,
        changeType: 'modified',
        oldType: oldFields[field],
        newType: newFields[field],
      });
    }
  }

  return { schemaName: name, changeType: 'modified', fieldDiffs };
}

const CHANGE_ORDER: Record<ChangeType, number> = {
  added: 0,
  removed: 1,
  modified: 2,
};

const SCHEMA_ROUTE_CHANGE_ORDER: Record<RouteSchemaChangeType, number> = {
  updated: 0,
  added: 1,
  removed: 2,
  unchanged: 3,
};

function toRefName(ref: string): string {
  const marker = '#/components/schemas/';
  return ref.startsWith(marker) ? ref.slice(marker.length) : ref;
}

function collectSchemaRefsFromSchema(schema: SchemaObject | undefined, refs: Set<string>) {
  if (!schema) return;

  if (schema.$ref) {
    refs.add(toRefName(schema.$ref));
  }

  if (schema.properties) {
    for (const value of Object.values(schema.properties)) {
      collectSchemaRefsFromSchema(value, refs);
    }
  }

  if (schema.items) {
    collectSchemaRefsFromSchema(schema.items, refs);
  }

  if (Array.isArray(schema.allOf)) {
    for (const entry of schema.allOf) collectSchemaRefsFromSchema(entry, refs);
  }
  if (Array.isArray(schema.oneOf)) {
    for (const entry of schema.oneOf) collectSchemaRefsFromSchema(entry, refs);
  }
  if (Array.isArray(schema.anyOf)) {
    for (const entry of schema.anyOf) collectSchemaRefsFromSchema(entry, refs);
  }

  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    collectSchemaRefsFromSchema(schema.additionalProperties, refs);
  }
}

function collectSchemaRefsFromOperation(op: OperationObject): Set<string> {
  const refs = new Set<string>();

  for (const parameter of op.parameters ?? []) {
    collectSchemaRefsFromSchema(parameter.schema, refs);
  }

  for (const media of Object.values(op.requestBody?.content ?? {})) {
    collectSchemaRefsFromSchema(media.schema, refs);
  }

  for (const response of Object.values(op.responses ?? {})) {
    for (const media of Object.values(response.content ?? {})) {
      collectSchemaRefsFromSchema(media.schema, refs);
    }
  }

  return refs;
}

function getSchemaRouteUsage(spec: OpenApiSpec): Map<string, Set<string>> {
  const usage = new Map<string, Set<string>>();

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of getPathMethods(pathItem)) {
      const op = pathItem[method] as OperationObject | undefined;
      if (!op) continue;

      const routeKey = `${method.toUpperCase()} ${path}`;
      const refs = collectSchemaRefsFromOperation(op);

      for (const schemaName of refs) {
        const existing = usage.get(schemaName) ?? new Set<string>();
        existing.add(routeKey);
        usage.set(schemaName, existing);
      }
    }
  }

  return usage;
}

function classifySchemaRouteUsage(
  routeKey: string,
  in25c: boolean,
  in26b: boolean,
  updatedRouteKeys: Set<string>,
): SchemaRouteUsage {
  const firstSpace = routeKey.indexOf(' ');
  const method = routeKey.slice(0, firstSpace);
  const path = routeKey.slice(firstSpace + 1);

  let changeType: RouteSchemaChangeType = 'unchanged';
  if (in25c && !in26b) {
    changeType = 'removed';
  } else if (!in25c && in26b) {
    changeType = 'added';
  } else if (updatedRouteKeys.has(routeKey)) {
    changeType = 'updated';
  }

  return { path, method, changeType, in25c, in26b };
}

function getUpdatedRouteKeys(pathDiffs: PathDiff[]): Set<string> {
  const updated = new Set<string>();

  for (const pathDiff of pathDiffs) {
    const changedMethods = [
      ...(pathDiff.methods?.added ?? []),
      ...(pathDiff.methods?.removed ?? []),
      ...(pathDiff.methods?.modified ?? []),
    ];

    for (const method of changedMethods) {
      updated.add(`${method.toUpperCase()} ${pathDiff.path}`);
    }
  }

  return updated;
}

function mapSchemaImpactedRoutes(
  schemaName: string,
  usage25c: Map<string, Set<string>>,
  usage26b: Map<string, Set<string>>,
  updatedRouteKeys: Set<string>,
): SchemaRouteUsage[] {
  const inOld = usage25c.get(schemaName) ?? new Set<string>();
  const inNew = usage26b.get(schemaName) ?? new Set<string>();
  const routeKeys = new Set<string>([...inOld, ...inNew]);

  return [...routeKeys]
    .map((routeKey) => classifySchemaRouteUsage(routeKey, inOld.has(routeKey), inNew.has(routeKey), updatedRouteKeys))
    .sort((a, b) => {
      const changeOrder = SCHEMA_ROUTE_CHANGE_ORDER[a.changeType] - SCHEMA_ROUTE_CHANGE_ORDER[b.changeType];
      if (changeOrder !== 0) return changeOrder;
      const pathOrder = a.path.localeCompare(b.path);
      if (pathOrder !== 0) return pathOrder;
      return a.method.localeCompare(b.method);
    });
}

export function computeDiff(
  spec25c: OpenApiSpec,
  spec26b: OpenApiSpec,
): DiffResult {
  // ── Paths ─────────────────────────────────────────────────────────────────
  const paths25c = new Set(Object.keys(spec25c.paths ?? {}));
  const paths26b = new Set(Object.keys(spec26b.paths ?? {}));
  const pathDiffs: PathDiff[] = [];

  for (const path of paths26b) {
    if (!paths25c.has(path)) {
      const item = spec26b.paths[path];
      const methods = getPathMethods(item).map((m) => m.toUpperCase());
      pathDiffs.push({
        path,
        changeType: 'added',
        oldMethods: [],
        newMethods: methods,
        methods: { added: methods, removed: [], modified: [] },
        details: [],
      });
    }
  }

  for (const path of paths25c) {
    if (!paths26b.has(path)) {
      const item = spec25c.paths[path];
      const methods = getPathMethods(item).map((m) => m.toUpperCase());
      pathDiffs.push({
        path,
        changeType: 'removed',
        oldMethods: methods,
        newMethods: [],
        methods: { added: [], removed: methods, modified: [] },
        details: [],
      });
    }
  }

  for (const path of paths25c) {
    if (paths26b.has(path)) {
      const diff = comparePathItem(
        path,
        spec25c.paths[path],
        spec26b.paths[path],
      );
      const hasChanges =
        diff.methods!.added.length > 0 ||
        diff.methods!.removed.length > 0 ||
        diff.methods!.modified.length > 0;
      if (hasChanges) pathDiffs.push(diff);
    }
  }

  pathDiffs.sort(
    (a, b) =>
      CHANGE_ORDER[a.changeType] - CHANGE_ORDER[b.changeType] ||
      a.path.localeCompare(b.path),
  );

  const updatedRouteKeys = getUpdatedRouteKeys(pathDiffs);
  const schemaRouteUsage25c = getSchemaRouteUsage(spec25c);
  const schemaRouteUsage26b = getSchemaRouteUsage(spec26b);

  // ── Schemas ───────────────────────────────────────────────────────────────
  const schemas25c = spec25c.components?.schemas ?? {};
  const schemas26b = spec26b.components?.schemas ?? {};
  const names25c = new Set(Object.keys(schemas25c));
  const names26b = new Set(Object.keys(schemas26b));
  const schemaDiffs: SchemaDiff[] = [];

  for (const name of names26b) {
    if (!names25c.has(name)) {
      schemaDiffs.push({
        schemaName: name,
        changeType: 'added',
        oldSchema: undefined,
        newSchema: schemas26b[name],
        fieldDiffs: [],
        impactedRoutes: mapSchemaImpactedRoutes(name, schemaRouteUsage25c, schemaRouteUsage26b, updatedRouteKeys),
      });
    }
  }
  for (const name of names25c) {
    if (!names26b.has(name)) {
      schemaDiffs.push({
        schemaName: name,
        changeType: 'removed',
        oldSchema: schemas25c[name],
        newSchema: undefined,
        fieldDiffs: [],
        impactedRoutes: mapSchemaImpactedRoutes(name, schemaRouteUsage25c, schemaRouteUsage26b, updatedRouteKeys),
      });
    }
  }
  for (const name of names25c) {
    if (names26b.has(name)) {
      const diff = diffSchemas(name, schemas25c[name], schemas26b[name]);
      if (diff.fieldDiffs.length > 0) {
        schemaDiffs.push({
          ...diff,
          oldSchema: schemas25c[name],
          newSchema: schemas26b[name],
          impactedRoutes: mapSchemaImpactedRoutes(name, schemaRouteUsage25c, schemaRouteUsage26b, updatedRouteKeys),
        });
      }
    }
  }

  schemaDiffs.sort(
    (a, b) =>
      CHANGE_ORDER[a.changeType] - CHANGE_ORDER[b.changeType] ||
      a.schemaName.localeCompare(b.schemaName),
  );

  // ── Tags ──────────────────────────────────────────────────────────────────
  const tags25c = new Map(
    (spec25c.tags ?? []).map((t) => [t.name, t]),
  );
  const tags26b = new Map(
    (spec26b.tags ?? []).map((t) => [t.name, t]),
  );
  const tagDiffs: TagDiff[] = [];

  for (const [name, tag] of tags26b) {
    if (!tags25c.has(name)) {
      tagDiffs.push({
        tagName: name,
        changeType: 'added',
        description: tag.description,
      });
    }
  }
  for (const [name, tag] of tags25c) {
    if (!tags26b.has(name)) {
      tagDiffs.push({
        tagName: name,
        changeType: 'removed',
        description: tag.description,
      });
    }
  }

  tagDiffs.sort(
    (a, b) =>
      CHANGE_ORDER[a.changeType] - CHANGE_ORDER[b.changeType] ||
      a.tagName.localeCompare(b.tagName),
  );

  const summary = {
    pathsAdded: pathDiffs.filter((p) => p.changeType === 'added').length,
    pathsRemoved: pathDiffs.filter((p) => p.changeType === 'removed').length,
    pathsModified: pathDiffs.filter((p) => p.changeType === 'modified').length,
    schemasAdded: schemaDiffs.filter((s) => s.changeType === 'added').length,
    schemasRemoved: schemaDiffs.filter((s) => s.changeType === 'removed').length,
    schemasModified: schemaDiffs.filter((s) => s.changeType === 'modified').length,
    tagsAdded: tagDiffs.filter((t) => t.changeType === 'added').length,
    tagsRemoved: tagDiffs.filter((t) => t.changeType === 'removed').length,
  };

  return { pathDiffs, schemaDiffs, tagDiffs, summary };
}
