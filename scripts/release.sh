#!/bin/sh
set -e

echo "📦 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Running database seed..."
node build/seed.mjs

echo "✅ Release complete"
