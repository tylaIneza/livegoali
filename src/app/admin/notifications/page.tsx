export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/utils";

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{notifications.length} sent</p>
        </div>
        <Button>
          <Send className="w-4 h-4" /> Send Notification
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#121821] py-16 text-center">
          <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No notifications sent yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          <div className="divide-y divide-white/5">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-4 px-4 py-3 hover:bg-white/2 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.isRead ? "bg-gray-600" : "bg-[#00FF84]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <span className="text-xs text-gray-600 shrink-0">{formatTimeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-600 mt-1">→ {n.user.name || n.user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
