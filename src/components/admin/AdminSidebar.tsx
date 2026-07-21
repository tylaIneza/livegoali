"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Trophy, Radio, Users, Newspaper,
  Megaphone, Settings, ChevronLeft, Menu,
  Shield, BarChart3, Star, Bell, Dumbbell,
  LogOut, ExternalLink, Globe, MonitorPlay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface Props {
  role: UserRole;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

const navItems = [
  { href: "/admin",               label: "Dashboard",      icon: LayoutDashboard, color: "#00FF84", group: "main" },
  { href: "/admin/sports",        label: "Sports",         icon: Dumbbell,        color: "#F97316", group: "content" },
  { href: "/admin/matches",       label: "Matches",        icon: Trophy,          color: "#EF4444", group: "content" },
  { href: "/admin/leagues",       label: "Leagues",        icon: Star,            color: "#EAB308", group: "content" },
  { href: "/admin/streams",       label: "Streams",        icon: Radio,           color: "#EC4899", group: "content" },
  { href: "/admin/channels",      label: "Live TV",        icon: MonitorPlay,     color: "#22D3EE", group: "content" },
  { href: "/admin/news",          label: "News",           icon: Newspaper,       color: "#3B82F6", group: "content" },
  { href: "/admin/countries",     label: "Countries",      icon: Globe,           color: "#00FF84", group: "manage", adminOnly: true },
  { href: "/admin/users",         label: "Users",          icon: Users,           color: "#06B6D4", group: "manage", adminOnly: true },
  { href: "/admin/ads",           label: "Advertisements", icon: Megaphone,       color: "#A855F7", group: "manage", adminOnly: true },
  { href: "/admin/analytics",     label: "Analytics",      icon: BarChart3,       color: "#00FF84", group: "system" },
  { href: "/admin/notifications", label: "Notifications",  icon: Bell,            color: "#F59E0B", group: "system" },
  { href: "/admin/settings",      label: "Settings",       icon: Settings,        color: "#94A3B8", group: "system", adminOnly: true },
];

const groups = [
  { key: "main",    label: null },
  { key: "content", label: "Content" },
  { key: "manage",  label: "Manage" },
  { key: "system",  label: "System" },
];

export function AdminSidebar({ role, user }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const initials = (user.name?.charAt(0) || user.email?.charAt(0) || "A").toUpperCase();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-[#0D1117] border border-white/10 shadow-lg"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 flex flex-col border-r border-white/8 transition-all duration-300 overflow-hidden",
          collapsed ? "w-0 lg:w-[70px]" : "w-[240px]"
        )}
        style={{ background: "linear-gradient(180deg, #0A0E14 0%, #0D1117 60%, #0A0E14 100%)" }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 80% 10%, rgba(0,255,132,0.04) 0%, transparent 50%), radial-gradient(circle at 20% 90%, rgba(59,130,246,0.04) 0%, transparent 50%)"
        }} />

        {/* ── Logo ── */}
        <div className="relative flex items-center gap-3 px-4 py-5 border-b border-white/6 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00FF84]/20 to-[#00CC6A]/10 border border-[#00FF84]/25 flex items-center justify-center shrink-0">
            <img src="/livegoali.png" alt="LiveGoali" className="w-6 h-6 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-black text-base leading-none">
                <span style={{ background: "linear-gradient(90deg,#00FF84,#00CC6A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Live</span>
                <span className="text-white">Goali</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-3 h-3 text-[#00FF84]" />
                <span className="text-[10px] font-black tracking-widest" style={{ color: "#00FF84" }}>
                  {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex shrink-0 w-7 h-7 items-center justify-center rounded-lg hover:bg-white/6 text-white/40 hover:text-white transition-all"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="relative flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 space-y-0.5">
          {groups.map(({ key, label }) => {
            const items = navItems.filter((n) => n.group === key && (!n.adminOnly || isAdmin));
            if (items.length === 0) return null;
            return (
              <div key={key} className={key === "main" ? "" : "pt-3"}>
                {/* Group label */}
                {label && !collapsed && (
                  <div className="px-3 mb-1.5">
                    <span className="text-[9px] font-black text-white/25 tracking-[0.12em] uppercase">{label}</span>
                  </div>
                )}
                {label && !collapsed && (
                  <div className="mx-3 mb-2 h-px bg-white/5" />
                )}

                {items.map((item) => {
                  const isActive = item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group mb-0.5",
                        isActive ? "text-white" : "text-white/50 hover:text-white/90"
                      )}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${item.color}18 0%, ${item.color}08 100%)`,
                        border: `1px solid ${item.color}25`,
                      } : {}}
                    >
                      {/* Active left bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: item.color }} />
                      )}

                      {/* Icon container */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150",
                          isActive ? "shadow-lg" : "group-hover:bg-white/5"
                        )}
                        style={isActive ? { background: `${item.color}20` } : {}}
                      >
                        <item.icon
                          className="w-4 h-4 shrink-0 transition-all"
                          style={{ color: isActive ? item.color : undefined }}
                        />
                      </div>

                      {/* Label */}
                      {!collapsed && (
                        <span className={cn(
                          "text-sm font-semibold truncate transition-all",
                          isActive ? "font-bold" : ""
                        )}
                          style={isActive ? { color: item.color } : {}}
                        >
                          {item.label}
                        </span>
                      )}

                      {/* Collapsed tooltip */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a2235] border border-white/10 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1a2235]" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* ── User profile ── */}
        {!collapsed && (
          <div className="relative px-3 py-3 border-t border-white/6 shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Avatar */}
              {user.image ? (
                <img src={user.image} alt={user.name || ""} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-[#00FF84]/30" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                  style={{ background: "linear-gradient(135deg,#00FF84,#00CC6A)", color: "#0A0E14" }}>
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">{user.name || "Admin"}</p>
                <p className="text-[10px] text-white/40 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href="/" target="_blank" title="View Site"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/80 hover:bg-white/8 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Role badge */}
            <div className="mt-2 mx-1 flex items-center justify-between px-2 py-1.5 rounded-lg"
              style={{ background: isSuperAdmin ? "rgba(234,179,8,0.08)" : "rgba(0,255,132,0.06)", border: `1px solid ${isSuperAdmin ? "rgba(234,179,8,0.15)" : "rgba(0,255,132,0.12)"}` }}>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3" style={{ color: isSuperAdmin ? "#EAB308" : "#00FF84" }} />
                <span className="text-[10px] font-black tracking-wide" style={{ color: isSuperAdmin ? "#EAB308" : "#00FF84" }}>
                  {isSuperAdmin ? "SUPER ADMIN" : role}
                </span>
              </div>
              <Link href="/api/auth/signout" className="flex items-center gap-1 text-[10px] text-white/30 hover:text-red-400 transition-colors font-semibold">
                <LogOut className="w-3 h-3" /> Sign out
              </Link>
            </div>
          </div>
        )}

        {/* Collapsed user dot */}
        {collapsed && (
          <div className="px-2 py-3 border-t border-white/6 shrink-0 flex justify-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
              style={{ background: "linear-gradient(135deg,#00FF84,#00CC6A)", color: "#0A0E14" }}>
              {initials}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setCollapsed(true)} />
      )}
    </>
  );
}
