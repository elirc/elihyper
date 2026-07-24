#!/bin/bash

# Run tests with coverage for hypernova-inc frontend
echo "Running hypernova-inc tests with coverage..."
npm run test:coverage

# Display coverage summary
echo ""
echo "Coverage report generated. View detailed report at: coverage/lcov-report/index.html"
