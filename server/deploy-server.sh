#!/bin/bash
set -e
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s|CHANGE_ME_RUN_openssl_rand_base64_32_ON_SERVER|${JWT_SECRET}|g" /opt/cloudmint/server/.env
echo "JWT_SECRET set successfully"
