---
name: api-test
description: Test API endpoints with curl or automated tests. Use when user says "test API", "测试接口", "call endpoint", "check API", or wants to verify API functionality.
allowed-tools: Read, Bash(curl:*), Bash(npm test:*), Bash(npx tsx:*)
---

# API Testing

## Overview

Test Next.js API routes using curl commands or Jest tests. Supports both manual testing and automated test generation.

## When to Use

Use this skill when:
- Testing new API endpoints
- Debugging API issues
- Verifying API responses
- Generating API tests

Note: Admin endpoints typically require an authenticated admin session or token.

## Base URL

- Development: `http://localhost:3000`
- The dev server should be running

## Common Patterns

### GET Request
```bash
curl -s http://localhost:3000/api/endpoint | jq
```

### POST Request
```bash
curl -s -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}' | jq
```

### With Authentication
```bash
curl -s http://localhost:3000/api/endpoint \
  -H "Authorization: Bearer TOKEN" | jq
```

### Upload File
```bash
curl -s -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/file.jpg" | jq
```

## Project API Endpoints

### Recipes
```bash
# List recipes
curl -s "http://localhost:3000/api/recipes?page=1&limit=10" | jq

# Get single recipe
curl -s http://localhost:3000/api/recipes/RECIPE_ID | jq

# Search recipes
curl -s "http://localhost:3000/api/search?q=keyword" | jq
```

### Admin APIs
```bash
# Create recipe (requires auth)
curl -s -X POST http://localhost:3000/api/admin/recipes \
  -H "Content-Type: application/json" \
  -d '{"titleZh": "test"}' | jq

# Upload image
curl -s -X POST http://localhost:3000/api/upload \
  -F "file=@image.jpg" | jq
```

### Home Config (Admin)
```bash
# Fetch home config (locale aware)
curl -s "http://localhost:3000/api/config/home?locale=zh" | jq

# Translate home config (requires auth)
curl -s -X POST http://localhost:3000/api/admin/config/home/translate \
  -H "Content-Type: application/json" \
  -d '{"sourceLocale":"zh","targetLocale":"en"}' | jq
```

### AI Generation
```bash
# Generate recipe
curl -s -X POST http://localhost:3000/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{"prompt": "红烧肉"}' | jq
```

## Response Validation

### Check Status Code
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/endpoint
```

### Check Response Time
```bash
curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/api/endpoint
```

### Validate JSON Schema
```bash
curl -s http://localhost:3000/api/endpoint | jq 'keys'
```

## Test File Pattern

```typescript
// tests/api/endpoint.test.ts
import { describe, it, expect } from 'vitest';

describe('API: /api/endpoint', () => {
  it('should return 200 for valid request', async () => {
    const response = await fetch('http://localhost:3000/api/endpoint');
    expect(response.status).toBe(200);
  });

  it('should return expected data structure', async () => {
    const response = await fetch('http://localhost:3000/api/endpoint');
    const data = await response.json();
    expect(data).toHaveProperty('id');
  });
});
```

## Debugging Tips

1. **Use jq for JSON formatting**: `| jq`
2. **Check headers**: `curl -I url`
3. **Verbose mode**: `curl -v url`
4. **Save response**: `curl -o response.json url`
