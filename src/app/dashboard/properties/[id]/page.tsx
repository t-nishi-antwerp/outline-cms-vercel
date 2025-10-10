import { requireAuth, canAccessProperty } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { PropertyEditor } from "@/components/properties/editor/PropertyEditor";
import { PropertyActions } from "@/components/properties/PropertyActions";
import { ApiInfo } from "@/components/properties/ApiInfo";
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
        take: 1,
      },
    },
  });

  if (!property) {
    notFound();
  }

  const currentData = property.propertyData[0];

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: 編集エリア */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">概要データ編集</h3>

              {currentData ? (
                <PropertyEditor
                  propertyId={propertyId}
                  initialData={currentData.data as unknown as PropertyData}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>データがありません</p>
                </div>
              )}
            </div>
          </div>

          {/* 右側: サイドバー */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">物件情報</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">物件名</dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    {property.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">識別子</dt>
                  <dd className="font-mono text-xs text-gray-900 mt-1">
                    {property.slug}
                  </dd>
                </div>
                {property.siteUrl && (
                  <div>
                    <dt className="text-gray-500">本番サイト</dt>
                    <dd className="mt-1">
                      <a
                        href={property.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs break-all"
                      >
                        {property.siteUrl}
                      </a>
                    </dd>
                  </div>
                )}
                {property.description && (
                  <div>
                    <dt className="text-gray-500">説明</dt>
                    <dd className="text-gray-700 mt-1">
                      {property.description}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">最終更新</dt>
                  <dd className="text-gray-700 mt-1">
                    {new Date(property.updatedAt).toLocaleString("ja-JP")}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">アクション</h4>
                <PropertyActions propertyId={propertyId} />
              </div>

              <ApiInfo slug={property.slug} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
