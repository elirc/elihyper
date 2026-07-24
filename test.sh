#!/bin/bash
set -e

# Run tests for hypernova-inc frontend
echo "Running hypernova-inc tests..."
npm test

# Capture exit code
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "✓ All tests passed"
else
  echo "✗ Tests failed with exit code $exit_code"
fi

exit $exit_code
