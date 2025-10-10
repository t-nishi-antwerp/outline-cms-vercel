"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PropertyActionsProps {
  propertyId: string;
}

export function PropertyActions({ propertyId }: PropertyActionsProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const handlePreview = async () => {
    setIsGeneratingPreview(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}/preview`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "プレビューURLの生成に失敗しました");
      }

      // 新しいタブでプレビューを開く
      window.open(data.previewUrl, "_blank");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "プレビューURLの生成に失敗しました"
      );
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("現在の下書きを公開しますか？\n\n公開すると、現在のバージョンがバックアップされ、下書き版が本番サイトで利用可能になります。")) {
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}/publish`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "公開に失敗しました");
      }

      alert("公開しました");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "公開に失敗しました");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePreview}
        disabled={isGeneratingPreview}
        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm disabled:opacity-50"
      >
        {isGeneratingPreview ? "準備中..." : "プレビュー"}
      </button>
      <Link
        href={`/dashboard/properties/${propertyId}/backups`}
        className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm text-center"
      >
        バックアップ管理
      </Link>
      <button
        onClick={handlePublish}
        disabled={isPublishing}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
      >
        {isPublishing ? "公開中..." : "公開"}
      </button>
    </div>
  );
}
