export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'head'
  | 'options'
  | 'trace';

export interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  $ref?: string;
  description?: string;
  format?: string;
  enum?: unknown[];
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  additionalProperties?: SchemaObject | boolean;
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
}

export interface RequestBodyObject {
  content?: Record<string, MediaTypeObject>;
  required?: boolean;
  description?: string;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, MediaTypeObject>;
}

export interface OperationObject {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
}

export type PathItem = Partial<Record<HttpMethod, OperationObject>> & {
  summary?: string;
  description?: string;
  parameters?: ParameterObject[];
};

export interface TagObject {
  name: string;
  description?: string;
}

export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
  tags?: TagObject[];
}

export type ChangeType = 'added' | 'removed' | 'modified';
export type RouteSchemaChangeType = 'updated' | 'added' | 'removed' | 'unchanged';

export interface MethodDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

export interface PathDiff {
  path: string;
  changeType: ChangeType;
  oldMethods?: string[];
  newMethods?: string[];
  methods?: MethodDiff;
  details: string[];
}

export interface SchemaFieldDiff {
  fieldName: string;
  changeType: ChangeType;
  oldType?: string;
  newType?: string;
}

export interface SchemaDiff {
  schemaName: string;
  changeType: ChangeType;
  oldSchema?: SchemaObject;
  newSchema?: SchemaObject;
  fieldDiffs: SchemaFieldDiff[];
  impactedRoutes: SchemaRouteUsage[];
}

export interface SchemaRouteUsage {
  path: string;
  method: string;
  changeType: RouteSchemaChangeType;
  in25c: boolean;
  in26b: boolean;
}

export interface TagDiff {
  tagName: string;
  changeType: ChangeType;
  description?: string;
}

export interface DiffSummary {
  pathsAdded: number;
  pathsRemoved: number;
  pathsModified: number;
  schemasAdded: number;
  schemasRemoved: number;
  schemasModified: number;
  tagsAdded: number;
  tagsRemoved: number;
}

export interface DiffResult {
  pathDiffs: PathDiff[];
  schemaDiffs: SchemaDiff[];
  tagDiffs: TagDiff[];
  summary: DiffSummary;
}

export interface UploadedFiles {
  file25c: File | null;
  file26b: File | null;
  spec25c: OpenApiSpec | null;
  spec26b: OpenApiSpec | null;
  error25c: string | null;
  error26b: string | null;
}

export interface FileStats {
  pathCount: number;
  schemaCount: number;
  tagCount: number;
  title: string;
  version: string;
}
