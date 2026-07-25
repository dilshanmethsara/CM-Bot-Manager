import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  tone?: "primary" | "accent" | "success" | "warning" | "destructive";
  hint?: string;
}

const tones: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-[oklch(0.78_0.17_155)]/15 text-[oklch(0.82_0.17_155)]",
  warning: "bg-[oklch(0.82_0.16_80)]/15 text-[oklch(0.85_0.16_80)]",
  destructive: "bg-destructive/15 text-destructive",
};

export function StatCard({ label, value, icon: Icon, delta, tone = "primary", hint }: StatCardProps) {
  const isUp = (delta ?? 0) >= 0;
  return (
    <Card className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[image:var(--gradient-primary)] opacity-0 blur-3xl transition-opacity group-hover:opacity-20" />
      <div className="flex items-start justify-between">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              isUp ? "bg-[oklch(0.78_0.17_155)]/15 text-[oklch(0.85_0.17_155)]" : "bg-destructive/15 text-destructive",
            )}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
