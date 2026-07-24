// Mock AWS Amplify
jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn(),
  })),
}))

// Add jest-dom matchers manually since package won't install
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined
    return {
      pass,
      message: () => (pass ? `expected element not to be in the document` : `expected element to be in the document`),
    }
  },
  toHaveValue(received, expected) {
    const pass = received && received.value === expected
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to have value ${expected}`
          : `expected element to have value ${expected}, but got ${received?.value}`,
    }
  },
  toBeDisabled(received) {
    const pass = received && (received.disabled === true || received.hasAttribute('disabled'))
    return {
      pass,
      message: () => (pass ? `expected element not to be disabled` : `expected element to be disabled`),
    }
  },
})
