export const stats = {
  totalSessions: 128,
  activeSessions: 96,
  disconnectedSessions: 24,
  pausedSessions: 8,
  messagesSentToday: 18432,
  messagesReceived: 12945,
  apiRequests: 84210,
  serverStatus: "Operational" as const,
};

export const messagesOverTime = [
  { day: "Mon", sent: 2400, received: 1800 },
  { day: "Tue", sent: 2100, received: 1600 },
  { day: "Wed", sent: 3200, received: 2400 },
  { day: "Thu", sent: 2800, received: 2100 },
  { day: "Fri", sent: 3800, received: 2900 },
  { day: "Sat", sent: 3100, received: 2500 },
  { day: "Sun", sent: 2650, received: 1900 },
];

export const apiUsage = [
  { hour: "00", calls: 320 },
  { hour: "04", calls: 220 },
  { hour: "08", calls: 780 },
  { hour: "12", calls: 1240 },
  { hour: "16", calls: 1580 },
  { hour: "20", calls: 940 },
];

export const successRate = [
  { name: "Success", value: 94 },
  { name: "Failed", value: 6 },
];

export const sessionActivity = [
  { name: "Active", value: 96 },
  { name: "Paused", value: 8 },
  { name: "Disconnected", value: 24 },
];

export type Session = {
  id: string;
  name: string;
  phone: string;
  profileName: string;
  avatar: string;
  status: "active" | "disconnected" | "paused" | "connecting";
  lastSeen: string;
  uptime: string;
  memory: number;
  cpu: number;
};

const names = [
  "Sales Bot",
  "Support Line",
  "Marketing Blast",
  "Order Notifications",
  "OTP Sender",
  "Delivery Updates",
  "Client Onboarding",
  "Newsletter",
  "Reminders",
  "Feedback Collector",
  "VIP Concierge",
  "Retail Assist",
];
const profiles = [
  "Aisha K.",
  "Marco R.",
  "Sofia L.",
  "David O.",
  "Priya S.",
  "Lucas B.",
  "Emma W.",
  "Kenji T.",
  "Nina P.",
  "Omar F.",
  "Zara H.",
  "Leo M.",
];
const statuses: Session["status"][] = [
  "active",
  "active",
  "active",
  "disconnected",
  "paused",
  "connecting",
];

export const sessions: Session[] = names.map((name, i) => ({
  id: `sess_${1000 + i}`,
  name,
  phone: `+1 555 0${100 + i * 7}`.slice(0, 14),
  profileName: profiles[i],
  avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(profiles[i])}`,
  status: statuses[i % statuses.length],
  lastSeen: `${(i % 12) + 1}m ago`,
  uptime: `${(i * 3) % 72}h ${(i * 7) % 60}m`,
  memory: 20 + ((i * 13) % 70),
  cpu: 5 + ((i * 11) % 60),
}));

export const recentActivity = [
  { id: 1, text: "Session 'Sales Bot' connected", time: "2m ago", type: "success" },
  { id: 2, text: "API key rotated by admin", time: "14m ago", type: "info" },
  { id: 3, text: "Webhook delivery failed (order.created)", time: "38m ago", type: "error" },
  { id: 4, text: "Broadcast sent to 1,240 recipients", time: "1h ago", type: "success" },
  { id: 5, text: "Session 'Newsletter' paused", time: "2h ago", type: "warning" },
  { id: 6, text: "New device linked to 'VIP Concierge'", time: "3h ago", type: "info" },
];

export const latestLogs = [
  { level: "INFO", msg: "Baileys socket opened for sess_1003", time: "12:04:22" },
  { level: "WARN", msg: "Rate limit approaching for API key ak_***21f", time: "12:03:59" },
  { level: "INFO", msg: "Message queue drained (824 items)", time: "12:03:41" },
  { level: "ERROR", msg: "ECONNRESET on webhook https://api.acme.co/hook", time: "12:03:12" },
  { level: "DEBUG", msg: "Presence update: available", time: "12:02:58" },
  { level: "INFO", msg: "QR code scanned for sess_1007", time: "12:02:33" },
];

export const connectedDevices = [
  { name: "iPhone 15 Pro", os: "iOS 18", lastActive: "just now" },
  { name: "Pixel 8", os: "Android 14", lastActive: "3m ago" },
  { name: "MacBook Pro", os: "macOS 15", lastActive: "12m ago" },
  { name: "Galaxy S24", os: "Android 14", lastActive: "1h ago" },
];

export const apiEndpoints = [
  { method: "POST", path: "/api/v1/messages/send", desc: "Send a text message", rpm: 240 },
  { method: "POST", path: "/api/v1/messages/media", desc: "Send media message", rpm: 120 },
  { method: "GET", path: "/api/v1/sessions", desc: "List all sessions", rpm: 60 },
  { method: "POST", path: "/api/v1/sessions", desc: "Create new session", rpm: 20 },
  { method: "DELETE", path: "/api/v1/sessions/:id", desc: "Delete session", rpm: 10 },
  { method: "POST", path: "/api/v1/webhooks", desc: "Register webhook", rpm: 15 },
];

export const apiKeys = [
  { name: "Production", key: "cm_live_sk_9f42••••7c21f", created: "Jan 12, 2026", lastUsed: "just now" },
  { name: "Staging", key: "cm_test_sk_1a8b••••ffe02", created: "Mar 03, 2026", lastUsed: "2h ago" },
  { name: "CI Pipeline", key: "cm_test_sk_44c9••••11a8d", created: "Jun 21, 2026", lastUsed: "1d ago" },
];

export const webhooks = [
  { id: "wh_01", url: "https://api.acme.co/hooks/cm", events: ["message.received", "session.connected"], status: "active" },
  { id: "wh_02", url: "https://ops.example.io/notify", events: ["session.disconnected"], status: "active" },
  { id: "wh_03", url: "https://hooks.zapier.com/x/abc", events: ["message.sent"], status: "paused" },
  { id: "wh_04", url: "https://internal.dev/webhook", events: ["error.occurred"], status: "failing" },
];

export const historyMessages = Array.from({ length: 12 }).map((_, i) => ({
  id: `msg_${5000 + i}`,
  session: names[i % names.length],
  to: `+1 555 0${200 + i * 3}`.slice(0, 14),
  preview: [
    "Your order #A-2841 has shipped 🎉",
    "Reply YES to confirm your appointment tomorrow at 10am.",
    "Your OTP is 428193. Do not share.",
    "Thanks for reaching out — an agent will be with you shortly.",
    "Flash sale ends at midnight. Tap to view deals.",
  ][i % 5],
  status: (["delivered", "read", "sent", "failed"] as const)[i % 4],
  time: `${(i % 12) + 1}:${((i * 7) % 60).toString().padStart(2, "0")} PM`,
}));
