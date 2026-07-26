# CloudMint WhatsApp Bot — External API Guide

Connect third-party services (Zend OTP, Shopify, WooCommerce, custom apps) to send WhatsApp notifications through CloudMint.

**Base URL:** `http://18.141.127.188/api/v1`

---

## 1. Authentication

Two ways:

### A) API Key (recommended for external services)

Generate a permanent API key from the dashboard: **System → API Keys → Create Key**

```bash
# Use the API key — no expiry
curl -X POST "http://18.141.127.188/api/v1/messages/text" \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"...","to":"94771234567","content":"Your OTP is 123456"}'
```

### B) JWT Token (short-lived, 24h)

```bash
# 1. Login
curl -X POST "http://18.141.127.188/api/v1/system/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dashboard.local","password":"admin123"}'

# Response: { "success": true, "data": { "token": "eyJhbG..." } }

# 2. Use token in subsequent requests
curl -X POST "http://18.141.127.188/api/v1/messages/text" \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"...","to":"94771234567","content":"Your OTP is 123456"}'
```

---

## 2. Get Your Session ID

You need a **WhatsApp session** that's already connected. List sessions:

```bash
curl "http://18.141.127.188/api/v1/sessions" \
  -H "Authorization: Bearer <token-or-api-key>"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "ee618ea6-0bb9-4754-b911-b5c891b85605",
#       "name": "Businessbot",
#       "phoneNumber": "94784462490",
#       "status": "connected",
#       "profileName": "HASA GOLD STORE"
#     }
#   ]
# }
```

**Pick the session where `status` is `"connected"`.** That's your sender WhatsApp number.

---

## 3. Send Messages

### Text (OTP, alerts, notifications)

```bash
curl -X POST "http://18.141.127.188/api/v1/messages/text" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "ee618ea6-...",
    "to": "94771234567",
    "content": "🔐 Your OTP is 482916. Valid for 5 minutes."
  }'
```

**Parameters:**
| Field | Required | Description |
|-------|----------|-------------|
| `sessionId` | ✅ | ID of the connected session (sender) |
| `to` | ✅ | Recipient number. No `+` prefix, just country code + number |
| `content` | ✅ | Message text. Emoji, newlines, markdown all supported |

### Image

```bash
curl -X POST "http://18.141.127.188/api/v1/messages/image" \
  -H "Authorization: Bearer <token>" \
  -F "sessionId=ee618ea6-..." \
  -F "to=94771234567" \
  -F "caption=Your invoice attached" \
  -F "image=@/path/to/invoice.png"
```

### Document (PDF, DOCX, invoices)

```bash
curl -X POST "http://18.141.127.188/api/v1/messages/document" \
  -H "Authorization: Bearer <token>" \
  -F "sessionId=ee618ea6-..." \
  -F "to=94771234567" \
  -F "caption=Monthly statement" \
  -F "document=@/path/to/statement.pdf"
```

---

## 4. Send from Third-Party Services (Zend OTP, APIs)

### A) Zend OTP / Custom Payment Gateway (PHP)

Save this as `send-whatsapp.php`:

```php
<?php
function sendWhatsApp($to, $message) {
    $url = "http://18.141.127.188/api/v1/messages/text";
    $token = "your-api-key-here";
    $sessionId = "ee618ea6-0bb9-4754-b911-b5c891b85605"; // your connected session

    $data = json_encode([
        "sessionId" => $sessionId,
        "to"        => $to,
        "content"   => $message
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $token",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return json_decode($response, true);
}

// ── Usage: Zend OTP callback ─────────────────────────────────────
$otp = rand(100000, 999999);
$_SESSION['otp'] = $otp;

$result = sendWhatsApp(
    "94771234567",
    "🔐 Your OTP is $otp. Valid for 5 minutes. - MyStore"
);

if ($result['success']) {
    echo "OTP sent: " . $result['data']['messageId'];
} else {
    echo "Failed: " . $result['error'];
}
```

### B) Node.js / Express (for other backends)

```javascript
// save as: wa-notify.js
const WHATSAPP_API = 'http://18.141.127.188/api/v1';
const API_KEY = 'your-api-key-here';
const SESSION_ID = 'ee618ea6-0bb9-4754-b911-b5c891b85605';

async function sendWA(to, content) {
  const res = await fetch(`${WHATSAPP_API}/messages/text`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId: SESSION_ID, to, content }),
  });
  return res.json();
}

// ── Usage ─────────────────────────────────────────────────────────
// Order notification
await sendWA('94771234567', '📦 Order #1234 confirmed! Will arrive in 3-5 days.');

// Payment received
await sendWA('94771234567', '💰 Payment of LKR 5,200 received. Thank you!');

// Abandoned cart reminder
await sendWA('94771234567', '🛒 You left items in your cart. Complete your order: http://mystore.lk/cart');
```

### C) Python (Django, FastAPI, Flask)

```python
import requests, json

API_URL = "http://18.141.127.188/api/v1"
API_KEY = "your-api-key-here"
SESSION_ID = "ee618ea6-0bb9-4754-b911-b5c891b85605"

def send_whatsapp(to: str, content: str) -> dict:
    resp = requests.post(
        f"{API_URL}/messages/text",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={"sessionId": SESSION_ID, "to": to, "content": content},
        timeout=30,
    )
    return resp.json()

# ── Usage ──────────────────────────────────────────────────────────
# After OTP generation
otp = "482916"
result = send_whatsapp("94771234567", f"🔐 Your OTP is {otp}")
print("Sent:", result["data"]["messageId"] if result["success"] else result["error"])
```

### D) cURL (shell scripts, cron jobs)

```bash
#!/bin/bash
# save as: send-notification.sh

TOKEN="your-api-key-here"
SESSION="ee618ea6-0bb9-4754-b911-b5c891b85605"
PHONE="94771234567"

send_msg() {
  curl -s -X POST "http://18.141.127.188/api/v1/messages/text" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION\",\"to\":\"$PHONE\",\"content\":\"$1\"}"
}

# Cron job: daily report
send_msg "📊 Daily report ready: http://dashboard/report.pdf"
```

---

## 5. Delivery Status

The API returns `status: "sent"` as soon as the message is queued locally. **True delivery confirmation comes via WebSocket.**

To check if a message was actually delivered:

```bash
# Check session logs for delivery errors
curl "http://18.141.127.188/api/v1/system/logs?sessionId=ee618ea6-...&limit=5" \
  -H "Authorization: Bearer <token>"
```

Look for `error 463` → account restricted, or `status: error` → delivery failed.  
If you see `error 463`, the WhatsApp account needs to be warmed up (send manual messages first).

---

## 6. Health Check

```bash
curl "http://18.141.127.188/api/v1/system/health"

# Response:
# {
#   "success": true,
#   "data": {
#     "status": "healthy",
#     "database": "connected"
#   }
# }
```

Check which sessions are actually connected:

```bash
curl "http://18.141.127.188/api/v1/health/whatsapp" \
  -H "Authorization: Bearer <token>"

# Look for sessions with status: "connected"
```

---

## 7. Best Practices

| Do | Don't |
|----|-------|
| ✅ Use **API Keys** for long-lived integrations | ❌ Don't use JWT tokens for scripts — they expire in 24h |
| ✅ Send to numbers that have **opted in** or messaged you first | ❌ Don't spam numbers — WhatsApp will ban the account |
| ✅ Keep messages **under 1000 chars** | ❌ Don't send media > 25MB |
| ✅ Add a small delay between bulk sends | ❌ Don't send > 10 messages/second — you'll hit rate limits |
| ✅ **Warm up** new WhatsApp accounts before bulk sending | ❌ Don't use a brand-new number for automated sending |
| ✅ Wrap calls in try/catch and retry on failure | ❌ Don't assume `success: true` means delivered |

### Warming up a new WhatsApp number

1. Send 5-10 manual messages from phone to known contacts
2. Wait 24 hours
3. Send 20-30 messages to opted-in contacts
4. Wait 24 hours
5. Gradually scale up

---

## 8. Rate Limits

- **Outbound**: ~10 messages/second per session (enforced by internal queue)
- **Session reconnect**: ~3 attempts with exponential backoff (10s → 30s → 60s)
- **Concurrent sessions**: unlimited (each has its own message queue)

---

## 9. Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `401` | Invalid/expired token | Refresh API key or re-login |
| `400` | Missing required fields | Check `sessionId`, `to`, `content` |
| `500` + `Session ... not connected` | Session disconnected | Reconnect from dashboard |
| `error 463` | Account restricted / missing tctoken | Warm up the account, send from phone first |
| message sent but not received | WhatsApp server rejected silently | Check logs for `messages.update` with `status: 'error'` |

---

## 10. WebSocket Events (for real-time apps)

If you want real-time delivery status (e.g., show "delivered" in your app):

```javascript
// Frontend JS
import { io } from "socket.io-client";

const socket = io("http://18.141.127.188", {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  withCredentials: true,
});

socket.on("messageDeliveryFailed", ({ sessionId, msgId, error }) => {
  console.error(`Message ${msgId} failed:`, error);
  // Show error in your UI
});

socket.on("sessionConnected", ({ sessionId }) => { /* ... */ });
socket.on("sessionDisconnected", ({ sessionId }) => { /* ... */ });
```

---

## Quick Reference

```
POST /api/v1/messages/text       — Send text (OTP, notifications)
POST /api/v1/messages/image      — Send image
POST /api/v1/messages/document   — Send document
POST /api/v1/messages/media      — Send any media type
GET  /api/v1/sessions            — List all sessions
GET  /api/v1/sessions/:id/status — Check session status
GET  /api/v1/system/health       — Health check (no auth)
GET  /api/v1/system/logs         — View delivery logs
POST /api/v1/system/auth/login   — Get JWT token
```

> [!TIP]
> **Start here:** Generate an API Key from the dashboard → pick a connected session → send your first OTP with the cURL example above. Takes 2 minutes.
