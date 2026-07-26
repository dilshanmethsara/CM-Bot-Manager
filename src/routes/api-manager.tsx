import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Key, Plus, RefreshCw, Book, Zap, Copy, Trash2, Loader2, Bot } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRateLimits, useApiKeys } from "@/hooks/use-rate-limits";
import { useSessions } from "@/hooks/use-sessions";
import { systemApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/config";

const apiEndpoints = [
  { method: "POST",   path: "/api/v1/messages/text",     desc: "Send a text message",    rpm: 240 },
  { method: "POST",   path: "/api/v1/messages/image",    desc: "Send image message",     rpm: 120 },
  { method: "POST",   path: "/api/v1/messages/document", desc: "Send document message",  rpm: 60  },
  { method: "GET",    path: "/api/v1/sessions",          desc: "List all sessions",      rpm: 60  },
  { method: "POST",   path: "/api/v1/sessions",          desc: "Create new session",     rpm: 20  },
  { method: "DELETE", path: "/api/v1/sessions/:id",      desc: "Delete session",         rpm: 10  },
  { method: "POST",   path: "/api/v1/sessions/:id/connect",    desc: "Connect / start QR",   rpm: 10 },
  { method: "POST",   path: "/api/v1/sessions/:id/disconnect", desc: "Disconnect session",    rpm: 10 },
  { method: "POST",   path: "/api/v1/sessions/:id/restart",    desc: "Restart session",       rpm: 10 },
  { method: "GET",    path: "/api/v1/system/stats",      desc: "Get system stats",       rpm: 60  },
  { method: "GET",    path: "/api/v1/system/logs",       desc: "Get system logs",        rpm: 60  },
];

const methodColors: Record<string, string> = {
  GET:    "bg-accent/15 text-accent border-accent/25",
  POST:   "bg-[oklch(0.78_0.17_155)]/15 text-[oklch(0.85_0.17_155)] border-[oklch(0.78_0.17_155)]/25",
  DELETE: "bg-destructive/15 text-destructive border-destructive/25",
};

const baseUrl = getApiBaseUrl() || 'http://localhost:3000';

const codeSample = `curl -X POST ${baseUrl}/api/v1/messages/text \\\\
  -H "Content-Type: application/json" \\\\
  -H "Authorization: Bearer cm_<your-api-key>" \\\\
  -d '{
    "sessionId": "your-session-id",
    "to": "+15550103421",
    "content": "Hello from Cloud Mint 👋"
  }'`;

export const Route = createFileRoute("/api-manager")({
  head: () => ({
    meta: [
      { title: "API Manager — Cloud Mint" },
      { name: "description", content: "Manage API keys, endpoints, webhooks, and rate limits." },
    ],
  }),
  component: ApiManager,
});

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback for HTTP (navigator.clipboard undefined)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* noop */ }
    document.body.removeChild(ta);
  }
  toast.success('Copied');
}

function ApiManager() {
  const [keyName, setKeyName] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const qc = useQueryClient();
  const { data: limits, isLoading: limitsLoading } = useRateLimits();
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();
  const { data: sessions } = useSessions();
  const connectedSessions = (sessions ?? []).filter((s) => s.status === "connected");

  const handleCreate = async () => {
    if (!keyName.trim()) return toast.error("Enter a name for the key");
    try {
      await systemApi.apiKeys.create(keyName.trim(), selectedSessionId || undefined);
      setKeyName("");
      setSelectedSessionId("");
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success("API key created");
    } catch { toast.error("Failed to create key"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await systemApi.apiKeys.delete(id);
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success("API key deleted");
    } catch { toast.error("Failed to delete key"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Manager"
        description="Everything you need to integrate Cloud Mint into your stack."
        actions={
          <Button className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
            <Plus className="mr-1.5 h-4 w-4" /> New API Key
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Endpoints</h3>
              <p className="text-xs text-muted-foreground">REST · v1</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Book className="mr-1.5 h-4 w-4" /> Docs
            </Button>
          </div>
          <div className="space-y-2">
            {apiEndpoints.map((e) => (
              <div
                key={e.path}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/40 p-3 transition hover:border-primary/40"
              >
                <Badge variant="outline" className={`rounded-md font-mono ${methodColors[e.method]}`}>{e.method}</Badge>
                <code className="font-mono text-xs">{e.path}</code>
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{e.desc}</p>
                <span className="text-[11px] text-muted-foreground">{e.rpm}/min</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Rate limits</h3>
            <Zap className="h-4 w-4 text-accent" />
          </div>
          {limitsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            limits && [
              { label: "Requests / min",      data: limits.requestsPerMin },
              { label: "Messages / today",    data: limits.messagesPerHour },
              { label: "Media uploads / day",  data: limits.mediaUploadsPerDay },
            ].map((r) => (
              <div key={r.label} className="mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold">{r.data.used.toLocaleString()} / {r.data.cap.toLocaleString()}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[image:var(--gradient-primary)]" style={{ width: `${Math.min((r.data.used / r.data.cap) * 100, 100)}%` }} />
                </div>
              </div>
            ))
          )}
          <div className="mt-4 rounded-xl border border-[oklch(0.78_0.17_155)]/25 bg-[oklch(0.78_0.17_155)]/10 p-3">
            <p className="text-xs font-semibold text-[oklch(0.85_0.17_155)]">Status: All systems normal</p>
          </div>
        </Card>
      </div>

      <Card className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">API Keys</h3>
            <p className="text-xs text-muted-foreground">Each key can be scoped to a specific WhatsApp bot</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => qc.invalidateQueries({ queryKey: ['api-keys'] })}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key name (e.g. Production Bot)"
            className="h-9 max-w-xs rounded-xl"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="h-9 w-48 rounded-xl">
              <SelectValue placeholder="All bots (no scope)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All bots (no scope)</SelectItem>
              {connectedSessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" />
                    {s.name} ({s.phoneNumber})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-9 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90" onClick={handleCreate}>
            <Plus className="mr-1 h-4 w-4" /> Generate Key
          </Button>
        </div>

        {keysLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading keys…
          </div>
        ) : !apiKeys?.length ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 py-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <Key className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium">No API keys</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first key above to access the API programmatically.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Key className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{k.name}</p>
                    {k.session && (
                      <Badge variant="outline" className="gap-1 rounded-full border-accent/20 bg-accent/10 px-2 py-0 text-[10px] font-normal text-accent">
                        <Bot className="h-3 w-3" /> {k.session.name}
                      </Badge>
                    )}
                    {!k.session && (
                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-normal text-muted-foreground">
                        Global
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {k.key.slice(0, 16)}…
                    <Button variant="ghost" size="sm" className="ml-1 h-auto p-0 text-xs text-accent hover:bg-transparent hover:underline"
                                            onClick={() => { copyToClipboard(k.key); }}>
                      <Copy className="mr-0.5 inline h-3 w-3" /> copy
                    </Button>
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground">{k.lastUsed ? `Last used ${new Date(k.lastUsed).toLocaleDateString()}` : "Never used"}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete(k.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Example request</h3>
          <Button variant="ghost" size="sm"           <Button variant="ghost" size="sm" onClick={() => { copyToClipboard(codeSample); }}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-border bg-[oklch(0.12_0.02_240)] p-4 font-mono text-[12px] leading-relaxed text-[oklch(0.9_0.02_200)]">
{codeSample}
        </pre>
      </Card>
    </div>
  );
}
