#!/bin/bash
set -a # automatically export all variables
source .env.local
set +a

echo "Starting Next.js with environment variables loaded..."
echo "NEXTAUTH_SECRET is set: $([ -n "$NEXTAUTH_SECRET" ] && echo "YES" || echo "NO")"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

npx next dev --port 3000 