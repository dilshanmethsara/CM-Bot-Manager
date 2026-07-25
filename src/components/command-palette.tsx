import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Code2,
  BarChart3,
  Webhook,
  Settings,
  Plus,
  Play,
  Pause,
  BookOpen,
} from "lucide-react";

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const navigate = useNavigate();
  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/sessions")}><Smartphone className="mr-2 h-4 w-4" />Sessions</CommandItem>
          <CommandItem onSelect={() => go("/messaging")}><MessageSquare className="mr-2 h-4 w-4" />Messaging</CommandItem>
          <CommandItem onSelect={() => go("/api-manager")}><Code2 className="mr-2 h-4 w-4" />API Manager</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}><BarChart3 className="mr-2 h-4 w-4" />Usage Analytics</CommandItem>
          <CommandItem onSelect={() => go("/webhooks")}><Webhook className="mr-2 h-4 w-4" />Webhooks</CommandItem>
          <CommandItem onSelect={() => go("/docs")}><BookOpen className="mr-2 h-4 w-4" />API Docs</CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem><Plus className="mr-2 h-4 w-4" />Create new session</CommandItem>
          <CommandItem><Play className="mr-2 h-4 w-4" />Resume all paused sessions</CommandItem>
          <CommandItem><Pause className="mr-2 h-4 w-4" />Pause all sessions</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
