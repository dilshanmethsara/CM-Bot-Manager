#!/bin/bash
cd /opt/cloudmint
PORT=3001 DATABASE_URL="postgresql://neondb_owner:npg_QINWt5Aj9KuY@ep-long-frog-aui4ij16-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require" node .output/server/index.mjs
