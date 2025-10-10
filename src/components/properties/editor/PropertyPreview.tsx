"use client";

import { PropertyData } from "@/types/property";

interface PropertyPreviewProps {
  data: PropertyData;
}

export function PropertyPreview({ data }: PropertyPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8 pb-4 border-b-2 border-gray-200">
        <div className="text-sm text-gray-500 mb-2">
          最終更新: {new Date(data.lastUpdated).toLocaleString("ja-JP")}
        </div>
      </div>

      {/* セクション一覧 */}
      <div className="space-y-8">
        {data.sections.map((section) => (
          <section key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* セクションタイトル */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h2>
            </div>

            {/* アイテム一覧 */}
            {section.items.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 grid grid-cols-[200px_1fr] gap-6"
                  >
                    <dt className="text-sm font-medium text-gray-700">
                      {item.label}
                    </dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                      {item.value || <span className="text-gray-400 italic">未入力</span>}
                    </dd>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                項目がありません
              </div>
            )}
          </section>
        ))}
      </div>

      {data.sections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>セクションがありません</p>
        </div>
      )}
    </div>
  );
}
