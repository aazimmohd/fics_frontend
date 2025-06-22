import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { MainNavigation } from './main-navigation';
import { AppHeader } from './app-header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true} >
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <MainNavigation />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-6 md:p-8 lg:p-10 bg-background overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
