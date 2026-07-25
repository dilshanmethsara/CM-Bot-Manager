#!/bin/bash
set -e
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://neondb_owner:npg_QINWt5Aj9KuY@ep-long-frog-aui4ij16-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require\&channel_binding=require\&pgbouncer=true"|' /opt/cloudmint/server/.env
grep DATABASE_URL /opt/cloudmint/server/.env
