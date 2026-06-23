"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Trophy, Radio, Users, Newspaper,
  TrendingUp, Megaphone, Settings, ChevronLeft, Menu,
  Shield, BarChart3, Star, Bell, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types";

interface Props {
  role: UserRole;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/matches", label: "Matches", icon: Trophy },
  { href: "/admin/leagues", label: "Leagues", icon: Star },
  { href: "/admin/streams", label: "Streams", icon: Radio },
  { href: "/admin/predictions", label: "Predictions", icon: TrendingUp },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/admin/ads", label: "Advertisements", icon: Megaphone, adminOnly: true },
  { href: "/admin/sync", label: "Data Sync", icon: RefreshCw, adminOnly: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function AdminSidebar({ role, user }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg glass border border-white/10"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 flex flex-col bg-[#0D1117] border-r border-white/8 transition-all duration-300",
          collapsed ? "w-0 overflow-hidden lg:w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/8 shrink-0">
          <img src="/livegoali.png" alt="LiveGoali" className="w-9 h-9 object-contain shrink-0" />
          {!collapsed && (
            <div>
              <span className="font-black text-lg">
                <span className="text-gradient">Live</span>
                <span className="text-white">Goali</span>
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-[#00FF84]" />
                <span className="text-[10px] text-[#00FF84] font-bold">ADMIN</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-auto p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group",
                    isActive
                      ? "bg-[#00FF84]/10 text-[#00FF84] border border-[#00FF84]/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-[#00FF84]")} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        {/* User */}
        <div className={cn("p-3 border-t border-white/8", collapsed && "hidden")}>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback>{user.name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1">
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                  {role}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
