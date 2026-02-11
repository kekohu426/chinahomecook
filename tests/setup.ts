import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom'

process.env.EVOLINK_API_KEY ||= 'test-key'
process.env.EVOLINK_API_URL ||= 'https://example.com'
process.env.DATABASE_URL ||= 'postgresql://user:pass@localhost:5432/testdb'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
