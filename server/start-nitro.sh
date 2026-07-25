#!/bin/bash
set -e
cd /opt/cloudmint
pkill -f 'node .output/server/index.mjs' 2>/dev/null || true

# Set DATABASE_URL for Nitro server
export DATABASE_URL="postgresql://neondb_owner:npg_QINWt5Aj9KuY@ep-long-frog-aui4ij16-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true"
export PORT=3001
export NODE_ENV=production

nohup node .output/server/index.mjs > /tmp/nitro.log 2>&1 &
echo $!
sleep 5
cat /tmp/nitro.log
curl -s http://localhost:3001/ | head -20
