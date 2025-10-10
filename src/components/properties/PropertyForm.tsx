"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/property-utils";

interface PropertyFormProps {
  mode: "create" | "edit";
  initialData?: {
    name: string;
    slug: string;
    siteUrl: string;
    description: string;
  };
  propertyId?: string;
}

export function PropertyForm({
  mode,
  initialData,
  propertyId,
}: PropertyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    siteUrl: initialData?.siteUrl || "",
    description: initialData?.description || "",
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      // 作成モードの場合、名前からslugを自動生成
      slug: mode === "create" ? generateSlug(name) : formData.slug,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/properties"
          : `/api/properties/${propertyId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      // 成功したら物件詳細ページまたは一覧ページへ
      if (mode === "create") {
        router.push(`/dashboard/properties/${data.property.id}`);
      } else {
        router.push("/dashboard/properties");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          物件名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={handleNameChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="例: アントワープレジデンス"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700"
        >
          識別子（URL用） <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="slug"
          required
          value={formData.slug}
          onChange={(e) =>
            setFormData({ ...formData, slug: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          placeholder="例: antwerp"
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">
          英数字とハイフンのみ。API URLに使用されます
        </p>
      </div>

      <div>
        <label
          htmlFor="siteUrl"
          className="block text-sm font-medium text-gray-700"
        >
          本番サイトURL
        </label>
        <input
          type="url"
          id="siteUrl"
          value={formData.siteUrl}
          onChange={(e) =>
            setFormData({ ...formData, siteUrl: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/property/"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          説明・メモ
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="物件に関するメモや説明を入力"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading
            ? mode === "create"
              ? "作成中..."
              : "更新中..."
            : mode === "create"
            ? "物件を作成"
            : "更新する"}
        </button>
      </div>
    </form>
  );
}
