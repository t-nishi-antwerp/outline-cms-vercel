import { requireAuth, canAccessProperty } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { BackupList } from "@/components/properties/BackupList";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function BackupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id: propertyId } = await params;

  // アクセス権限チェック
  const hasAccess = await canAccessProperty(
    propertyId,
    session.user.id,
    session.user.role
  );

  if (!hasAccess) {
    redirect("/dashboard/properties");
  }

  // 物件とバックアップを取得
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    notFound();
  }

  const backups = await prisma.propertyBackup.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/properties/${propertyId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← 物件詳細に戻る
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            バックアップ履歴
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {property.name} - {property.slug}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <BackupList propertyId={propertyId} initialBackups={backups} />
        </div>
      </main>
    </div>
  );
}
