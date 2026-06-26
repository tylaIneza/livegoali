"use client";

import { useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type User = { id: string; name: string | null; email: string | null };

interface Props {
  users: User[];
}

const TYPES = ["INFO", "SUCCESS", "WARNING", "MATCH", "NEWS", "SYSTEM"] as const;

export function SendNotificationModal({ users }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [form, setForm] = useState({
    target: "all",
    title: "",
    message: "",
    type: "INFO",
    link: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
  }

  async function send() {
    if (!form.title.trim() || !form.message.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(`Sent to ${data.sent} user${data.sent !== 1 ? "s" : ""}`);
      setForm({ target: "all", title: "", message: "", type: "INFO", link: "" });
    } catch (e: unknown) {
      setResult(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => { setOpen(true); setResult(null); }}>
        <Send className="w-4 h-4" /> Send Notification
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#121821] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Send Notification</h2>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Target */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Recipient</label>
                <select
                  value={form.target}
                  onChange={(e) => set("target", e.target.value)}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50"
                >
                  <option value="all">All Users</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF84]/50"
                >
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Notification title"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00FF84]/50"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Write your message…"
                  rows={3}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00FF84]/50 resize-none"
                />
              </div>

              {/* Link (optional) */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Link <span className="text-white/30">(optional)</span></label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => set("link", e.target.value)}
                  placeholder="/matches/xyz"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00FF84]/50"
                />
              </div>
            </div>

            {result && (
              <p className={`text-sm px-3 py-2 rounded-lg ${result.startsWith("Error") ? "bg-red-500/10 text-red-400" : "bg-[#00FF84]/10 text-[#00FF84]"}`}>
                {result}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#00FF84] text-black hover:bg-[#00FF84]/90"
                disabled={loading || !form.title.trim() || !form.message.trim()}
                onClick={send}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
