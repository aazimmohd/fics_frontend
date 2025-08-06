
"use client"
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, Settings, Crown, Shield, Sparkles, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/shared/notification-bell";

export function AppHeader() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (name: string | undefined) => {
    if (!name) return "FX";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base font-headline">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"></path><path d="M12 12v-2m0 4v2m-4-2h2m4 0h-2"></path></svg>
          <span className="text-xl font-bold">FiCX</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-violet-300/50 transition-all duration-300">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white font-semibold text-sm">
                    {getUserInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-72 p-0 overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl"
              sideOffset={8}
            >
              {/* Sleek Header Section */}
              <div className="relative p-5 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {getUserInitials(user?.full_name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{user?.full_name || 'User'}</h3>
                    <p className="text-sm text-slate-300 truncate">{user?.email}</p>
                    <div className="flex items-center mt-1.5 space-x-1.5">
                      <div className="flex items-center px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full text-xs border border-white/20">
                        <Crown className="w-3 h-3 mr-1 text-amber-300" />
                        <span className="text-slate-200">Premium</span>
                      </div>
                      <div className="flex items-center px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full text-xs border border-white/20">
                        <Shield className="w-3 h-3 mr-1 text-blue-300" />
                        <span className="text-slate-200">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items Section */}
              <div className="p-1.5">
                <Link href="/profile">
                  <DropdownMenuItem className="group relative px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 cursor-pointer border border-transparent hover:border-violet-100">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 group-hover:from-violet-200 group-hover:to-violet-300 transition-all duration-200 shadow-sm">
                        <UserCircle className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">Profile</p>
                        <p className="text-xs text-slate-500">Manage your account</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      </div>
                    </div>
                  </DropdownMenuItem>
                </Link>

                <Link href="/settings">
                  <DropdownMenuItem className="group relative px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border border-transparent hover:border-blue-100">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200 shadow-sm">
                        <Settings className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">Settings</p>
                        <p className="text-xs text-slate-500">Customize your experience</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                    </div>
                  </DropdownMenuItem>
                </Link>

                {/* Elegant Divider */}
                <div className="my-1.5 mx-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>

                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="group relative px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 cursor-pointer border border-transparent hover:border-red-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-red-100 to-red-200 group-hover:from-red-200 group-hover:to-red-300 transition-all duration-200 shadow-sm">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">Logout</p>
                      <p className="text-xs text-slate-500">Sign out of your account</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Sparkles className="w-3.5 h-3.5 text-red-500" />
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>

              {/* Sleek Footer */}
              <div className="px-3 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100/50 border-t border-slate-200/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Last active: Just now</span>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm"></div>
                    <span className="text-slate-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
