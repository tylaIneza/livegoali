export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Users, Shield, Crown, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTimeAgo } from "@/lib/utils";

export default async function AdminUsersPage() {
  const [users, totalUsers, bannedCount, vipCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, name: true, email: true, image: true,
        role: true, isVIP: true, isBanned: true, createdAt: true,
        _count: { select: { predictions: true, comments: true } },
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.user.count({ where: { isVIP: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">{totalUsers} registered users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users, color: "text-white", bg: "bg-blue-500/10" },
          { label: "VIP Members", value: vipCount, icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "Admins", value: users.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length, icon: Shield, color: "text-[#00FF84]", bg: "bg-[#00FF84]/10" },
          { label: "Banned", value: bannedCount, icon: Ban, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-[#121821] p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Activity</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="text-xs">{user.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white text-sm">{user.name || "—"}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                      {user.isVIP && <Badge variant="premium" className="text-[10px] px-1.5 py-0">VIP</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={user.role === "SUPER_ADMIN" || user.role === "ADMIN" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-400">
                      <span>{user._count.predictions} predictions</span>
                      <span className="mx-1 text-gray-700">·</span>
                      <span>{user._count.comments} comments</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{formatTimeAgo(user.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                    ) : (
                      <span className="text-xs text-[#00FF84] font-medium">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
