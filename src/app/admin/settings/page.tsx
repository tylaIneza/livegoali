export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function AdminSettingsPage() {
  const settings = await prisma.settings.findMany({ orderBy: { key: "asc" } });

  const defaults = [
    { key: "site_name", label: "Site Name", value: "LiveGoali" },
    { key: "site_tagline", label: "Tagline", value: "Watch Football Live. Anytime. Anywhere." },
    { key: "live_chat_slow_mode", label: "Live Chat Slow Mode (seconds)", value: "3" },
    { key: "max_predictions_per_user", label: "Max Predictions per Match", value: "1" },
    { key: "maintenance_mode", label: "Maintenance Mode", value: "false" },
  ];

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white">Platform Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure site-wide settings</p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#121821] p-6 space-y-5">
        {defaults.map((s) => (
          <div key={s.key}>
            <label className="text-sm text-gray-400 mb-1.5 block">{s.label}</label>
            <Input
              defaultValue={settingsMap[s.key] ?? s.value}
              name={s.key}
            />
          </div>
        ))}

        <div className="pt-2">
          <Button>
            <Settings className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-[#00FF84]/20 bg-[#00FF84]/5 p-4">
        <p className="text-sm text-[#00FF84] font-medium mb-1">Admin Credentials</p>
        <p className="text-xs text-gray-400">Email: <span className="text-white">admin@livegoali.com</span></p>
        <p className="text-xs text-gray-400 mt-0.5">Password: <span className="text-white">Admin@123!</span></p>
      </div>
    </div>
  );
}
