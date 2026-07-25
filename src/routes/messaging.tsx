import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Send, Image as ImageIcon, FileText, Mic, Radio, Clock,
  History as HistoryIcon, Upload, Paperclip, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSessions } from "@/hooks/use-sessions";
import { useSendText, useSendImage, useSendDocument, useMessageHistory } from "@/hooks/use-messages";

export const Route = createFileRoute("/messaging")({
  head: () => ({
    meta: [
      { title: "Messaging — Cloud Mint" },
      { name: "description", content: "Send text, media, and broadcasts from your bot sessions." },
    ],
  }),
  component: Messaging,
});

const tabs = [
  { v: "text",     label: "Send Text",     icon: Send },
  { v: "media",    label: "Send Media",    icon: ImageIcon },
  { v: "document", label: "Send Document", icon: FileText },
  { v: "history",  label: "History",       icon: HistoryIcon },
];

function Messaging() {
  return (
    <div className="space-y-6">
      <PageHeader title="Messaging" description="Compose and dispatch messages across your sessions." />
      <Tabs defaultValue="text">
        <TabsList className="glass h-auto flex-wrap justify-start gap-1 rounded-2xl p-1.5">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.v} value={t.v}
              className="gap-1.5 rounded-xl px-3 py-2 text-xs data-[state=active]:bg-[image:var(--gradient-primary)] data-[state=active]:text-primary-foreground"
            >
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="text"     className="mt-4"><ComposeText /></TabsContent>
        <TabsContent value="media"    className="mt-4"><MediaUpload type="image" accept="image/*" desc="PNG, JPG, MP4 up to 25 MB" /></TabsContent>
        <TabsContent value="document" className="mt-4"><MediaUpload type="document" accept=".pdf,.docx,.xlsx,.csv,.txt" desc="PDF, DOCX, XLSX up to 100 MB" /></TabsContent>
        <TabsContent value="history"  className="mt-4"><HistoryList /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Compose text ─────────────────────────────────────────────────────────────

function ComposeText() {
  const [sessionId, setSessionId] = useState("");
  const [to,        setTo]        = useState("");
  const [content,   setContent]   = useState("");

  const { data: sessions = [] } = useSessions();
  const connected = sessions.filter((s) => s.status === "connected");
  const send = useSendText();

  async function handleSend() {
    if (!sessionId || !to || !content) {
      toast.error("Fill in all fields");
      return;
    }
    try {
      await send.mutateAsync({ sessionId, to, content });
      toast.success("Message sent");
      setTo(""); setContent("");
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass rounded-2xl p-5 lg:col-span-2">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>From session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a connected session" /></SelectTrigger>
              <SelectContent>
                {connected.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.phoneNumber}</SelectItem>
                ))}
                {connected.length === 0 && (
                  <SelectItem value="none" disabled>No connected sessions</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Recipient</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1 555 010 3421" className="rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label>Message</Label>
            <Textarea
              rows={8} value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Hey 👋, thanks for reaching out — how can we help?"
              className="resize-none rounded-xl"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length} chars</span>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => { setTo(""); setContent(""); }}>Clear</Button>
              <Button
                onClick={handleSend}
                disabled={send.isPending || !sessionId || !to || !content}
                className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
              >
                {send.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                Send now
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <Card className="glass rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
        <div className="mt-3 rounded-2xl bg-[oklch(0.20_0.02_240)] p-4">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[image:var(--gradient-primary)] p-3 text-sm text-primary-foreground shadow-lg">
            {content || "Hey 👋, thanks for reaching out — how can we help?"}
            <div className="mt-1 text-right text-[10px] opacity-80">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Characters: <span className="font-semibold text-foreground">{content.length}</span> · Segments:{" "}
          <span className="font-semibold text-foreground">{Math.ceil(content.length / 160) || 1}</span>
        </div>
      </Card>
    </div>
  );
}

// ─── Media / Document upload ──────────────────────────────────────────────────

function MediaUpload({ type, accept, desc }: { type: "image" | "document"; accept: string; desc: string }) {
  const [sessionId, setSessionId] = useState("");
  const [to,        setTo]        = useState("");
  const [caption,   setCaption]   = useState("");
  const [file,      setFile]      = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: sessions = [] } = useSessions();
  const connected = sessions.filter((s) => s.status === "connected");
  const sendImage    = useSendImage();
  const sendDocument = useSendDocument();
  const sending = sendImage.isPending || sendDocument.isPending;

  async function handleSend() {
    if (!sessionId || !to || !file) { toast.error("Fill in all fields and select a file"); return; }
    try {
      if (type === "image") {
        await sendImage.mutateAsync({ sessionId, to, file, caption });
      } else {
        await sendDocument.mutateAsync({ sessionId, to, file, caption });
      }
      toast.success(`${type === "image" ? "Image" : "Document"} sent`);
      setFile(null); setTo(""); setCaption("");
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <Card className="glass rounded-2xl p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="grid place-items-center rounded-2xl border-2 border-dashed border-border bg-card/40 p-10 text-center transition hover:border-primary/40"
        >
          <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          {file ? (
            <p className="mt-3 font-medium text-sm">{file.name}</p>
          ) : (
            <>
              <p className="mt-3 font-semibold">Drop {type} here or click to upload</p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </>
          )}
        </button>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select session" /></SelectTrigger>
              <SelectContent>
                {connected.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Recipient</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1 555 010 3421" className="rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label>Caption</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption" className="resize-none rounded-xl" />
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !sessionId || !to || !file}
            className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
          >
            {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Send {type === "image" ? "Image" : "Document"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────

function HistoryList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMessageHistory(page);
  const messages = data?.messages ?? [];
  const pagination = data?.pagination;

  const statusColor: Record<string, string> = {
    sent:      "bg-[oklch(0.78_0.17_155)] text-[oklch(0.20_0.02_240)]",
    delivered: "bg-accent/20 text-accent",
    failed:    "bg-destructive/20 text-destructive",
    queued:    "bg-muted text-muted-foreground",
  };

  return (
    <Card className="glass overflow-hidden rounded-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading history…
        </div>
      ) : messages.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No messages sent yet.</div>
      ) : (
        <div className="divide-y divide-border">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-4 p-4 transition hover:bg-muted/30">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Send className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{m.session?.name ?? m.sessionId}</p>
                  <span className="text-xs text-muted-foreground">→ {m.to}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{m.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
              <Badge className={`shrink-0 rounded-full text-[10px] ${statusColor[m.status] ?? statusColor.queued}`}>
                {m.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
