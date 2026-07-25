#!/bin/bash
set -e

cd /opt/cloudmint

# Kill existing processes
pkill -f 'wrangler' 2>/dev/null || true
pkill -f 'vite preview' 2>/dev/null || true
pkill -f 'node .output/server/index.mjs' 2>/dev/null || true

# Start nitro preview on port 3001
PORT=3001 npx nitro preview --port 3001 > /tmp/nitro.log 2>&1 &
NITRO_PID=$!

echo "Nitro PID: $NITRO_PID"

# Wait for it to start
sleep 8

# Check if it's running
if kill -0 $NITRO_PID 2>/dev/null; then
    echo "Nitro server RUNNING"
else
    echo "Nitro server EXITED"
    cat /tmp/nitro.log
fi

# Test it
curl -s http://localhost:3001/ | head -5
