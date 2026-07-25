import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Download, Filter, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLogs } from "@/hooks/use-logs";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "System Logs — Cloud Mint" },
      { name: "description", content: "Live system logs with severity filtering and export." },
    ],
  }),
  component: LogsPage,
});

const ALL_LEVELS = ["INFO", "WARN", "ERROR", "DEBUG"] as const;

const colors: Record<string, string> = {
  INFO:  "text-accent border-accent/25 bg-accent/10",
  WARN:  "text-[oklch(0.86_0.16_80)] border-[oklch(0.82_0.16_80)]/25 bg-[oklch(0.82_0.16_80)]/10",
  ERROR: "text-destructive border-destructive/25 bg-destructive/10",
  DEBUG: "text-muted-foreground border-border bg-muted/40",
};

function LogsPage() {
  const [search,       setSearch]       = useState("");
  const [activeLevel,  setActiveLevel]  = useState<string | undefined>(undefined);
  const [page,         setPage]         = useState(1);

  const { data, isLoading, isRefetching } = useLogs({
    page,
    limit: 50,
    level:  activeLevel,
    search: search.trim() || undefined,
  });

  const logs       = data?.logs       ?? [];
  const pagination = data?.pagination;

  function toggleLevel(l: string) {
    setActiveLevel((prev) => (prev === l ? undefined : l));
    setPage(1);
  }

  function downloadLogs() {
    const lines = logs.map((l) =>
      `[${new Date(l.createdAt).toISOString()}] [${l.level}]${l.sessionId ? ` [${l.sessionId}]` : ""} ${l.message}`
    ).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "cm-logs.txt" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Logs"
        description="Stream live logs across every service."
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Filter className="mr-1.5 h-4 w-4" /> Levels
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={downloadLogs}>
              <Download className="mr-1.5 h-4 w-4" /> Download
            </Button>
          </>
        }
      />

      <Card className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search logs…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          {ALL_LEVELS.map((l) => (
            <Badge
              key={l} variant="outline"
              className={`cursor-pointer rounded-md font-mono text-[10px] transition ${colors[l]} ${activeLevel === l ? "ring-2 ring-primary ring-offset-1" : ""}`}
              onClick={() => toggleLevel(l)}
            >
              {l}
            </Badge>
          ))}
          <span className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            <span className={`h-1.5 w-1.5 rounded-full bg-primary ${isRefetching ? "animate-pulse" : ""}`} />
            {isRefetching ? "UPDATING" : "LIVE"}
          </span>
        </div>
      </Card>

      <Card className="glass overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading logs…
          </div>
        ) : (
          <>
            <div className="max-h-[600px] overflow-y-auto font-mono text-[12px]">
              {logs.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">No logs match your filters.</div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="grid grid-cols-[auto_auto_auto_1fr] items-center gap-3 border-b border-border/40 px-4 py-2 hover:bg-muted/30">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleTimeString()}
                    </span>
                    <span className={`inline-flex w-14 justify-center rounded-md border px-1 py-0.5 text-[10px] font-semibold ${colors[l.level] ?? colors.DEBUG}`}>
                      {l.level}
                    </span>
                    <span className="text-muted-foreground truncate max-w-[80px]">
                      {l.sessionId ? `[${l.sessionId.slice(0, 8)}…]` : "[system]"}
                    </span>
                    <span className="min-w-0 truncate">{l.message}</span>
                  </div>
                ))
              )}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>{pagination.total} total · page {pagination.page}/{pagination.totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
