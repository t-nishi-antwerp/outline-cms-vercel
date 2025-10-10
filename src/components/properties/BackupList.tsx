"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Backup {
  id: string;
  backupName: string;
  description: string | null;
  createdAt: Date;
}

interface BackupListProps {
  propertyId: string;
  initialBackups: Backup[];
}

export function BackupList({ propertyId, initialBackups }: BackupListProps) {
  const router = useRouter();
  const [backups, setBackups] = useState(initialBackups);
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateBackup = async () => {
    const reason = prompt("バックアップの理由を入力してください（任意）:");
    if (reason === null) return; // キャンセルされた

    setIsCreating(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}/backups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason || "手動バックアップ" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "バックアップの作成に失敗しました");
      }

      // 新しいバックアップをステートに追加
      if (data.backup) {
        setBackups([data.backup, ...backups]);
      }

      alert("バックアップを作成しました");
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "バックアップの作成に失敗しました"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (backupId: string, backupName: string) => {
    if (
      !confirm(
        `バックアップ「${backupName}」を復元しますか？\n\n復元されたデータは下書きとして保存されます。\n内容を確認後、公開ボタンで本番環境に反映してください。`
      )
    ) {
      return;
    }

    setRestoringId(backupId);

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/backups/${backupId}/restore`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "復元に失敗しました");
      }

      alert(data.message || "バックアップを下書きとして復元しました");
      router.push(`/dashboard/properties/${propertyId}/edit`);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "復元に失敗しました");
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (backupId: string, backupName: string) => {
    if (!confirm(`バックアップ「${backupName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    setDeletingId(backupId);

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/backups/${backupId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました");
      }

      // ステートから削除されたバックアップを除外
      setBackups(backups.filter((backup) => backup.id !== backupId));

      alert("バックアップを削除しました");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (backup: Backup) => {
    setEditingId(backup.id);
    setEditName(backup.backupName);
    setEditDescription(backup.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveEdit = async (backupId: string) => {
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/backups/${backupId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            backupName: editName,
            description: editDescription,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "更新に失敗しました");
      }

      // ステートを更新
      setBackups(
        backups.map((backup) =>
          backup.id === backupId
            ? { ...backup, backupName: editName, description: editDescription }
            : backup
        )
      );

      alert("バックアップを更新しました");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新に失敗しました");
    }
  };

  // フィルタリング
  const filteredBackups = useMemo(() => {
    if (!searchQuery) return backups;

    const query = searchQuery.toLowerCase();
    return backups.filter((backup) => {
      return (
        backup.backupName.toLowerCase().includes(query) ||
        backup.description?.toLowerCase().includes(query)
      );
    });
  }, [backups, searchQuery]);

  return (
    <div>
      {/* 検索バーと作成ボタン */}
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            全 {backups.length} 件のバックアップ
          </p>
          <button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {isCreating ? "作成中..." : "手動バックアップ作成"}
          </button>
        </div>

        {/* 検索バー */}
        {backups.length > 0 && (
          <div className="relative">
            <input
              type="text"
              placeholder="バックアップ名、説明で検索..."
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
        )}

        {/* 検索結果数 */}
        {searchQuery && (
          <div className="text-sm text-gray-600">
            {filteredBackups.length} 件のバックアップが見つかりました
          </div>
        )}
      </div>

      {filteredBackups.length === 0 && backups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>バックアップがありません</p>
          <p className="text-sm mt-2">
            公開時に自動的にバックアップが作成されます
          </p>
        </div>
      ) : filteredBackups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>該当するバックアップが見つかりません</p>
          <p className="text-sm mt-2">別のキーワードで検索してください</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  バックアップ名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  説明
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBackups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  {editingId === backup.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="バックアップ名"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="説明"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(backup.createdAt).toLocaleString("ja-JP")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleSaveEdit(backup.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          キャンセル
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {backup.backupName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {backup.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(backup.createdAt).toLocaleString("ja-JP")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleRestore(backup.id, backup.backupName)}
                          disabled={restoringId === backup.id || deletingId === backup.id}
                          className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          {restoringId === backup.id ? "復元中..." : "復元"}
                        </button>
                        <button
                          onClick={() => handleStartEdit(backup)}
                          disabled={restoringId === backup.id || deletingId === backup.id}
                          className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(backup.id, backup.backupName)}
                          disabled={restoringId === backup.id || deletingId === backup.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingId === backup.id ? "削除中..." : "削除"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
