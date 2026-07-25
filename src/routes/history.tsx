import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MessageSquare, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMessageHistory } from "@/hooks/use-messages";
import { useLogs } from "@/hooks/use-logs";
import { useApiRequests } from "@/hooks/use-api-requests";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Cloud Mint" },
      { name: "description", content: "Search past messages, connections, and errors." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [search, setSearch] = useState("");
  const [msgPage, setMsgPage] = useState(1);
  const [apiPage, setApiPage] = useState(1);

  const { data: msgData, isLoading: msgLoading } = useMessageHistory(msgPage);
  const { data: logsData, isLoading: logsLoading } = useLogs({ limit: 20, level: "ERROR" });
  const { data: apiData, isLoading: apiLoading } = useApiRequests(apiPage);

  const messages    = msgData?.messages  ?? [];
  const errorLogs   = logsData?.logs     ?? [];
  const apiRequests = apiData?.requests  ?? [];
  const msgPagination  = msgData?.pagination;
  const apiPagination  = apiData?.pagination;

  const statusColor: Record<string, string> = {
    sent:      "bg-[oklch(0.78_0.17_155)] text-[oklch(0.20_0.02_240)]",
    delivered: "bg-accent/20 text-accent",
    failed:    "bg-destructive/20 text-destructive",
    queued:    "bg-muted text-muted-foreground",
  };

  const filteredMsgs = messages.filter(
    (m) => !search || m.to.includes(search) || m.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="History" description="A complete timeline of what happened, when." />

      <Card className="glass rounded-2xl p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history…"
            className="h-10 rounded-xl pl-9"
          />
        </div>
      </Card>

      <Tabs defaultValue="messages">
        <TabsList className="rounded-xl">
          <TabsTrigger value="messages" className="rounded-lg gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Messages</TabsTrigger>
          <TabsTrigger value="api"      className="rounded-lg gap-1.5"><Zap className="h-3.5 w-3.5" />API Requests</TabsTrigger>
          <TabsTrigger value="err"      className="rounded-lg gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Errors</TabsTrigger>
        </TabsList>

        {/* ── Messages ── */}
        <TabsContent value="messages" className="mt-4">
          <Card className="glass overflow-hidden rounded-2xl">
            {msgLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading messages…
              </div>
            ) : filteredMsgs.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No messages yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredMsgs.map((m) => (
                  <div key={m.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 p-4 transition hover:bg-muted/30">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        <span className="font-medium">{m.session?.name ?? m.sessionId}</span>
                        {" → "}
                        <span className="font-mono text-xs text-muted-foreground">{m.to}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.content}</p>
                    </div>
                    <Badge className={`h-fit shrink-0 rounded-full text-[10px] ${statusColor[m.status] ?? statusColor.queued}`}>
                      {m.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {msgPagination && msgPagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>Page {msgPagination.page} of {msgPagination.totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={msgPage <= 1} onClick={() => setMsgPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={msgPage >= msgPagination.totalPages} onClick={() => setMsgPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── API Requests (real) ── */}
        <TabsContent value="api" className="mt-4">
          <Card className="glass overflow-hidden rounded-2xl">
            {apiLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading API requests…
              </div>
            ) : apiRequests.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No API requests recorded yet. Start using the app to see data here.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-3">Time</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Path</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {apiRequests.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 transition hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">
                        {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="p-3">
                        <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
                          r.method === 'GET' ? 'bg-accent/15 text-accent' :
                          r.method === 'POST' ? 'bg-[oklch(0.82_0.17_165)]/15 text-[oklch(0.85_0.17_155)]' :
                          r.method === 'DELETE' ? 'bg-destructive/15 text-destructive' :
                          'bg-muted text-muted-foreground'
                        }`}>{r.method}</span>
                      </td>
                      <td className="p-3 font-mono text-xs max-w-[300px] truncate" title={r.path}>{r.path}</td>
                      <td className="p-3">
                        <span className={`font-mono text-xs font-semibold ${
                          r.statusCode < 300 ? "text-[oklch(0.85_0.17_155)]" :
                          r.statusCode < 500 ? "text-[oklch(0.86_0.16_80)]" :
                          "text-destructive"
                        }`}>{r.statusCode}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{r.durationMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {apiPagination && apiPagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>Page {apiPagination.page} of {apiPagination.totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={apiPage <= 1} onClick={() => setApiPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={apiPage >= apiPagination.totalPages} onClick={() => setApiPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Errors ── */}
        <TabsContent value="err" className="mt-4">
          <Card className="glass overflow-hidden rounded-2xl">
            {logsLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading errors…
              </div>
            ) : errorLogs.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No errors logged.</div>
            ) : (
              <div className="divide-y divide-border">
                {errorLogs.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{e.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
