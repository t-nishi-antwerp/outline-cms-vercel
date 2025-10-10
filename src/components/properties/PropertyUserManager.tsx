"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PropertyUser {
  id: string;
  user: User;
}

interface PropertyUserManagerProps {
  propertyId: string;
  propertyUsers: PropertyUser[];
  allUsers: User[];
}

export function PropertyUserManager({
  propertyId,
  propertyUsers: initialPropertyUsers,
  allUsers,
}: PropertyUserManagerProps) {
  const router = useRouter();
  const [propertyUsers, setPropertyUsers] = useState(initialPropertyUsers);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // 紐付け済みユーザーのIDリスト
  const assignedUserIds = propertyUsers.map((pu) => pu.user.id);

  // 未紐付けユーザーのリスト
  const availableUsers = allUsers.filter(
    (user) => !assignedUserIds.includes(user.id)
  );

  const handleAddUser = async () => {
    if (!selectedUserId) {
      alert("ユーザーを選択してください");
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "追加に失敗しました");
      }

      // ステートを更新
      if (data.propertyUser) {
        setPropertyUsers([...propertyUsers, data.propertyUser]);
      }

      setSelectedUserId("");
      alert("ユーザーを追加しました");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "追加に失敗しました");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `「${userName}」をこの物件から削除しますか？\n\nこのユーザーはこの物件にアクセスできなくなります。`
      )
    ) {
      return;
    }

    setRemovingId(userId);

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました");
      }

      // ステートから削除
      setPropertyUsers(
        propertyUsers.filter((pu) => pu.user.id !== userId)
      );

      alert("ユーザーを削除しました");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ユーザー追加セクション */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          ユーザーを追加
        </h4>
        <div className="flex gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={isAdding || availableUsers.length === 0}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">
              {availableUsers.length === 0
                ? "追加可能なユーザーがいません"
                : "ユーザーを選択"}
            </option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddUser}
            disabled={isAdding || !selectedUserId}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isAdding ? "追加中..." : "追加"}
          </button>
        </div>
      </div>

      {/* 紐付け済みユーザー一覧 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          アクセス可能なユーザー ({propertyUsers.length}名)
        </h4>

        {propertyUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <p className="text-sm">紐付けされたユーザーがいません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {propertyUsers.map((pu) => (
                  <tr key={pu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pu.user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {pu.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() =>
                          handleRemoveUser(pu.user.id, pu.user.name)
                        }
                        disabled={removingId === pu.user.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {removingId === pu.user.id ? "削除中..." : "削除"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
