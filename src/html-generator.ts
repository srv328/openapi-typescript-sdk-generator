/**
 * Generator interactive HTML documentation
 */

import * as fs from 'fs';
import * as path from 'path';
import { EndpointInfo, OpenAPISpec, GenerationOptions } from './types';
import { extractEndpoints } from './openapi-parser';
import { schemaToType } from './schema-to-types';

/**
 * Generate HTML form for parameters
 */
function generateParamsForm(params: any[], prefix: string): string {
  if (params.length === 0) return '';
  
  let html = `<div class="params-group">\n`;
  html += `  <h4>${prefix} Parameters</h4>\n`;
  
  for (const param of params) {
    const type = schemaToType(param.schema);
    const required = param.required ? 'required' : '';
    const description = param.description || '';
    
    html += `  <div class="form-group">\n`;
    html += `    <label for="${prefix}-${param.name}">\n`;
    html += `      ${param.name}${param.required ? ' <span class="required">*</span>' : ''}\n`;
    html += `      <span class="type">${type}</span>\n`;
    html += `    </label>\n`;
    
    if (description) {
      html += `    <p class="description">${description}</p>\n`;
    }
    
    html += `    <input type="text" id="${prefix}-${param.name}" name="${param.name}" ${required} />\n`;
    html += `  </div>\n`;
  }
  
  html += `</div>\n`;
  return html;
}

/**
 * Generate HTML form for request body
 */
function generateRequestBodyForm(requestBody: any): string {
  if (!requestBody) return '';
  
  let html = `<div class="params-group">\n`;
  html += `  <h4>Request Body</h4>\n`;
  
  if (requestBody.description) {
    html += `  <p class="description">${requestBody.description}</p>\n`;
  }
  
  html += `  <div class="form-group">\n`;
  html += `    <label for="request-body">Body (JSON)</label>\n`;
  html += `    <textarea id="request-body" name="body" rows="10" placeholder='{\n  "key": "value"\n}'></textarea>\n`;
  html += `  </div>\n`;
  html += `</div>\n`;
  
  return html;
}

/**
 * Generate HTML for one endpoint
 */
function generateEndpointHTML(endpoint: EndpointInfo, baseUrl = ''): string {
  const { path, method, operationId, summary, description, pathParams, queryParams, requestBody } = endpoint;
  
  let html = `<div class="endpoint" data-path="${path}" data-method="${method}" data-operation="${operationId}">\n`;
  html += `  <div class="endpoint-header">\n`;
  html += `    <h3 class="method ${method.toLowerCase()}">${method}</h3>\n`;
  html += `    <span class="path">${path}</span>\n`;
  html += `  </div>\n`;
  
  if (summary) {
    html += `  <p class="summary">${summary}</p>\n`;
  }
  
  if (description) {
    html += `  <p class="description">${description}</p>\n`;
  }
  
  html += `  <div class="endpoint-form">\n`;
  
  // Path parameters
  if (pathParams.length > 0) {
    html += generateParamsForm(pathParams, 'path');
  }
  
  // Query parameters
  if (queryParams.length > 0) {
    html += generateParamsForm(queryParams, 'query');
  }
  
  // Request body
  if (requestBody) {
    html += generateRequestBodyForm(requestBody);
  }
  
  // Send button
  html += `    <button class="send-button" onclick="sendRequest('${operationId}', '${method}', '${path}')">\n`;
  html += `      Send Request\n`;
  html += `    </button>\n`;
  
  html += `  </div>\n`;
  
  // Response area
  html += `  <div class="response-area" id="response-${operationId}">\n`;
  html += `    <div class="response-placeholder">Result of the request will appear here...</div>\n`;
  html += `  </div>\n`;
  
  html += `</div>\n`;
  
  return html;
}

/**
 * Generate full HTML documentation
 */
export async function generateHTML(
  specs: OpenAPISpec[],
  options: GenerationOptions
): Promise<void> {
  const outputDir = options.outputDir;
  
  // Collect all endpoints
  const allEndpoints: EndpointInfo[] = [];
  const specsInfo: Array<{ title: string; version: string; description?: string }> = [];
  
  for (const spec of specs) {
    specsInfo.push({
      title: spec.info.title,
      version: spec.info.version,
      description: spec.info.description
    });
    
    const endpoints = extractEndpoints(spec);
    allEndpoints.push(...endpoints);
  }
  
  // Generate HTML
  let html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .endpoint {
      background: white;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 25px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .method {
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
    }
    
    .method.get { background: #4CAF50; color: white; }
    .method.post { background: #2196F3; color: white; }
    .method.put { background: #FF9800; color: white; }
    .method.delete { background: #f44336; color: white; }
    .method.patch { background: #9C27B0; color: white; }
    
    .path {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      color: #555;
    }
    
    .summary {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .params-group {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    
    .params-group h4 {
      margin-bottom: 15px;
      color: #555;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }
    
    .type {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #666;
      margin-left: 8px;
      font-weight: normal;
    }
    
    .required {
      color: #f44336;
    }
    
    .description {
      font-size: 13px;
      color: #666;
      margin: 5px 0 10px 0;
      font-style: italic;
    }
    
    input[type="text"],
    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    
    textarea {
      resize: vertical;
      min-height: 100px;
    }
    
    .send-button {
      background: #2196F3;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.3s;
    }
    
    .send-button:hover {
      background: #1976D2;
    }
    
    .send-button:active {
      transform: scale(0.98);
    }
    
    .response-area {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
      min-height: 50px;
      display: none;
    }
    
    .response-area.show {
      display: block;
    }
    
    .response-placeholder {
      color: #999;
      font-style: italic;
    }
    
    .response-content {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .response-success {
      background: #e8f5e9;
      border-left: 4px solid #4CAF50;
    }
    
    .response-error {
      background: #ffebee;
      border-left: 4px solid #f44336;
    }
    
    .loading {
      color: #2196F3;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>API Documentation</h1>
      <p>Interactive documentation for testing API endpoints</p>
    </header>
    
    <div class="endpoints-list">
`;
  
  // Generate HTML for each endpoint
  for (const endpoint of allEndpoints) {
    html += generateEndpointHTML(endpoint, options.baseUrl);
  }
  
  html += `    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script>
    const baseUrl = '${options.baseUrl || ''}';
    
    function getPathParams(path, pathValues) {
      let finalPath = path;
      Object.entries(pathValues).forEach(([key, value]) => {
        finalPath = finalPath.replace('{' + key + '}', value);
      });
      return finalPath;
    }
    
    function getQueryParams(queryValues) {
      const params = new URLSearchParams();
      Object.entries(queryValues).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      const queryString = params.toString();
      return queryString ? '?' + queryString : '';
    }
    
    async function sendRequest(operationId, method, path) {
      const endpointEl = document.querySelector(\`[data-operation="\${operationId}"]\`);
      const responseArea = document.getElementById(\`response-\${operationId}\`);
      responseArea.classList.add('show');
      responseArea.innerHTML = '<div class="loading">Sending request...</div>';
      
      try {
        // Collect path parameters
        const pathInputs = endpointEl.querySelectorAll('[name]');
        const pathParams = {};
        const queryParams = {};
        let requestBody = null;
        
        Array.from(pathInputs).forEach(input => {
          const name = input.name;
          const value = input.value.trim();
          const prefix = input.id.split('-')[0];
          
          if (prefix === 'path') {
            pathParams[name] = value;
          } else if (prefix === 'query') {
            if (value) queryParams[name] = value;
          } else if (input.id === 'request-body') {
            if (value) {
              try {
                requestBody = JSON.parse(value);
              } catch (e) {
                throw new Error('Invalid JSON in request body');
              }
            }
          }
        });
        
        // Generate URL
        const pathWithParams = getPathParams(path, pathParams);
        const queryString = getQueryParams(queryParams);
        const url = baseUrl + pathWithParams + queryString;
        
        // Execute request
        const config = {
          method: method.toLowerCase(),
          url: url
        };
        
        if (requestBody && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
          config.data = requestBody;
        }
        
        const response = await axios(config);
        
        // Display result
        responseArea.className = 'response-area show response-success';
        responseArea.innerHTML = \`
          <div style="margin-bottom: 10px;">
            <strong>Status:</strong> \${response.status} \${response.statusText}
          </div>
          <div class="response-content">\${JSON.stringify(response.data, null, 2)}</div>
        \`;
      } catch (error) {
        responseArea.className = 'response-area show response-error';
        let errorMessage = 'An error occurred';
        
        if (error.response) {
          errorMessage = \`
            <div style="margin-bottom: 10px;">
              <strong>Status:</strong> \${error.response.status} \${error.response.statusText}
            </div>
            <div class="response-content">\${JSON.stringify(error.response.data, null, 2)}</div>
          \`;
        } else if (error.request) {
          errorMessage = 'Request was sent, but no response was received';
        } else {
          errorMessage = \`Error: \${error.message}\`;
        }
        
        responseArea.innerHTML = errorMessage;
      }
    }
  </script>
</body>
</html>`;
  
  // Write file
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
}


