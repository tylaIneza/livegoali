export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditArticleForm } from "@/components/admin/EditArticleForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await prisma.news.findUnique({ where: { id } });
  if (!article) notFound();

  return <EditArticleForm article={article} />;
}
