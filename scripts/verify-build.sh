#!/bin/bash

PROJECT_ROOT="$(pwd)"

echo "🔍 Checking TypeScript types..."
cd "$PROJECT_ROOT/apps/web" && npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ TypeScript types check passed!"
else
  echo "❌ TypeScript types check failed. Fix the type errors above before continuing."
  exit 1
fi

echo "🧪 Running ESLint check..."
cd "$PROJECT_ROOT/apps/web" && npx eslint src/**/*.ts src/**/*.tsx

if [ $? -eq 0 ]; then
  echo "✅ ESLint check passed!"
else
  echo "❌ ESLint check failed. Fix the linting errors above before continuing."
  exit 1
fi

echo "🏗️ Building the application..."
cd "$PROJECT_ROOT/apps/web" && npx next build

if [ $? -eq 0 ]; then
  echo "✅ Build successful! Your application is ready for deployment."
else
  echo "❌ Build failed. Fix the build errors above before continuing."
  exit 1
fi

echo "🚀 All checks passed! The application is ready for deployment."
