export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/ProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your LiveGoali profile.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, isVIP: true, role: true, createdAt: true },
  });
  if (!user) redirect("/login?callbackUrl=/profile");

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-white mb-8">My Profile</h1>
      <ProfileForm user={user} />
    </div>
  );
}
