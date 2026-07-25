import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Smartphone, Wifi, WifiOff, Pause, Send, Inbox, Zap, Server,
  Plus, RefreshCw, Download,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie,
  PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStats } from "@/hooks/use-stats";
import { useLogs } from "@/hooks/use-logs";
import { useSessions } from "@/hooks/use-sessions";
import { systemApi } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Cloud Mint (CM Bot Manager)" },
      { name: "description", content: "Realtime overview of your Cloud Mint bot sessions, messaging throughput, and API health." },
    ],
  }),
  component: Dashboard,
});

const chartTooltip = {
  contentStyle: {
    background: "oklch(0.20 0.02 240 / 0.9)",
    border: "1px solid oklch(1 0 0 / 0.1)",
    borderRadius: 12,
    backdropFilter: "blur(12px)",
    fontSize: 12,
  },
} as const;

function Dashboard() {
  const { data: stats } = useStats();
  const { data: sessions = [] } = useSessions();
  const { data: logsData } = useLogs({ limit: 6 });
  const { data: trends } = useQuery({ queryKey: ['messageTrends'], queryFn: systemApi.messageTrends, refetchInterval: 60_000 });
  const { data: delivery } = useQuery({ queryKey: ['deliveryStats'], queryFn: systemApi.deliveryStats, refetchInterval: 60_000 });
  const { data: apiUsageData } = useQuery({ queryKey: ['apiUsage'], queryFn: systemApi.apiUsage, refetchInterval: 60_000 });
  const qc = useQueryClient();

  const latestLogs = logsData?.logs ?? [];

  const successRate = delivery
    ? [{ name: "Success", value: delivery.rate }, { name: "Failed", value: 100 - delivery.rate }]
    : [{ name: "Success", value: 100 }, { name: "Failed", value: 0 }];

  const sessionActivity = [
    { name: "Active",       value: stats?.activeSessions       ?? 0 },
    { name: "Paused",       value: stats?.pausedSessions       ?? 0 },
    { name: "Disconnected", value: stats?.disconnectedSessions ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back"
        description="Here's what's happening across your bot network today."
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => qc.invalidateQueries()}>
              <Download className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
              onClick={() => window.location.href = "/sessions"}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New Session
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sessions"  value={stats?.totalSessions  ?? "—"} icon={Smartphone} delta={0}  tone="primary" />
        <StatCard label="Active"          value={stats?.activeSessions ?? "—"} icon={Wifi}       delta={0}  tone="success"     hint={stats ? `${Math.round((stats.activeSessions / Math.max(stats.totalSessions, 1)) * 100)}% of pool` : undefined} />
        <StatCard label="Disconnected"    value={stats?.disconnectedSessions ?? "—"} icon={WifiOff} delta={0} tone="destructive" />
        <StatCard label="Paused"          value={stats?.pausedSessions ?? "—"} icon={Pause} tone="warning" />
        <StatCard label="Messages Sent"   value={stats ? stats.messagesSentToday.toLocaleString() : "—"} icon={Send}   delta={0} tone="primary"  hint="today" />
        <StatCard label="Total Messages"  value={stats ? stats.messagesReceived.toLocaleString()  : "—"} icon={Inbox}  delta={0} tone="accent" />
        <StatCard label="Total Logs"      value={stats ? stats.totalLogs.toLocaleString()         : "—"} icon={Zap}    delta={0} tone="accent" />
        <StatCard label="Server Status"   value={stats?.serverStatus ?? "—"} icon={Server} tone="success" hint="All systems green" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass col-span-2 rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Messages Over Time</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={trends ?? []}>
                <defs>
                  <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.17 165)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.82 0.17 165)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.18 245)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.65 0.18 245)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.7 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.7 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="sent"     stroke="oklch(0.82 0.17 165)" fill="url(#sent)" strokeWidth={2} />
                <Area type="monotone" dataKey="received" stroke="oklch(0.65 0.18 245)" fill="url(#recv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Success Rate</h3>
          <p className="text-xs text-muted-foreground">Message delivery</p>
          <div className="relative mt-2 h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={successRate} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                  <Cell fill="oklch(0.82 0.17 165)" />
                  <Cell fill="oklch(0.30 0.02 240)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text">94%</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">delivered</p>
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 p-2"><p className="text-muted-foreground">Success</p><p className="font-semibold">{stats?.messagesReceived ?? 0}</p></div>
            <div className="rounded-lg bg-muted/40 p-2"><p className="text-muted-foreground">Today</p><p className="font-semibold">{stats?.messagesSentToday ?? 0}</p></div>
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-2xl p-5">
          <h3 className="font-semibold">API Usage</h3>
          <p className="text-xs text-muted-foreground">Requests per hour (today)</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer>
              <BarChart data={apiUsageData ?? []}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="hour" stroke="oklch(0.7 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.7 0.03 240)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltip} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                <Bar dataKey="calls" fill="oklch(0.65 0.18 245)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass rounded-2xl p-5">
          <h3 className="font-semibold">Session Activity</h3>
          <p className="text-xs text-muted-foreground">Distribution</p>
          <div className="mt-4 space-y-3">
            {sessionActivity.map((s, i) => {
              const total = sessionActivity.reduce((a, b) => a + b.value, 0) || 1;
              const pct   = Math.round((s.value / total) * 100);
              const colors = ["oklch(0.82 0.17 165)", "oklch(0.82 0.16 80)", "oklch(0.65 0.22 25)"];
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Node version</p>
            <p className="mt-1 text-lg font-bold gradient-text">{stats?.nodeVersion ?? "—"}</p>
          </div>
        </Card>

        <Card className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { icon: Plus,      label: "New Session",  href: "/sessions" },
              { icon: Send,      label: "Send Message", href: "/messaging" },
              { icon: RefreshCw, label: "View Logs",    href: "/logs" },
              { icon: Zap,       label: "Settings",     href: "/settings" },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card/40 p-3 text-left transition hover:border-primary/40 hover:bg-card/70"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary transition group-hover:scale-110">
                  <a.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">{a.label}</span>
              </a>
            ))}
          </div>
        </Card>
      </div>

      {/* Live sessions + latest logs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Live Sessions</h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = "/sessions"}>View all</Button>
          </div>
          <div className="space-y-1">
            {sessions.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-muted/40">
                <span className={`h-2 w-2 shrink-0 rounded-full ${s.status === "connected" ? "bg-[oklch(0.78_0.17_155)]" : s.status === "connecting" || s.status === "qr" ? "bg-[oklch(0.82_0.16_80)] animate-pulse" : "bg-destructive"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.phoneNumber}</p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{s.status}</Badge>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No sessions yet.</p>
            )}
          </div>
        </Card>

        <Card className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Latest Logs</h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = "/logs"}>View all</Button>
          </div>
          <div className="space-y-2">
            {latestLogs.map((l) => {
              const color: Record<string, string> = {
                INFO:  "text-accent",
                WARN:  "text-[oklch(0.86_0.16_80)]",
                ERROR: "text-destructive",
                DEBUG: "text-muted-foreground",
              };
              return (
                <div key={l.id} className="rounded-lg p-2 transition hover:bg-muted/40">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${color[l.level] ?? "text-muted-foreground"}`}>{l.level}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs">{l.message}</p>
                </div>
              );
            })}
            {latestLogs.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No logs yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

