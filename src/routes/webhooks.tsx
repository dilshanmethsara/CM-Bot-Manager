import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Webhook, Pencil, Trash2, Play } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";

const WEBHOOKS = [
  { id: "wh_01", url: "https://api.acme.co/hooks/cm",    events: ["message.received", "session.connected"], status: "active"  },
  { id: "wh_02", url: "https://ops.example.io/notify",   events: ["session.disconnected"],                  status: "active"  },
  { id: "wh_03", url: "https://hooks.zapier.com/x/abc",  events: ["message.sent"],                          status: "paused"  },
  { id: "wh_04", url: "https://internal.dev/webhook",    events: ["error.occurred"],                        status: "failing" },
];

export const Route = createFileRoute("/webhooks")({
  head: () => ({
    meta: [
      { title: "Webhooks — Cloud Mint" },
      { name: "description", content: "Register, test, and monitor webhook subscriptions." },
      { property: "og:title", content: "Webhooks — Cloud Mint" },
      { property: "og:description", content: "Deliver realtime events to your services." },
    ],
  }),
  component: Webhooks,
});

function Webhooks() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        description="Get realtime notifications delivered to your services."
        actions={
          <Button className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
            <Plus className="mr-1.5 h-4 w-4" /> Create Webhook
          </Button>
        }
      />

      <div className="grid gap-3">
        {WEBHOOKS.map((w) => (
          <Card key={w.id} className="glass rounded-2xl p-4">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:flex sm:flex-wrap">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Webhook className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm">{w.url}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {w.events.map((e) => (
                    <Badge key={e} variant="outline" className="rounded-md font-mono text-[10px]">{e}</Badge>
                  ))}
                </div>
              </div>
              <div className="col-span-full flex items-center gap-2 sm:col-span-1">
                <StatusBadge status={w.status as "active" | "paused" | "failing"} />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => toast.success("Test event dispatched")}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Test
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass rounded-2xl p-5">
        <h3 className="font-semibold">Available events</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "message.sent",
            "message.received",
            "message.failed",
            "session.connected",
            "session.disconnected",
            "session.paused",
            "webhook.failed",
            "error.occurred",
            "device.linked",
          ].map((e) => (
            <div key={e} className="rounded-xl border border-border bg-card/40 p-3">
              <code className="font-mono text-xs">{e}</code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
