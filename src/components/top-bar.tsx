import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search, Sun, Moon, Command, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommandPalette } from "./command-palette";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/sessions": "Sessions",
  "/messaging": "Messaging",
  "/api-manager": "API Manager",
  "/analytics": "Usage Analytics",
  "/history": "History",
  "/webhooks": "Webhooks",
  "/settings": "Settings",
  "/logs": "System Logs",
  "/help": "Help",
};

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const title = titles[pathname] ?? "Cloud Mint";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/60 px-3 backdrop-blur-xl sm:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Link to="/" className="hover:text-foreground">Cloud Mint</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{title}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 w-72 items-center gap-2 rounded-xl border border-border bg-card/40 px-3 text-sm text-muted-foreground transition hover:bg-card/70 md:flex"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search or run command…</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] font-medium">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setPaletteOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>

          <Button size="icon" variant="ghost" onClick={() => setDark((d) => !d)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button size="icon" variant="ghost" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-2.5 transition hover:border-border hover:bg-card/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=admin" />
                  <AvatarFallback>CM</AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold leading-none">Ada Chen</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Workspace admin</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </>
  );
}
