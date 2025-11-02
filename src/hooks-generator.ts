/**
 * Generator React hooks for all endpoints
 */

import * as fs from 'fs';
import * as path from 'path';
import { EndpointInfo, OpenAPISpec, GenerationOptions } from './types';
import { generateParamsInterface, generateRequestBodyType, generateResponseType } from './schema-to-types';
import { extractEndpoints } from './openapi-parser';

/**
 * Generate React hook for endpoint
 */
function generateHook(endpoint: EndpointInfo, axiosInstance = 'axios'): string {
  const { path, method, operationId, pathParams, queryParams, requestBody, responses } = endpoint;
  
  const functionName = operationId;
  const hookName = `use${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`;
  
  // Determine if mutation is needed (POST, PUT, DELETE, PATCH)
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  // Types of parameters
  const pathParamsInterface = pathParams.length > 0 
    ? `${functionName}PathParams` 
    : 'never';
  const queryParamsInterface = queryParams.length > 0 
    ? `${functionName}QueryParams` 
    : 'never';
  const requestBodyType = requestBody 
    ? `${functionName}RequestBody` 
    : 'never';
  
  // Response type
  const successStatus = Object.keys(responses).find(s => s.startsWith('2')) || '200';
  const successResponse = responses[successStatus];
  const responseType = generateResponseType(successResponse, functionName, successStatus);
  
  // Generate URL path
  let urlPath = path;
  pathParams.forEach(param => {
    urlPath = urlPath.replace(`{${param.name}}`, `\${params.path.${param.name}}`);
  });
  
  if (isMutation) {
    // Mutation hook (POST, PUT, DELETE, PATCH)
    const paramsType = `{\n    path${pathParams.length > 0 ? `: ${pathParamsInterface}` : '?: never'};\n    query${queryParams.length > 0 ? `?: ${queryParamsInterface}` : '?: never'};\n    body${requestBody ? `: ${requestBodyType}` : '?: never'};\n  }`;
    
    return `
${generateParamsInterface(pathParams, queryParams, functionName)}

${requestBody ? generateRequestBodyType(requestBody, functionName) : ''}

export function ${hookName}(params: ${paramsType}) {
  const [data, setData] = React.useState<${responseType} | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const mutate = React.useCallback(async () => {
      setLoading(true);
      setError(null);
      
      try {
        ${pathParams.length > 0 ? `const url = \`${urlPath}\`;` : `const url = '${path}';`}
        ${queryParams.length > 0 ? `const queryString = params.query ? '?' + new URLSearchParams(params.query as any).toString() : '';` : ''}
        ${queryParams.length > 0 ? `const finalUrl = url + queryString;` : `const finalUrl = url;`}
      
        const response = await ${axiosInstance}.${method.toLowerCase()}<${responseType}>(
          finalUrl${requestBody ? ', params.body' : ''}
        );
        
        setData(response.data);
        return response.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    }, [${(pathParams.length > 0 ? 'params.path' : '') + (queryParams.length > 0 ? (pathParams.length > 0 ? ', params.query' : 'params.query') : '') + (requestBody ? ((pathParams.length > 0 || queryParams.length > 0) ? ', params.body' : 'params.body') : '')}]);
  
  return {
    mutate,
    data,
    loading,
    error
  };
}
`;
  } else {
    // Query hook (GET)
    const paramsType = `{\n    path${pathParams.length > 0 ? `: ${pathParamsInterface}` : '?: never'};\n    query${queryParams.length > 0 ? `?: ${queryParamsInterface}` : '?: never'};\n    enabled?: boolean;\n  }`;
    
    return `
${generateParamsInterface(pathParams, queryParams, functionName)}

export function ${hookName}(params: ${paramsType}) {
  const [data, setData] = React.useState<${responseType} | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    if (params.enabled === false) return;
    
    setLoading(true);
    setError(null);
    
    ${pathParams.length > 0 ? `const url = \`${urlPath}\`;` : `const url = '${path}';`}
    ${queryParams.length > 0 ? `const queryString = params.query ? '?' + new URLSearchParams(params.query as any).toString() : '';` : ''}
    ${queryParams.length > 0 ? `const finalUrl = url + queryString;` : `const finalUrl = url;`}
    
    ${axiosInstance}.get<${responseType}>(finalUrl)
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(err => {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setLoading(false);
      });
  }, [${(pathParams.length > 0 ? 'params.path' : '') + (queryParams.length > 0 ? (pathParams.length > 0 ? ', params.query' : 'params.query') : '')}]);
  
  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      ${pathParams.length > 0 ? `const url = \`${urlPath}\`;` : `const url = '${path}';`}
      ${queryParams.length > 0 ? `const queryString = params.query ? '?' + new URLSearchParams(params.query as any).toString() : '';` : ''}
      ${queryParams.length > 0 ? `const finalUrl = url + queryString;` : `const finalUrl = url;`}
      
      ${axiosInstance}.get<${responseType}>(finalUrl)
        .then(response => {
          setData(response.data);
          setLoading(false);
        })
        .catch(err => {
          const error = err instanceof Error ? err : new Error('Unknown error');
          setError(error);
          setLoading(false);
        });
    }
  };
}
`;
  }
}

/**
 * Generate all React hooks
 */
export async function generateHooks(
  specs: OpenAPISpec[],
  options: GenerationOptions
): Promise<void> {
  const outputDir = options.outputDir;
  
  // Collect all endpoints
  const allEndpoints: EndpointInfo[] = [];
  for (const spec of specs) {
    const endpoints = extractEndpoints(spec);
    allEndpoints.push(...endpoints);
  }
  
  // Generate hooks
  const hooksCode = allEndpoints
    .map(endpoint => generateHook(endpoint, options.axiosInstance))
    .join('\n');
  
  // Generate file with hooks
  const hooksContent = `/**
 * Automatically generated React hooks
 * Do not edit this file manually
 */

import * as React from 'react';
import ${options.axiosInstance || 'axios'} from 'axios';
import * as SDK from './sdk';

${hooksCode}
`;
  
  fs.writeFileSync(path.join(outputDir, 'hooks.ts'), hooksContent);
}

