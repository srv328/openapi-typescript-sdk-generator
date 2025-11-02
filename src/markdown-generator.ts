/**
 * Generator Markdown documentation
 */

import * as fs from 'fs';
import * as path from 'path';
import { EndpointInfo, OpenAPISpec, GenerationOptions } from './types';
import { extractEndpoints, getSchemaFromContent } from './openapi-parser';
import { schemaToType } from './schema-to-types';

/**
 * Generate Markdown table of parameters
 */
function generateParamsTable(params: any[], title: string): string {
  if (params.length === 0) return '';
  
  let table = `### ${title}\n\n`;
  table += '| Parameter | Type | Required | Description |\n';
  table += '|----------|-----|--------------|----------|\n';
  
  for (const param of params) {
    const type = schemaToType(param.schema);
    const required = param.required ? 'Yes' : 'No';
    const description = param.description || '-';
    
    table += `| \`${param.name}\` | \`${type}\` | ${required} | ${description} |\n`;
  }
  
  return table + '\n';
}

/**
 * Generate schema description in Markdown
 */
function generateSchemaDescription(schema: any, indent = 0): string {
  if (!schema) return '`any`';
  
  const indentStr = '  '.repeat(indent);
  
  if (schema.$ref) {
    return `\`${schema.$ref.split('/').pop()}\``;
  }
  
  switch (schema.type) {
    case 'string':
    case 'number':
    case 'integer':
    case 'boolean':
      return `\`${schema.type}\``;
      
    case 'array':
      const itemType = generateSchemaDescription(schema.items, indent);
      return `\`Array<${itemType}>\``;
      
    case 'object':
      if (!schema.properties) {
        return '`object`';
      }
      
      const required = schema.required || [];
      const props = Object.entries(schema.properties)
        .map(([key, value]: [string, any]) => {
          const isRequired = required.includes(key) ? '**' : '';
          const propType = generateSchemaDescription(value, indent + 1);
          return `${indentStr}- ${isRequired}${key}${isRequired}: ${propType}`;
        })
        .join('\n');
      
      return `\n${indentStr}{\n${props}\n${indentStr}}`;
      
    default:
      return '`any`';
  }
}

/**
 * Generate Markdown for one endpoint
 */
function generateEndpointMarkdown(endpoint: EndpointInfo): string {
  const { path, method, operationId, summary, description, pathParams, queryParams, requestBody, responses } = endpoint;
  
  let md = `## ${method} ${path}\n\n`;
  
  if (summary) {
    md += `**${summary}**\n\n`;
  }
  
  if (description) {
    md += `${description}\n\n`;
  }
  
  // Operation ID
  md += `**Operation ID:** \`${operationId}\`\n\n`;
  
  // Path parameters
  if (pathParams.length > 0) {
    md += generateParamsTable(pathParams, 'Path Parameters');
  }
  
  // Query parameters
  if (queryParams.length > 0) {
    md += generateParamsTable(queryParams, 'Query Parameters');
  }
  
  // Request Body
  if (requestBody) {
    md += `### Request Body\n\n`;
    const schema = getSchemaFromContent(requestBody.content as any);
    if (schema) {
      md += `**Type:** ${generateSchemaDescription(schema)}\n\n`;
    }
    if (requestBody.description) {
      md += `${requestBody.description}\n\n`;
    }
  }
  
  // Responses
  md += `### Responses\n\n`;
  for (const [statusCode, response] of Object.entries(responses)) {
    md += `#### ${statusCode}\n\n`;
    if (response.description) {
      md += `${response.description}\n\n`;
    }
    
    const schema = getSchemaFromContent(response.content as any);
    if (schema) {
      md += `**Type:** ${generateSchemaDescription(schema)}\n\n`;
    }
  }
  
  // Example usage of SDK
  md += `### Example usage of SDK\n\n`;
  md += `\`\`\`typescript\n`;
  md += `import { ${operationId} } from './sdk';\n\n`;
  
  const params: string[] = [];
  if (pathParams.length > 0) {
    params.push(`path: {\n${pathParams.map(p => `    ${p.name}: ${p.required ? 'value' : 'value?'}`).join(',\n')}\n  }`);
  }
  if (queryParams.length > 0) {
    params.push(`query: {\n${queryParams.filter(p => !p.required).map(p => `    ${p.name}: 'value'`).join(',\n')}\n  }`);
  }
  if (requestBody) {
    params.push(`body: { /* request body */ }`);
  }
  
  md += `const result = await ${operationId}({\n  ${params.join(',\n  ')}\n});\n`;
  md += `\`\`\`\n\n`;
  
  // Example usage of React hook
  md += `### Пример использования React хука\n\n`;
  md += `\`\`\`tsx\n`;
  md += `import { use${operationId.charAt(0).toUpperCase() + operationId.slice(1)} } from './hooks';\n\n`;
  
  const hookParams: string[] = [];
  if (pathParams.length > 0) {
    hookParams.push(`path: {\n    ${pathParams.map(p => `${p.name}: 'value'`).join(',\n    ')}\n  }`);
  }
  if (queryParams.length > 0) {
    hookParams.push(`query: {\n    ${queryParams.filter(p => !p.required).map(p => `${p.name}: 'value'`).join(',\n    ')}\n  }`);
  }
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (requestBody) {
      hookParams.push(`body: { /* request body */ }`);
    }
    md += `const { mutate, data, loading, error } = use${operationId.charAt(0).toUpperCase() + operationId.slice(1)}({\n  ${hookParams.join(',\n  ')}\n});\n\n`;
    md += `<button onClick={mutate}>Отправить запрос</button>\n`;
  } else {
    md += `const { data, loading, error } = use${operationId.charAt(0).toUpperCase() + operationId.slice(1)}({\n  ${hookParams.join(',\n  ')}\n});\n\n`;
    md += `if (loading) return <div>Загрузка...</div>;\n`;
    md += `if (error) return <div>Ошибка: {error.message}</div>;\n`;
    md += `return <div>{JSON.stringify(data)}</div>;\n`;
  }
  
  md += `\`\`\`\n\n`;
  md += `---\n\n`;
  
  return md;
}

/**
 * Generate full Markdown documentation
 */
export async function generateMarkdown(
  specs: OpenAPISpec[],
  options: GenerationOptions
): Promise<void> {
  const outputDir = options.outputDir;
  
  let md = `# API Documentation\n\n`;
  md += `Automatically generated documentation from OpenAPI specifications.\n\n`;
  md += `## Contents\n\n`;
  
  // Collect all endpoints
  const allEndpoints: EndpointInfo[] = [];
  for (const spec of specs) {
    md += `### ${spec.info.title} (v${spec.info.version})\n\n`;
    if (spec.info.description) {
      md += `${spec.info.description}\n\n`;
    }
    
    const endpoints = extractEndpoints(spec);
    allEndpoints.push(...endpoints);
    
    for (const endpoint of endpoints) {
      const anchor = endpoint.path.replace(/\//g, '-').replace(/{/g, '').replace(/}/g, '');
      md += `- [${endpoint.method} ${endpoint.path}](#${anchor})\n`;
    }
    md += '\n';
  }
  
  md += `---\n\n`;
  
  // Generate documentation for each endpoint
  for (const endpoint of allEndpoints) {
    md += generateEndpointMarkdown(endpoint);
  }
  
  // Write file
  fs.writeFileSync(path.join(outputDir, 'API.md'), md);
}

