"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeletePropertyButtonProps {
  propertyId: string;
  propertyName: string;
}

export function DeletePropertyButton({
  propertyId,
  propertyName,
}: DeletePropertyButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `本当に「${propertyName}」を削除しますか？\n\nこの操作は取り消せません。関連する全てのデータ（概要データ、バックアップ、履歴）も削除されます。`
      )
    ) {
      return;
    }

    // 2段階確認
    const confirmation = prompt(
      '削除を実行するには、物件名を入力してください:'
    );

    if (confirmation !== propertyName) {
      alert("物件名が一致しません。削除をキャンセルしました。");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      alert("物件を削除しました");
      router.push("/dashboard/properties");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
    >
      {isDeleting ? "削除中..." : "物件を削除"}
    </button>
  );
}
