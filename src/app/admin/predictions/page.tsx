export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { TrendingUp, Brain, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMatchDate } from "@/lib/utils";

export default async function AdminPredictionsPage() {
  const predictions = await prisma.prediction.findMany({
    include: {
      match: {
        include: {
          homeTeam: { select: { name: true, shortName: true } },
          awayTeam: { select: { name: true, shortName: true } },
          league: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Predictions Management</h1>
        <p className="text-gray-500 text-sm mt-1">{predictions.length} predictions generated</p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Match</th>
                <th className="px-4 py-3 text-left">Home %</th>
                <th className="px-4 py-3 text-left">Draw %</th>
                <th className="px-4 py-3 text-left">Away %</th>
                <th className="px-4 py-3 text-left">xG</th>
                <th className="px-4 py-3 text-left">Confidence</th>
                <th className="px-4 py-3 text-left">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {predictions.map((pred) => (
                <tr key={pred.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white text-xs">
                      {pred.match.homeTeam.shortName || pred.match.homeTeam.name} vs {pred.match.awayTeam.shortName || pred.match.awayTeam.name}
                    </p>
                    <p className="text-gray-600 text-[10px]">{pred.match.league.name} · {formatMatchDate(pred.match.scheduledAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-[#00FF84]">{pred.homeWinProb.toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-yellow-400">{pred.drawProb.toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-blue-400">{pred.awayWinProb.toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">
                      {pred.expectedHomeGoals?.toFixed(1) ?? "—"} - {pred.expectedAwayGoals?.toFixed(1) ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-[#00FF84] rounded-full" style={{ width: `${pred.confidence}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{pred.confidence.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {pred.isOverridden ? (
                      <Badge variant="hot" className="text-[10px]">Manual</Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Brain className="w-3 h-3" /> AI
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {predictions.length === 0 && (
          <div className="text-center py-16">
            <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No predictions yet. They are auto-generated when creating matches.</p>
          </div>
        )}
      </div>
    </div>
  );
}
