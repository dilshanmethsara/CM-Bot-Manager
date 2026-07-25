import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus, Search, Filter, MoreHorizontal, Play, Pause, Trash2,
  Pencil, RefreshCw, Power, Eye, Smartphone, QrCode, Copy,
  CheckCircle2, Loader2, WifiOff,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useSessions, useCreateSession, useDeleteSession,
  useConnectSession, useDisconnectSession, useRestartSession,
  useUpdateSession,
} from "@/hooks/use-sessions";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import type { SessionInfo } from "@/lib/api";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — Cloud Mint" },
      { name: "description", content: "Manage all connected WhatsApp bot sessions in one place." },
    ],
  }),
  component: SessionsPage,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function SessionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SessionInfo | null>(null);
  const [reconnectTarget, setReconnectTarget] = useState<SessionInfo | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const { data: sessions = [], isLoading } = useSessions();
  const deleteSession   = useDeleteSession();
  const connectSession  = useConnectSession();
  const disconnectSession = useDisconnectSession();
  const restartSession  = useRestartSession();

  const filtered = sessions.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.phoneNumber.includes(q),
  );

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  async function handleDelete(id: string) {
    try {
      await deleteSession.mutateAsync(id);
      toast.success("Session deleted");
      setSelected((p) => p.filter((x) => x !== id));
    } catch (err) {
      toast.error(String(err));
    }
  }

  async function handleConnect(id: string) {
    try {
      await connectSession.mutateAsync({ id, method: "qr" });
      toast.success("Connecting… scan the QR code");
    } catch (err) {
      toast.error(String(err));
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await disconnectSession.mutateAsync(id);
      toast.success("Session disconnected");
    } catch (err) {
      toast.error(String(err));
    }
  }

  async function handleRestart(id: string) {
    try {
      await restartSession.mutateAsync(id);
      toast.success("Session restarting…");
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} · ${sessions.filter((s) => s.status === "connected").length} active`}
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-xl">
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create Session
            </Button>
          </>
        }
      />

      <Card className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sessions, phone…"
              className="h-10 rounded-xl border-border bg-card/40 pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="rounded-xl">
            <Filter className="mr-1.5 h-4 w-4" /> Status
          </Button>
          {selected.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-2 py-1 text-xs">
              <span className="font-semibold">{selected.length} selected</span>
              <Button
                size="sm" variant="ghost" className="h-7 text-destructive"
                onClick={() => selected.forEach(handleDelete)}
              >Delete</Button>
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading sessions…
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="w-8 py-3 pl-2">
                    <Checkbox
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onCheckedChange={(v) => setSelected(v ? filtered.map((s) => s.id) : [])}
                    />
                  </th>
                  <th className="py-3">Session</th>
                  <th className="py-3">Phone</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Connected</th>
                  <th className="py-3">Last active</th>
                  <th className="py-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 transition hover:bg-muted/30">
                    <td className="py-3 pl-2">
                      <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={s.avatarUrl ?? undefined} />
                          <AvatarFallback>{s.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{s.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{s.profileName ?? "—"}</p>
                          <p className="truncate font-mono text-[10px] text-muted-foreground/60" title={s.id}>{s.id.slice(0,12)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-xs">{s.phoneNumber}</td>
                    <td className="py-3">
                      <StatusBadge status={s.status === "connected" ? "active" : s.status === "connecting" || s.status === "qr" || s.status === "pairing" ? "connecting" : "disconnected"} />
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {s.connectedAt ? new Date(s.connectedAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleConnect(s.id)}>
                            <Power className="mr-2 h-4 w-4" /> Connect
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDisconnect(s.id)}>
                            <WifiOff className="mr-2 h-4 w-4" /> Disconnect
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRestart(s.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Restart
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReconnectTarget(s)}>
                            <Smartphone className="mr-2 h-4 w-4" /> Reconnect
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRenameTarget(s)}>
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(s.id); toast.success("Session ID copied"); }}>
                            <Copy className="mr-2 h-4 w-4" /> Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteClick(s.id, s.name)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="grid place-items-center py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-semibold">No sessions found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or create a new session.</p>
              <Button className="mt-4 rounded-xl" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Session
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {sessions.length}</span>
        </div>
      </Card>

      <CreateSessionDialog open={createOpen} onOpenChange={setCreateOpen} />
      {renameTarget && (
        <RenameDialog session={renameTarget} onClose={() => setRenameTarget(null)} />
      )}
      {reconnectTarget && (
        <ReconnectDialog session={reconnectTarget} onClose={() => setReconnectTarget(null)} />
      )}
    </div>
  );
}

// ─── Create session dialog ────────────────────────────────────────────────────

function CreateSessionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [method, setMethod]     = useState<"qr" | "pairing">("qr");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode]     = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const createSession  = useCreateSession();
  const connectSession = useConnectSession();

  // Listen for QR / pairing / connected events
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();

    const onQR = (data: { sessionId: string; qrCode: string }) => {
      if (data.sessionId === sessionId) setQrCode(data.qrCode);
    };
    const onPairing = (data: { sessionId: string; pairingCode: string }) => {
      if (data.sessionId === sessionId) setPairingCode(data.pairingCode);
    };
    const onConnected = (data: { id: string }) => {
      if (data.id === sessionId) {
        setConnected(true);
        setTimeout(() => { onOpenChange(false); reset(); }, 1800);
      }
    };

    socket.on(SOCKET_EVENTS.QR_GENERATED,      onQR);
    socket.on(SOCKET_EVENTS.PAIRING_CODE,      onPairing);
    socket.on(SOCKET_EVENTS.SESSION_CONNECTED, onConnected);

    return () => {
      socket.off(SOCKET_EVENTS.QR_GENERATED,      onQR);
      socket.off(SOCKET_EVENTS.PAIRING_CODE,      onPairing);
      socket.off(SOCKET_EVENTS.SESSION_CONNECTED, onConnected);
    };
  }, [sessionId, onOpenChange]);

  function reset() {
    setName(""); setPhone(""); setSessionId(null);
    setQrCode(null); setPairingCode(null); setConnected(false);
  }

  async function handleCreate() {
    if (!name || !phone) return;
    try {
      const session = await createSession.mutateAsync({ name, phoneNumber: phone });
      setSessionId(session.id);
      await connectSession.mutateAsync({ id: session.id, method });
      toast.success("Session created — waiting for connection…");
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="glass max-w-lg rounded-2xl border-border">
        <DialogHeader>
          <DialogTitle>Create new session</DialogTitle>
          <DialogDescription>Pair a new WhatsApp device with your Cloud Mint workspace.</DialogDescription>
        </DialogHeader>

        {connected ? (
          <div className="grid place-items-center py-10">
            <div className="grid h-16 w-16 animate-in zoom-in place-items-center rounded-full bg-[oklch(0.78_0.17_155)]/15">
              <CheckCircle2 className="h-8 w-8 text-[oklch(0.85_0.17_155)]" />
            </div>
            <p className="mt-4 font-semibold">Successfully connected</p>
          </div>
        ) : !sessionId ? (
          <>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Session name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Bot US" className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>Phone number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" className="rounded-xl" />
              </div>
            </div>

            <Tabs value={method} onValueChange={(v) => setMethod(v as "qr" | "pairing")}>
              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="qr" className="rounded-lg">QR Code</TabsTrigger>
                <TabsTrigger value="pairing" className="rounded-lg">Pairing Code</TabsTrigger>
              </TabsList>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={createSession.isPending || connectSession.isPending || !name || !phone}
                className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
              >
                {(createSession.isPending || connectSession.isPending) && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Connect
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            {method === "qr" ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/40 py-8">
                {qrCode ? (
                  <>
                    <div className="rounded-xl bg-white p-3">
                      <QRCodeSVG value={qrCode} size={180} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Scan with WhatsApp › Linked Devices</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Generating QR code…</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
                {pairingCode ? (
                  <>
                    <p className="font-mono text-3xl font-bold tracking-[0.4em] gradient-text">{pairingCode}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Enter this code in WhatsApp › Linked Devices › Link with phone number</p>
                    <Button
                      variant="outline" size="sm" className="mt-3 rounded-lg"
                      onClick={() => { navigator.clipboard.writeText(pairingCode); toast.success("Copied"); }}
                    >
                      <Copy className="mr-1.5 h-3 w-3" /> Copy code
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm">Requesting pairing code…</p>
                  </div>
                )}
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground">Waiting for device to connect…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Rename dialog ────────────────────────────────────────────────────────────

function RenameDialog({ session, onClose }: { session: SessionInfo; onClose: () => void }) {
  const [name, setName] = useState(session.name);
  const update = useUpdateSession();

  async function handleSave() {
    try {
      await update.mutateAsync({ id: session.id, name });
      toast.success("Session renamed");
      onClose();
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass max-w-sm rounded-2xl border-border">
        <DialogHeader>
          <DialogTitle>Rename session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label>New name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={update.isPending || !name} className="rounded-xl">
            {update.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reconnect dialog ──────────────────────────────────────────────────────────

function ReconnectDialog({ session, onClose }: { session: SessionInfo | null; onClose: () => void }) {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const conn = useConnectSession();

  useEffect(() => {
    if (!session) return;
    const socket = getSocket();
    const sid = session.id;

    const onQR = (d: { sessionId: string; qrCode: string }) => { if (d.sessionId === sid) setQrCode(d.qrCode); };
    const onPairing = (d: { sessionId: string; pairingCode: string }) => { if (d.sessionId === sid) setPairingCode(d.pairingCode); };
    const onConnected = (d: { id: string }) => {
      if (d.id === sid) { setConnected(true); setTimeout(onClose, 1800); }
    };

    socket.on(SOCKET_EVENTS.QR_GENERATED, onQR);
    socket.on(SOCKET_EVENTS.PAIRING_CODE, onPairing);
    socket.on(SOCKET_EVENTS.SESSION_CONNECTED, onConnected);

    conn.mutate({ id: sid, method: 'pairing' });

    return () => {
      socket.off(SOCKET_EVENTS.QR_GENERATED, onQR);
      socket.off(SOCKET_EVENTS.PAIRING_CODE, onPairing);
      socket.off(SOCKET_EVENTS.SESSION_CONNECTED, onConnected);
    };
  }, [session?.id]);

  if (!session) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass max-w-sm rounded-2xl border-border">
        <DialogHeader>
          <DialogTitle>Reconnect {session.name}</DialogTitle>
          <DialogDescription>
            {connected ? "✅ Connected!" : "Pairing with WhatsApp…"}
          </DialogDescription>
        </DialogHeader>

        {connected ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
            <p className="mt-2 font-semibold">Session reconnected</p>
          </div>
        ) : pairingCode ? (
          <div className="space-y-4 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Open WhatsApp → Linked Devices → Link a Device → <strong>Link by Phone Number</strong>
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-muted p-4">
              <code className="select-all text-2xl font-bold tracking-widest">{pairingCode}</code>
              <Button size="icon" variant="ghost" className="shrink-0" onClick={() => { navigator.clipboard.writeText(pairingCode!); toast.success('Copied'); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">Enter this code on your phone</p>
          </div>
        ) : qrCode ? (
          <div className="flex justify-center py-4">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={qrCode} size={220} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            {connected ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
