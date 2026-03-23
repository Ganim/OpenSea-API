#!/bin/sh
set -e

echo "📦 Running database migrations..."

# Retry logic for Neon DB cold starts (can take 10-15s to wake up)
MAX_RETRIES=3
RETRY_DELAY=15

for i in $(seq 1 $MAX_RETRIES); do
  if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
    break
  else
    if [ $i -eq $MAX_RETRIES ]; then
      echo "❌ Migration failed after $MAX_RETRIES attempts"
      exit 1
    fi
    echo "⚠️ Migration attempt $i failed, retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
  fi
done

echo "🌱 Running database seed..."
node build/seed.mjs

echo "✅ Release complete"
