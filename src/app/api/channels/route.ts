import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

function extractStreamUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("<")) return trimmed;
  const m = trimmed.match(/src=["']([^"']+)["']/i);
  return m?.[1] ?? trimmed;
}

async function requireAdmin() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, category, logo, description, streamUrl, streamType, quality, isFeatured, order } = await req.json();
  if (!name || !streamUrl) {
    return NextResponse.json({ error: "name and streamUrl are required" }, { status: 400 });
  }

  const base = generateSlug(name);
  const slug = `${base}-${Date.now()}`;

  const channel = await prisma.channel.create({
    data: {
      name,
      slug,
      category: category || "SPORTS",
      logo: logo || null,
      description: description || null,
      isFeatured: !!isFeatured,
      order: order ?? 0,
      sources: {
        create: [{
          url: extractStreamUrl(streamUrl),
          type: streamType || "HLS",
          quality: quality || "HD",
          isPrimary: true,
          priority: 1,
        }],
      },
    },
    include: { sources: true },
  });

  revalidatePath("/live-tv");
  return NextResponse.json(channel, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, category, logo, description, streamUrl, streamType, quality, isActive, isFeatured, order } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let channel = await prisma.channel.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(category && { category }),
      ...(logo !== undefined && { logo }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(order !== undefined && { order }),
    },
    include: { sources: { orderBy: { priority: "asc" } } },
  });

  if (streamUrl !== undefined) {
    const url = extractStreamUrl(streamUrl);
    const primary = channel.sources.find((s) => s.isPrimary) ?? channel.sources[0];
    if (primary) {
      await prisma.channelSource.update({
        where: { id: primary.id },
        data: { url, type: streamType || primary.type, quality: quality || primary.quality },
      });
    } else {
      await prisma.channelSource.create({
        data: { channelId: id, url, type: streamType || "HLS", quality: quality || "HD", isPrimary: true, priority: 1 },
      });
    }
    channel = await prisma.channel.findUniqueOrThrow({
      where: { id },
      include: { sources: { orderBy: { priority: "asc" } } },
    });
  }

  revalidatePath("/live-tv");
  revalidatePath(`/live-tv/${channel.slug}`);
  return NextResponse.json(channel);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  const channel = await prisma.channel.findUnique({ where: { id }, select: { slug: true } });
  await prisma.channel.delete({ where: { id } });

  revalidatePath("/live-tv");
  if (channel?.slug) revalidatePath(`/live-tv/${channel.slug}`);
  return NextResponse.json({ success: true });
}
