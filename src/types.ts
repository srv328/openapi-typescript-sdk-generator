/**
 * Types for working with OpenAPI specifications
 */

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    parameters?: Record<string, Parameter>;
    requestBodies?: Record<string, RequestBody>;
    responses?: Record<string, Response>;
  };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
  parameters?: Parameter[];
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody | { $ref: string };
  responses: Record<string, Response | { $ref: string }>;
  tags?: string[];
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: Schema | { $ref: string };
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content?: {
    'application/json'?: {
      schema?: Schema | { $ref: string };
    };
    [key: string]: {
      schema?: Schema | { $ref: string };
    } | undefined;
  };
}

export interface Response {
  description?: string;
  content?: {
    'application/json'?: {
      schema?: Schema | { $ref: string };
    };
    [key: string]: {
      schema?: Schema | { $ref: string };
    } | undefined;
  };
}

export interface Schema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  enum?: any[];
  items?: Schema | { $ref: string };
  properties?: Record<string, Schema | { $ref: string }>;
  required?: string[];
  additionalProperties?: boolean | Schema | { $ref: string };
  $ref?: string;
  allOf?: Array<Schema | { $ref: string }>;
  oneOf?: Array<Schema | { $ref: string }>;
  anyOf?: Array<Schema | { $ref: string }>;
}

export interface EndpointInfo {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  operationId: string;
  summary?: string;
  description?: string;
  pathParams: Parameter[];
  queryParams: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  tags?: string[];
}

export interface GenerationOptions {
  inputFiles: string[];
  outputDir: string;
  baseUrl?: string;
  axiosInstance?: string;
}


