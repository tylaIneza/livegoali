"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isVIP: boolean;
  role: string;
  createdAt: string | Date;
}

export function ProfileForm({ user }: { user: ProfileUser }) {
  const { update } = useSession();
  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = name.trim() !== (user.name ?? "") || image.trim() !== (user.image ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: image.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update profile");
      }
      await update({ name: name.trim(), image: image.trim() || null });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16 ring-2 ring-primary/30">
            <AvatarImage src={image || ""} />
            <AvatarFallback className="text-xl">{(name || user.email).charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-bold">{user.name || "Unnamed"}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.isVIP && <Badge variant="premium" className="text-[10px] px-1.5 py-0">VIP</Badge>}
              <span className="text-xs text-white/50">
                Member since {format(new Date(user.createdAt), "MMMM yyyy")}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/75 mb-1.5 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
          </div>
          <div>
            <label className="text-sm text-white/75 mb-1.5 block">Avatar URL</label>
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div>
            <label className="text-sm text-white/75 mb-1.5 block">Email</label>
            <Input value={user.email} disabled className="opacity-60" />
            <p className="text-[11px] text-white/40 mt-1">Email can&apos;t be changed.</p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={!dirty || saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
