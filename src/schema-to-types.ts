/**
 * Generator TypeScript types from JSON Schema
 */

import { Schema, Parameter, RequestBody } from './types';
import { isRef, getRefTypeName, getSchemaFromContent } from './openapi-parser';

/**
 * Generate TypeScript type from schema
 */
export function schemaToType(schema: Schema | { $ref: string } | undefined, indent = 0): string {
  if (!schema) return 'any';
  
  if (isRef(schema)) {
    return getRefTypeName(schema.$ref);
  }
  
  const indentStr = '  '.repeat(indent);
  
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        return schema.enum.map(v => `'${v}'`).join(' | ');
      }
      if (schema.format === 'date-time') {
        return 'string'; // Can be extended to Date
      }
      return 'string';
      
    case 'number':
    case 'integer':
      return schema.type === 'integer' ? 'number' : 'number';
      
    case 'boolean':
      return 'boolean';
      
    case 'array':
      if (schema.items) {
        const itemType = schemaToType(schema.items, indent);
        return `Array<${itemType}>`;
      }
      return 'any[]';
      
    case 'object':
      if (!schema.properties) {
        if (schema.additionalProperties === false) {
          return 'Record<string, never>';
        }
        if (schema.additionalProperties) {
          const valueType = schemaToType(schema.additionalProperties as Schema, indent);
          return `Record<string, ${valueType}>`;
        }
        return 'Record<string, any>';
      }
      
      const required = schema.required || [];
      const props = Object.entries(schema.properties)
        .map(([key, value]) => {
          const isRequired = required.includes(key);
          const propType = schemaToType(value, indent + 1);
          return `${indentStr}  ${key}${isRequired ? '' : '?'}: ${propType};`;
        })
        .join('\n');
      
      return `{\n${props}\n${indentStr}}`;
      
    default:
      // Process allOf, oneOf, anyOf
      if (schema.allOf) {
        const types = schema.allOf.map(s => schemaToType(s, indent + 1));
        return types.join(' & ');
      }
      if (schema.oneOf || schema.anyOf) {
        const types = (schema.oneOf || schema.anyOf || []).map(s => schemaToType(s, indent + 1));
        return `(${types.join(' | ')})`;
      }
      
      return 'any';
  }
}

/**
 * Generate interface for parameters of endpoint
 */
export function generateParamsInterface(
  pathParams: Parameter[],
  queryParams: Parameter[],
  endpointName: string
): string {
  const interfaces: string[] = [];
  
  if (pathParams.length > 0) {
    const pathProps = pathParams
      .map(p => {
        const type = schemaToType(p.schema);
        return `  ${p.name}: ${type};`;
      })
      .join('\n');
    
    interfaces.push(`export interface ${endpointName}PathParams {\n${pathProps}\n}`);
  }
  
  if (queryParams.length > 0) {
    const queryProps = queryParams
      .map(p => {
        const type = schemaToType(p.schema);
        const optional = p.required ? '' : '?';
        return `  ${p.name}${optional}: ${type};`;
      })
      .join('\n');
    
    interfaces.push(`export interface ${endpointName}QueryParams {\n${queryProps}\n}`);
  }
  
  return interfaces.join('\n\n');
}

/**
 * Generate type for request body
 */
export function generateRequestBodyType(requestBody: RequestBody | undefined, endpointName: string): string {
  if (!requestBody) return '';
  
  const schema = getSchemaFromContent(requestBody.content);
  if (!schema) return '';
  
  const type = schemaToType(schema);
  
  // If this is a simple type, create an alias
  if (type.includes('\n')) {
    // Complex object - create an interface
    return `export interface ${endpointName}RequestBody ${type}\n`;
  } else {
    // Simple type - create a type alias
    return `export type ${endpointName}RequestBody = ${type};\n`;
  }
}

/**
 * Generate type for response
 */
export function generateResponseType(response: any, endpointName: string, statusCode: string): string {
  if (!response) return 'any';
  
  const schema = getSchemaFromContent(response.content as any);
  if (!schema) return 'any';
  
  const type = schemaToType(schema);
  return type;
}

