
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Network,
  LayoutList,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
  ListChecks, // Added icon
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/intake-forms", label: "Intake Forms", icon: FileText },
  { href: "/workflows", label: "Workflows", icon: Network },
  { href: "/trigger-runs", label: "Trigger Runs", icon: ListChecks }, // New navigation item
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/templates", label: "Templates", icon: LayoutList },
  { href: "/ai-generator", label: "AI Generator", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="border-b">
         <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base font-headline py-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"></path><path d="M12 12v-2m0 4v2m-4-2h2m4 0h-2"></path></svg>
          <span className="text-xl font-bold">FiCX</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  variant="default"
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                  tooltip={{ children: item.label, side: "right", align: "center" }}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">
                    {item.label}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton
              variant="default"
              className="w-full justify-start hover:bg-accent/50"
              tooltip={{ children: "Help & Support", side: "right", align: "center" }}
            >
              <HelpCircle className="mr-3 h-5 w-5" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="default"
              className="w-full justify-start hover:bg-accent/50"
              tooltip={{ children: "Logout", side: "right", align: "center" }}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
