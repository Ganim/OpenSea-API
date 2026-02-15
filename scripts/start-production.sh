#!/bin/sh
set -e

echo "🚀 Starting OpenSea API..."
exec node --stack-size=8192 build/server.js
