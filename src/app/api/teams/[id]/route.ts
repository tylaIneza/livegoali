import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { logo, name, shortName } = await req.json();

  const team = await prisma.team.update({
    where: { id },
    data: {
      ...(logo !== undefined && { logo: logo || null }),
      ...(name && { name }),
      ...(shortName !== undefined && { shortName: shortName || null }),
    },
    select: { id: true, name: true, shortName: true, logo: true },
  });

  return NextResponse.json(team);
}
