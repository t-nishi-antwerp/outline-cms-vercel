"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  updatedAt: Date;
}

interface PropertyListProps {
  properties: Property[];
  isAdmin: boolean;
}

type SortField = "name" | "updatedAt" | "slug";
type SortOrder = "asc" | "desc";

export function PropertyList({ properties, isAdmin }: PropertyListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // フィルタリングとソート
  const filteredAndSortedProperties = useMemo(() => {
    // 検索フィルター
    let filtered = properties.filter((property) => {
      const query = searchQuery.toLowerCase();
      return (
        property.name.toLowerCase().includes(query) ||
        property.slug.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query)
      );
    });

    // ソート
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (sortField === "updatedAt") {
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [properties, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合は順序を反転
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // 異なるフィールドの場合は新しいフィールドで降順
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <>
      {/* 検索とソート */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 検索バー */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="物件名、識別子、説明で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* ソートボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSort("name")}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                sortField === "name"
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              名前
              {sortField === "name" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <button
              onClick={() => handleSort("updatedAt")}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                sortField === "updatedAt"
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              更新日
              {sortField === "updatedAt" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          </div>
        </div>

        {/* 検索結果数 */}
        {searchQuery && (
          <div className="mt-3 text-sm text-gray-600">
            {filteredAndSortedProperties.length} 件の物件が見つかりました
          </div>
        )}
      </div>

      {/* 物件一覧 */}
      {filteredAndSortedProperties.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? "該当する物件が見つかりません" : "物件がありません"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery
              ? "別のキーワードで検索してください"
              : isAdmin
              ? "新しい物件を作成してください"
              : "アクセス可能な物件がありません"}
          </p>
          {isAdmin && !searchQuery && (
            <div className="mt-6">
              <Link
                href="/dashboard/properties/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                新規物件作成
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProperties.map((property) => (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="block bg-white shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {property.name}
                </h3>
                {property.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {property.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {property.slug}
                  </span>
                  <span>
                    {new Date(property.updatedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
