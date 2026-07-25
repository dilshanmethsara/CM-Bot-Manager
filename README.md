# CloudMint Bot Manager

A premium WhatsApp bot management dashboard built with TanStack Start, React, TypeScript, and Baileys.

## Features

- **Multi-session WhatsApp Management**: Create, connect, and manage multiple WhatsApp bot sessions
- **Real-time Dashboard**: Live session status, messaging throughput, and system health monitoring
- **QR Code & Pairing Code**: Support for both QR code scanning and phone number pairing
- **Message Management**: Send messages, view history, and manage conversations
- **Webhook Integration**: Configure webhooks for message events
- **API Access**: RESTful API with authentication for external integrations
- **Persistent Sessions**: PostgreSQL database (Neon) for session persistence

## Tech Stack

- **Frontend**: TanStack Start (React), TypeScript, Tailwind CSS
- **Backend**: Node.js with H3 (Nitro), TypeScript
- **Database**: PostgreSQL (Neon serverless) with Prisma ORM
- **WhatsApp**: Baileys (WhatsApp Web API)
- **Process Management**: PM2
- **Reverse Proxy**: Nginx
- **Real-time**: Socket.io

## Quick Start (Local Development)

```bash
# Clone repository
git clone https://github.com/dilshanmethsara/CM-Bot-Manager.git
cd CM-Bot-Manager

# Install dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and other config

# Run database migrations
cd server && npx prisma migrate dev && cd ..

# Start development servers
npm run dev
```

## Production Deployment (AWS EC2 Ubuntu)

### 1. Server Requirements

- **Instance Type**: t3.medium or larger (2 vCPU, 4GB RAM minimum)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 20GB+ SSD
- **Network**: HTTP (80), HTTPS (443), SSH (22) inbound rules

### 2. Initial Server Setup

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### 3. Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/dilshanmethsara/CM-Bot-Manager.git cloudmint
sudo chown -R ubuntu:ubuntu cloudmint
cd cloudmint

# Install dependencies
npm ci

# Build frontend
npm run build

# Set up environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL (Neon PostgreSQL)

# Run database migrations
cd server && npx prisma migrate deploy && cd ..

# Configure Nginx
sudo cp nginx-cloudmint.conf /etc/nginx/sites-available/cloudmint
sudo ln -sf /etc/nginx/sites-available/cloudmint /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 4. Nginx Configuration (nginx-cloudmint.conf)

```nginx
server {
    listen 80;
    server_name your-ec2-ip-or-domain;

    # Frontend - proxy to Nitro preview server
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # API proxy + WebSocket
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

### 5. PM2 Configuration (ecosystem.config.cjs)

```javascript
module.exports = {
  apps: [
    {
      name: 'cloudmint-backend',
      script: 'server/src/server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx/esm',
      env_file: 'server/.env',
      cwd: '/opt/cloudmint',
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'cloudmint-frontend',
      script: 'npx',
      args: 'nitro preview --port 3001',
      env: {
        PORT: '3001',
        NODE_ENV: 'production'
      },
      cwd: '/opt/cloudmint',
      watch: false,
      max_memory_restart: '300M'
    }
  ]
};
```

### 6. Environment Variables (server/.env)

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&channel_binding=require"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://your-ec2-ip
```

## API Documentation

### Authentication

All API endpoints (except `/health` and `/auth/login`) require a Bearer token.

```bash
# Login
curl -X POST http://your-ip/api/v1/system/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dashboard.local","password":"admin123"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" http://your-ip/api/v1/sessions
```

### Sessions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sessions` | List all sessions |
| POST | `/api/v1/sessions` | Create new session |
| GET | `/api/v1/sessions/:id` | Get session details |
| DELETE | `/api/v1/sessions/:id` | Delete session |
| POST | `/api/v1/sessions/:id/connect` | Connect session (QR/Pairing) |
| POST | `/api/v1/sessions/:id/disconnect` | Disconnect session |
| POST | `/api/v1/sessions/:id/reconnect` | **Reconnect with same pairing code** |

### Reconnect Feature

The reconnect endpoint allows reconnecting a disconnected session using the **same pairing code**:

```bash
curl -X POST http://your-ip/api/v1/sessions/:id/reconnect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"pairing"}'
```

This returns the same pairing code, allowing you to re-link the same phone number without creating a new session.

### Messaging API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sessions/:id/send` | Send message |
| GET | `/api/v1/sessions/:id/messages` | Get message history |
| GET | `/api/v1/sessions/:id/chats` | Get chat list |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/webhooks` | List webhooks |
| POST | `/api/v1/webhooks` | Create webhook |
| DELETE | `/api/v1/webhooks/:id` | Delete webhook |

### System API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health/` | Health check |
| GET | `/api/v1/system/stats` | System statistics |
| GET | `/api/v1/system/logs` | System logs |

## API Manager Usage History

The API Manager tracks all API usage:

- **Request Logging**: All API requests logged with timestamp, endpoint, method, status
- **Session Activity**: Track connect/disconnect/reconnect events per session
- **Message Throughput**: Messages sent/received per session
- **Error Tracking**: Failed requests with error details

Access via Dashboard → API Manager or `/api/v1/system/logs` endpoint.

## Database Schema (Prisma)

Key models:
- `User` - Dashboard users
- `Session` - WhatsApp sessions with phone number, status, pairing code
- `Message` - Message history
- `Webhook` - Webhook configurations
- `ApiKey` - API keys for external access
- `AuditLog` - System audit trail

## Monitoring & Maintenance

```bash
# View logs
pm2 logs cloudmint-backend
pm2 logs cloudmint-frontend

# Monitor resources
pm2 monit

# Restart services
pm2 restart all

# Check status
pm2 status

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## SSL/HTTPS Setup (Production)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend not loading | Check `pm2 logs cloudmint-frontend`, ensure port 3001 is free |
| API 502 errors | Check `pm2 logs cloudmint-backend`, verify database connection |
| WebSocket fails | Ensure nginx config has WebSocket proxy headers |
| Session won't connect | Verify phone number format (country code + number), check Baileys auth state |

## License

MIT License - Built with ❤️ by CloudMint Team
