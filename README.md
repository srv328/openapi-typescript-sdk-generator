# OpenAPI TypeScript SDK Generator

A fully-featured generator that creates TypeScript SDK, React hooks, Markdown, and interactive HTML documentation from OpenAPI 3 specifications.

## ✨ Features

- 🚀 **Fully-typed TypeScript SDK** - All endpoints are generated with complete type safety
- ⚛️ **React Hooks** - Automatic generation of hooks for all endpoints (GET/POST/PUT/DELETE)
- 📝 **Markdown Documentation** - Detailed documentation with usage examples
- 🌐 **Interactive HTML Documentation** - Test APIs directly in your browser
- 🔗 **$ref Support** - Automatic resolution of references in OpenAPI specifications
- 📦 **Multiple Specifications** - Generate from multiple files simultaneously
- 🎯 **Required/Optional Fields** - Correct handling of required and optional fields
- 📊 **Code Examples** - Ready-to-use examples for SDK and hooks

## 📦 Installation

### Global Installation

```bash
npm install -g openapi-typescript-sdk-generator
```

### Local Installation (Development Dependency)

```bash
npm install openapi-typescript-sdk-generator --save-dev
```

### Using npx (Recommended)

You can use the generator without installation:

```bash
npx openapi-typescript-sdk-generator generate --input spec.yaml --output ./generated-sdk
```

## 🚀 Quick Start

### Basic Usage

```bash
npx openapi-typescript-sdk-generator generate \
  --input api-spec.json \
  --output ./generated-sdk
```

### Generate from Multiple Files

```bash
npx openapi-typescript-sdk-generator generate \
  --input spec1.json spec2.yaml spec3.json \
  --output ./generated-sdk \
  --base-url https://api.example.com/v1
```

### With Custom Axios Instance Name

```bash
npx openapi-typescript-sdk-generator generate \
  --input api-spec.yaml \
  --output ./generated-sdk \
  --axios-instance apiClient
```

## 📖 CLI Options

```
Options:
  -i, --input <files...>     Paths to OpenAPI files (JSON or YAML) [required]
  -o, --output <dir>          Directory for output generated files [required]
  -b, --base-url <url>        Base URL for API (used in HTML documentation)
  -a, --axios-instance <name> Name of axios instance (default: axios)
  -h, --help                  Show help
```

## 📁 Generated Files Structure

After generation, the following files will be created in the output directory:

```
generated-sdk/
├── sdk.ts              # TypeScript SDK with all functions
├── hooks.ts            # React hooks for all endpoints
├── index.ts            # Main export file
├── API.md              # Markdown documentation
├── index.html          # Interactive HTML documentation
├── package.json        # npm package configuration
└── tsconfig.json       # TypeScript configuration
```

## 💻 Using the Generated SDK

### Basic Example

```typescript
import axios from 'axios';
import { getUsers, createUser } from './generated-sdk/sdk';

// Configure axios
axios.defaults.baseURL = 'https://api.example.com/v1';
axios.defaults.headers.common['Authorization'] = 'Bearer YOUR_TOKEN';

// Get list of users
const users = await getUsers({
  query: {
    limit: 10,
    offset: 0
  }
});

// Create a new user
const newUser = await createUser({
  body: {
    email: 'john.doe@example.com',
    name: 'John Doe',
    age: 30
  }
});
```

### Using React Hooks

```tsx
import React from 'react';
import { useGetUsers, useCreateUser } from './generated-sdk/hooks';

function UsersList() {
  const [offset, setOffset] = React.useState(0);
  
  const { data, loading, error, refetch } = useGetUsers({
    query: {
      limit: 10,
      offset
    },
    enabled: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Users</h2>
      {data?.users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

function CreateUserForm() {
  const { mutate, loading, error } = useCreateUser({
    body: {
      email: 'test@example.com',
      name: 'Test User'
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutate(); }}>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

## 🔧 Programmatic Usage

You can also use the generator programmatically:

```typescript
import { generateSDK, generateHooks, loadOpenAPISpec } from 'openapi-typescript-sdk-generator';

// Load OpenAPI specification
const spec = await loadOpenAPISpec('api-spec.yaml');

// Generate SDK
await generateSDK([spec], {
  inputFiles: ['api-spec.yaml'],
  outputDir: './generated-sdk',
  baseUrl: 'https://api.example.com',
  axiosInstance: 'axios'
});

// Generate React hooks
await generateHooks([spec], {
  inputFiles: ['api-spec.yaml'],
  outputDir: './generated-sdk',
  axiosInstance: 'axios'
});
```

## 📚 Generated Types

The generator automatically creates TypeScript interfaces for:

- **Request Parameters** - Path and query parameters
- **Request Bodies** - POST/PUT/PATCH request bodies
- **Responses** - Response types for each endpoint
- **Schema Components** - All schemas defined in `components/schemas`

Example generated types:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  isActive?: boolean;
}

export interface GetUsersQueryParams {
  limit?: number;
  offset?: number;
}

export async function getUsers(params: {
  query?: GetUsersQueryParams;
}): Promise<UsersResponse> {
  // ...
}
```

## 🎨 React Hooks Features

### Query Hooks (GET requests)

- Automatic data fetching on mount (if `enabled` is not `false`)
- Loading and error states
- Refetch function to manually reload data
- Dependency tracking for automatic refetching

### Mutation Hooks (POST/PUT/DELETE/PATCH)

- Manual execution via `mutate()` function
- Loading and error states
- Return data after successful mutation
- Type-safe request bodies

## 📄 Requirements

- Node.js 18+ 
- TypeScript 5.0+
- OpenAPI 3.0 specification files (JSON or YAML)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [axios](https://github.com/axios/axios) for HTTP requests
- Uses [json-schema-ref-parser](https://github.com/APIDevTools/json-schema-ref-parser) for $ref resolution
- Powered by [js-yaml](https://github.com/nodeca/js-yaml) for YAML parsing

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for TypeScript and React developers
