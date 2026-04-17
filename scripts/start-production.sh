#!/bin/sh
set -e

echo "🚀 Starting OpenSea API..."
exec node --stack-size=8192 --max-old-space-size=1536 build/server.js
