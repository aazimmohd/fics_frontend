
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
  Users,
  FileSpreadsheet, // Added for submissions
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permissions: [] },
  { href: "/intake-forms", label: "Intake Forms", icon: FileText, permissions: ["intake_forms:read"] },
  { href: "/submissions", label: "Submissions", icon: FileSpreadsheet, permissions: ["form_submissions:read"] },
  { href: "/workflows", label: "Workflows", icon: Network, permissions: ["workflows:read"] },
  { href: "/trigger-runs", label: "Trigger Runs", icon: ListChecks, permissions: ["trigger_runs:read"] },
  { href: "/tasks", label: "Tasks", icon: ListTodo, permissions: ["tasks:read"] },
  { href: "/templates", label: "Templates", icon: LayoutList, permissions: ["workflows:read"] },
  { href: "/ai-generator", label: "AI Generator", icon: Sparkles, permissions: [] },
  { href: "/settings", label: "Settings", icon: Settings, permissions: [] },
  { href: "/settings/users", label: "User Management", icon: Users, permissions: ["users:manage"] },
];

export function MainNavigation() {
  const pathname = usePathname();
  const { hasPermission, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

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
          {navItems.map((item) => {
            // Check if the user has all required permissions for this item
            const canView = item.permissions.every(permission => hasPermission(permission));
            if (!canView) {
              return null; // Don't render if user doesn't have permission
            }
            return (
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
            );
          })}
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
              className="w-full justify-start hover:bg-accent/50 cursor-pointer"
              tooltip={{ children: "Logout", side: "right", align: "center" }}
              onClick={handleLogout}
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
