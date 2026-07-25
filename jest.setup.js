// Real jest-dom matchers.
//
// This file previously hand-implemented toBeInTheDocument, toHaveValue and
// toBeDisabled, with a comment explaining that the package "won't install".
// It does install -- it is already in devDependencies -- and the hand-rolled
// versions were subtly wrong. toBeInTheDocument passed for any non-null value,
// so it returned true for an element that had been removed from the document,
// and true for a plain object that was never an element at all. A matcher that
// cannot fail is worse than no matcher: it makes a suite look like it has
// coverage it does not have.
require('@testing-library/jest-dom')

// src/utils/api-client calls generateClient() at module load, which would try
// to reach AppSync from a test. Individual tests override `graphql` with their
// own implementation.
jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn(),
  })),
}))

// Components push analytics events to window.dataLayer with optional chaining
// (`window.dataLayer?.push`). Without this, tests would silently exercise the
// "GTM is not configured" branch and no analytics assertion could ever pass.
// Reset per test so event assertions do not leak between cases.
beforeEach(() => {
  window.dataLayer = []
})
