import { Link, useRouterState } from "@tanstack/react-router";
import { useSessions } from "@/hooks/use-sessions";
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Webhook,
  BarChart3,
  History,
  Settings,
  Terminal,
  HelpCircle,
  Code2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Sessions", url: "/sessions", icon: Smartphone },
  { title: "Messaging", url: "/messaging", icon: MessageSquare },
  { title: "API Manager", url: "/api-manager", icon: Code2 },
  { title: "Usage Analytics", url: "/analytics", icon: BarChart3 },
  { title: "History", url: "/history", icon: History },
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
];

const system = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "System Logs", url: "/logs", icon: Terminal },
  { title: "Help", url: "/help", icon: HelpCircle },
  { title: "API Docs", url: "/docs", icon: BookOpen },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const { data: sessions = [] } = useSessions();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight">Cloud Mint</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              CM Bot Manager
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.title === "Sessions" && (
                        <Badge className="ml-auto h-5 rounded-md border-0 bg-primary/15 px-1.5 text-[10px] font-semibold text-primary group-data-[collapsible=icon]:hidden">
                          {sessions.length}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {system.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="glass rounded-xl p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium">All systems operational</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">v2.4.1 · 99.98% uptime</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
