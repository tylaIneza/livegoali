"use client";

import { useState, useEffect } from "react";
import { Users, Shield, Crown, Ban, Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatTimeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

type UserRole = "USER" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  isVIP: boolean;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
  _count: { predictions: number; comments: number };
}

const ROLES: UserRole[] = ["USER", "EDITOR", "ADMIN", "SUPER_ADMIN"];

const roleBadgeClass: Record<UserRole, string> = {
  USER: "bg-white/8 text-white/75",
  EDITOR: "bg-blue-500/15 text-blue-400",
  ADMIN: "bg-[#00FF84]/15 text-[#00FF84]",
  SUPER_ADMIN: "bg-purple-500/15 text-purple-400",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/75 font-medium uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-[#0B0F14] border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF84]/50 transition-colors ${className}`}
    />
  );
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isVIP: boolean;
  isBanned: boolean;
  banReason: string;
}

const emptyForm = (): FormState => ({
  name: "", email: "", password: "", role: "USER",
  isVIP: false, isBanned: false, banReason: "",
});

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setForm(emptyForm());
    setShowPwd(false);
    setAddOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setForm({
      name: user.name ?? "",
      email: user.email,
      password: "",
      role: user.role,
      isVIP: user.isVIP,
      isBanned: user.isBanned,
      banReason: user.banReason ?? "",
    });
    setShowPwd(false);
    setEditTarget(user);
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Name, email and password are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create user"); return; }
      setUsers((prev) => [{ ...data, createdAt: data.createdAt }, ...prev]);
      setAddOpen(false);
      toast.success("User created");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const body: Partial<FormState> = {
        name: form.name,
        email: form.email,
        role: form.role,
        isVIP: form.isVIP,
        isBanned: form.isBanned,
        banReason: form.banReason,
      };
      if (form.password.trim()) body.password = form.password;

      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update user"); return; }
      setUsers((prev) => prev.map((u) => u.id === editTarget.id ? { ...u, ...data } : u));
      setEditTarget(null);
      toast.success("User updated");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to delete user"); return; }
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("User deleted");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const stats = [
    { label: "Total", value: users.length, icon: Users, color: "text-white", bg: "bg-blue-500/10" },
    { label: "VIP", value: users.filter((u) => u.isVIP).length, icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Admins", value: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length, icon: Shield, color: "text-[#00FF84]", bg: "bg-[#00FF84]/10" },
    { label: "Banned", value: users.filter((u) => u.isBanned).length, icon: Ban, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  // Shared form body used in both Add and Edit modals
  const FormBody = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Email">
          <Input type="email" placeholder="user@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>
      </div>

      <Field label={editTarget ? "New Password (leave blank to keep)" : "Password"}>
        <div className="relative">
          <Input
            type={showPwd ? "text" : "password"}
            placeholder={editTarget ? "Leave blank to keep current" : "Min 8 characters"}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      <Field label="Role">
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: r }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                form.role === r
                  ? "border-[#00FF84] bg-[#00FF84]/15 text-[#00FF84]"
                  : "border-white/10 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex gap-4">
        <Field label="VIP">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isVIP: !f.isVIP }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.isVIP ? "bg-yellow-500" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.isVIP ? "translate-x-5" : ""}`} />
          </button>
        </Field>
        <Field label="Banned">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isBanned: !f.isBanned }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.isBanned ? "bg-red-500" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.isBanned ? "translate-x-5" : ""}`} />
          </button>
        </Field>
      </div>

      {form.isBanned && (
        <Field label="Ban Reason">
          <Input placeholder="Reason for ban (optional)" value={form.banReason} onChange={(e) => setForm((f) => ({ ...f, banReason: e.target.value }))} />
        </Field>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">User Management</h1>
            <p className="text-white/70 text-sm mt-1">{users.length} registered users</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-[#121821] p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-white/70">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, email or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-[#121821] border border-white/8 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00FF84]/50 transition-colors"
        />

        {/* Table */}
        <div className="rounded-2xl border border-white/8 bg-[#121821] overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-[#00FF84]/30 border-t-[#00FF84] animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-white/70 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Activity</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Joined</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={user.image ?? ""} />
                            <AvatarFallback className="text-xs">{user.name?.charAt(0) ?? "?"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-white text-sm truncate max-w-[140px]">{user.name ?? "—"}</p>
                            <p className="text-white/70 text-xs truncate max-w-[140px]">{user.email}</p>
                          </div>
                          {user.isVIP && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full shrink-0">VIP</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeClass[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-white/75">{user._count.predictions} predictions · {user._count.comments} comments</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-white/70">{formatTimeAgo(new Date(user.createdAt))}</span>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg hover:bg-white/8 text-white/75 hover:text-white transition-colors"
                            title="Edit user"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/75 hover:text-red-400 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-white/60 text-sm">
                        {search ? "No users match your search" : "No users found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          {FormBody}
          <DialogFooter className="mt-2">
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-white/75 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] disabled:opacity-50 transition-colors"
            >
              {saving ? "Creating…" : "Create User"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {FormBody}
          <DialogFooter className="mt-2">
            <button onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white/75 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#00FF84] text-[#0B0F14] font-bold text-sm hover:bg-[#00C864] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" /> Delete User
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-gray-300 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-bold text-white">{deleteTarget?.name ?? deleteTarget?.email}</span>?
            </p>
            <p className="text-white/70 text-xs mt-1">This will permanently delete the account and all associated data.</p>
          </div>
          <DialogFooter>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white/75 text-sm hover:text-white hover:border-white/20 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
