import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PropertyData } from "@/types/property";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            アクセスエラー
          </h1>
          <p className="text-gray-700">
            プレビュートークンが指定されていません。
          </p>
        </div>
      </div>
    );
  }

  // トークン検証
  const previewToken = await prisma.previewToken.findFirst({
    where: {
      token,
      property: {
        slug,
      },
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      property: {
        include: {
          propertyData: {
            where: { isPublished: false },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!previewToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            アクセスエラー
          </h1>
          <p className="text-gray-700">
            プレビュートークンが無効または期限切れです。
          </p>
        </div>
      </div>
    );
  }

  const property = previewToken.property;
  const draftData = property.propertyData[0];

  if (!draftData) {
    notFound();
  }

  const propertyData = draftData.data as PropertyData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* プレビューヘッダー */}
      <div className="bg-yellow-500 text-white py-3 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="font-semibold">プレビューモード</span>
            <span className="text-yellow-100 text-sm">
              (下書き版を表示中)
            </span>
          </div>
          <div className="text-sm text-yellow-100">
            {property.name} - {property.slug}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {property.name}
          </h1>

          {property.description && (
            <p className="text-gray-600 mb-8">{property.description}</p>
          )}

          {/* セクション表示 */}
          <div className="space-y-8">
            {propertyData.sections.map((section) => (
              <div
                key={section.id}
                className="border border-gray-200 rounded-lg p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {section.title}
                  {section.type === "fixed" && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      固定
                    </span>
                  )}
                </h2>

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-2"
                    >
                      <div className="font-medium text-gray-700">
                        {item.label}
                      </div>
                      <div className="md:col-span-2 text-gray-600">
                        {item.value || "(未入力)"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* メタ情報 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">バージョン:</span>{" "}
                {propertyData.version}
              </div>
              <div>
                <span className="font-medium">最終更新:</span>{" "}
                {new Date(propertyData.lastUpdated).toLocaleString("ja-JP")}
              </div>
            </div>
          </div>
        </div>

        {/* 警告メッセージ */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>注意:</strong>{" "}
            これはプレビュー版です。公開版とは異なる場合があります。
            <br />
            トークンの有効期限:{" "}
            {new Date(previewToken.expiresAt).toLocaleString("ja-JP")}
          </p>
        </div>
      </main>
    </div>
  );
}
