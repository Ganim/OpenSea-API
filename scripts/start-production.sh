#!/bin/sh
set -e

echo "🚀 Starting OpenSea API in production mode..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "✅ Starting server..."
exec node --stack-size=8192 build/server.js
