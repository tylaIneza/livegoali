export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/NotificationList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your LiveGoali notifications.",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  }).catch(() => []);

  return <NotificationList initial={notifications} />;
}
