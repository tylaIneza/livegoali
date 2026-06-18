export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Megaphone, Plus, Eye, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminAdsPage() {
  const ads = await prisma.advertisement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalViews = ads.reduce((sum, a) => sum + a.views, 0);
  const totalClicks = ads.reduce((sum, a) => sum + a.clicks, 0);
  const totalRevenue = ads.reduce((sum, a) => sum + a.revenue, 0);
  const avgCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Advertisement Management</h1>
          <p className="text-gray-500 text-sm mt-1">{ads.length} advertisements</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" /> New Ad
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-400" },
          { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer, color: "text-[#00FF84]" },
          { label: "Avg CTR", value: `${avgCTR}%`, icon: Megaphone, color: "text-yellow-400" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: Megaphone, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-[#121821] p-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ad placement info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {["HEADER","SIDEBAR","FOOTER","IN_PLAYER","VIDEO","POPUP","SPONSORED"].map((placement) => {
          const count = ads.filter((a) => a.placement === placement).length;
          return (
            <div key={placement} className="rounded-xl border border-white/8 bg-[#121821] p-3 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">{placement}</span>
              <span className="text-sm font-bold text-white">{count}</span>
            </div>
          );
        })}
      </div>

      {ads.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#121821] py-16 text-center">
          <Megaphone className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No advertisements yet.</p>
          <p className="text-gray-600 text-xs mt-1">Create ads to monetize your platform.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Ad Title</th>
                  <th className="px-4 py-3 text-left">Placement</th>
                  <th className="px-4 py-3 text-left">Views</th>
                  <th className="px-4 py-3 text-left">Clicks</th>
                  <th className="px-4 py-3 text-left">CTR</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{ad.title}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{ad.placement}</Badge></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{ad.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{ad.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{ad.views > 0 ? ((ad.clicks/ad.views)*100).toFixed(2) : "0.00"}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={ad.isActive ? "default" : "secondary"} className="text-[10px]">
                        {ad.isActive ? "Active" : "Paused"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
