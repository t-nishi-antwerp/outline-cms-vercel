"use client";

import { useState } from "react";
import { PropertyEditor } from "./editor/PropertyEditor";
import { PropertyActions } from "./PropertyActions";
import { ApiInfo } from "./ApiInfo";
import { PropertyData } from "@/types/property";

interface PropertyDetailLayoutProps {
  property: {
    id: string;
    name: string;
    slug: string;
    siteUrl: string | null;
    description: string | null;
    updatedAt: Date;
  };
  currentData: PropertyData;
  hasPublishedData: boolean;
}

export function PropertyDetailLayout({
  property,
  currentData,
  hasPublishedData,
}: PropertyDetailLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative">
      {/* サイドバートグルボタン（固定位置） */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-20 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        物件情報
      </button>

      {/* メインコンテンツエリア */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'mr-96' : ''}`}>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">概要データ編集</h3>

          {currentData ? (
            <PropertyEditor
              propertyId={property.id}
              initialData={currentData}
              hasPublishedData={hasPublishedData}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>データがありません</p>
            </div>
          )}
        </div>
      </div>

      {/* サイドバー（スライドイン） */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-40 overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* サイドバーヘッダー */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">物件情報</h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* サイドバーコンテンツ */}
        <div className="p-6">
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
            <PropertyActions propertyId={property.id} />
          </div>

          <ApiInfo slug={property.slug} />
        </div>
      </div>

      {/* オーバーレイ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
