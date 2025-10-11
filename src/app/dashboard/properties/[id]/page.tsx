import { requireAuth, canAccessProperty } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { PropertyDetailLayout } from "@/components/properties/PropertyDetailLayout";
import { PropertyData } from "@/types/property";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function PropertyDetailPage({
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

  // 物件データを取得
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      propertyData: {
        orderBy: { createdAt: "desc" },
        take: 2, // 最新2件取得（下書きと公開版）
      },
    },
  });

  if (!property) {
    notFound();
  }

  const currentData = property.propertyData[0];

  // 公開データが存在するか確認
  const hasPublishedData = property.propertyData.some(
    (data) => data.isPublished === true
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/dashboard/properties"
                className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← 物件一覧に戻る
              </Link>
              <h2 className="text-2xl font-bold text-gray-900">
                {property.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                識別子: <span className="font-mono">{property.slug}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {session.user.role === "admin" && (
                <Link
                  href={`/dashboard/properties/${property.id}/edit`}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  物件設定
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <PropertyDetailLayout
          property={{
            id: property.id,
            name: property.name,
            slug: property.slug,
            siteUrl: property.siteUrl,
            description: property.description,
            updatedAt: property.updatedAt,
          }}
          currentData={currentData?.data as unknown as PropertyData}
          hasPublishedData={hasPublishedData}
        />
      </main>
    </div>
  );
}
