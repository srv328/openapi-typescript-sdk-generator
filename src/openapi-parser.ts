/**
 * OpenAPI specification parser with $ref support
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { OpenAPISpec, EndpointInfo, Parameter, RequestBody, Response, Schema } from './types';
const $RefParser = require('json-schema-ref-parser');

/**
 * Load and parse OpenAPI specification from file (JSON or YAML)
 */
export async function loadOpenAPISpec(filePath: string): Promise<OpenAPISpec> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();
  
  let spec: any;
  
  if (ext === '.yaml' || ext === '.yml') {
    spec = yaml.load(content);
  } else {
    spec = JSON.parse(content);
  }
  
  // Resolve all $ref links
  const resolved = await $RefParser.dereference(spec, {
    resolve: {
      file: {
        canRead: true
      },
      http: {
        canRead: true
      }
    }
  });
  
  return resolved as OpenAPISpec;
}

/**
 * Extract information about all endpoints from specification
 */
export function extractEndpoints(spec: OpenAPISpec): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];
  
  for (const [pathPattern, pathItem] of Object.entries(spec.paths)) {
    const methods: Array<'get' | 'post' | 'put' | 'delete' | 'patch'> = ['get', 'post', 'put', 'delete', 'patch'];
    
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;
      
      const operationId = operation.operationId || generateOperationId(pathPattern, method.toUpperCase());
      
      // Collect all parameters
      const allParams = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || [])
      ];
      
      const pathParams = allParams.filter(p => p.in === 'path');
      const queryParams = allParams.filter(p => p.in === 'query');
      
      // Process requestBody
      let requestBody: RequestBody | undefined;
      if (operation.requestBody) {
        if ('$ref' in operation.requestBody) {
          requestBody = operation.requestBody as RequestBody;
        } else {
          requestBody = operation.requestBody;
        }
      }
      
      const responses: Record<string, Response> = {};
      for (const [statusCode, response] of Object.entries(operation.responses)) {
        if ('$ref' in response) {
          responses[statusCode] = response as Response;
        } else {
          responses[statusCode] = response;
        }
      }
      
      endpoints.push({
        path: pathPattern,
        method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        operationId,
        summary: operation.summary,
        description: operation.description,
        pathParams,
        queryParams,
        requestBody,
        responses,
        tags: operation.tags
      });
    }
  }
  
  return endpoints;
}

/**
 * Generate operationId from path and method, if it is not specified
 */
function generateOperationId(path: string, method: string): string {
  const pathParts = path
    .split('/')
    .filter(p => p && !p.startsWith('{'))
    .map(p => p.replace(/[{}]/g, '').replace(/-/g, '_'))
    .map(p => p.charAt(0).toUpperCase() + p.slice(1));
  
  const methodLower = method.toLowerCase();
  
  if (pathParts.length === 0) {
    return `${methodLower}Root`;
  }
  
  return methodLower + pathParts.join('');
}

/**
 * Get schema from RequestBody or Response
 */
export function getSchemaFromContent(content?: Record<string, { schema?: Schema | { $ref: string } } | undefined>): Schema | undefined {
  if (!content) return undefined;
  
  // Priority: application/json
  const jsonContent = content['application/json'];
  if (jsonContent?.schema) {
    return jsonContent.schema as Schema;
  }
  
  // Otherwise take the first available schema (filter out undefined)
  const firstContent = Object.values(content).find(item => item !== undefined);
  return firstContent?.schema as Schema | undefined;
}

/**
 * Check if schema is a link
 */
export function isRef(schema: Schema | { $ref: string } | undefined): schema is { $ref: string } {
  return schema !== undefined && '$ref' in schema;
}

/**
 * Extract type name from $ref
 */
export function getRefTypeName(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

