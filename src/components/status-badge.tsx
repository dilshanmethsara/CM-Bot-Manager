import { cn } from "@/lib/utils";

type Status = "active" | "disconnected" | "paused" | "connecting" | "failing" | "delivered" | "read" | "sent" | "failed";

const styles: Record<Status, string> = {
  active: "bg-[oklch(0.78_0.17_155)]/15 text-[oklch(0.85_0.17_155)] border-[oklch(0.78_0.17_155)]/25",
  disconnected: "bg-destructive/15 text-destructive border-destructive/25",
  paused: "bg-[oklch(0.82_0.16_80)]/15 text-[oklch(0.86_0.16_80)] border-[oklch(0.82_0.16_80)]/25",
  connecting: "bg-accent/15 text-accent border-accent/25",
  failing: "bg-destructive/15 text-destructive border-destructive/25",
  delivered: "bg-accent/15 text-accent border-accent/25",
  read: "bg-[oklch(0.78_0.17_155)]/15 text-[oklch(0.85_0.17_155)] border-[oklch(0.78_0.17_155)]/25",
  sent: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/15 text-destructive border-destructive/25",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
