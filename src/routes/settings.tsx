import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useStats } from "@/hooks/use-stats";
import { useLogout } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Cloud Mint" },
      { name: "description", content: "General, appearance, security, and workspace settings." },
    ],
  }),
  component: SettingsPage,
});

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Card className="glass rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Separator className="mb-4" />
      <div className="grid gap-4">{children}</div>
    </Card>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div>
        <Label className="text-sm">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

// ─── Password change section ──────────────────────────────────────────────────

function PasswordSection() {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleUpdate() {
    if (!current || !next) { toast.error("Fill in both fields"); return; }
    if (next.length < 6)   { toast.error("New password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await authApi.changePassword(current, next);
      toast.success("Password updated");
      setCurrent(""); setNext("");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section title="Dashboard Password" desc="Protect access to your dashboard">
      <Row label="Current password">
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" className="w-56 rounded-xl" />
      </Row>
      <Row label="New password">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (min 6 chars)" className="w-56 rounded-xl" />
      </Row>
      <div className="flex justify-end">
        <Button onClick={handleUpdate} disabled={loading} className="rounded-xl">
          {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SettingsPage() {
  const { data: stats } = useStats();
  const logout = useLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your workspace, security, and integrations." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="General" desc="Workspace basics">
          <Row label="Workspace name"><Input defaultValue="Cloud Mint HQ" className="w-56 rounded-xl" /></Row>
          <Row label="Timezone"><Input defaultValue="UTC+00:00" className="w-56 rounded-xl" /></Row>
          <Row label="Default language"><Input defaultValue="English (US)" className="w-56 rounded-xl" /></Row>
        </Section>

        <Section title="Appearance" desc="Theme and interface preferences">
          <Row label="Dark theme" hint="Use the dark side of the moon"><Switch defaultChecked /></Row>
          <Row label="Reduced motion"><Switch /></Row>
          <Row label="Sidebar auto-collapse"><Switch defaultChecked /></Row>
        </Section>

        <PasswordSection />

        <Section title="API Settings" desc="Global API behavior">
          <Row label="Enable rate limiting"><Switch defaultChecked /></Row>
          <Row label="Auto-retry failed webhooks"><Switch defaultChecked /></Row>
          <Row label="Log request bodies"><Switch /></Row>
        </Section>

        <Section title="Server Information" desc="Read-only runtime details">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Node version" value={stats?.nodeVersion ?? "—"} />
            <Info label="Server status" value={stats?.serverStatus ?? "—"} />
            <Info label="Total sessions" value={String(stats?.totalSessions ?? "—")} />
            <Info label="Total logs" value={String(stats?.totalLogs ?? "—")} />
          </div>
        </Section>

        <Section title="Database Information" desc="Connection & storage">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Engine" value="SQLite (via Prisma)" />
            <Info label="Messages stored" value={String(stats?.messagesReceived ?? "—")} />
          </div>
        </Section>
      </div>

      <Section title="About" desc="Product info">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-semibold">Cloud Mint — CM Bot Manager</p>
            <p className="text-xs text-muted-foreground">v1.0.0 · Node.js + Baileys + Prisma + Socket.IO</p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Sign out
          </Button>
        </div>
      </Section>

      <Card className="glass rounded-2xl border-destructive/30 p-5">
        <h3 className="font-semibold text-destructive">Danger Zone</h3>
        <p className="mt-1 text-xs text-muted-foreground">These actions are irreversible.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl border-destructive/40 text-destructive">Reset all sessions</Button>
          <Button variant="outline" className="rounded-xl border-destructive/40 text-destructive">Purge history</Button>
        </div>
      </Card>
    </div>
  );
}
