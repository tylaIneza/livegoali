export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || !["ADMIN", "SUPER_ADMIN", "EDITOR"].includes(session.user.role)) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F14]">
      <AdminSidebar role={session.user.role} user={session.user} />
      <main className="flex-1 overflow-auto ml-0 lg:ml-64">
        <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
