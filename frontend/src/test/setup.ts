// Adds matchers such as toBeDisabled() and toBeInTheDocument() to Vitest's expect.
import '@testing-library/jest-dom/vitest'

// Each test starts with empty browser storage so sessions never leak between tests.
afterEach(() => {
  localStorage.clear()
})
