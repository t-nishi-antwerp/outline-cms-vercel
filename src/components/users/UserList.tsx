"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  _count: {
    propertyUsers: number;
  };
}

interface UserListProps {
  initialUsers: User[];
  currentUserId: string;
}

type SortField = "name" | "email" | "createdAt" | "propertyUsers";
type SortOrder = "asc" | "desc";
type RoleFilter = "all" | "admin" | "editor";

export function UserList({ initialUsers, currentUserId }: UserListProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const getRoleBadgeClass = (role: string) => {
    return role === "admin"
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  };

  const getRoleLabel = (role: string) => {
    return role === "admin" ? "管理者" : "編集者";
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (
      !confirm(
        `ユーザー「${userName}」を削除しますか？\n\nこの操作は取り消せません。`
      )
    ) {
      return;
    }

    setDeletingId(userId);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました");
      }

      // ステートから削除
      setUsers(users.filter((user) => user.id !== userId));

      alert("ユーザーを削除しました");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // フィルタリングとソート
  const filteredAndSortedUsers = useMemo(() => {
    // 検索フィルター
    let filtered = users.filter((user) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    // ソート
    filtered.sort((a, b) => {
      let aValue: string | Date | number;
      let bValue: string | Date | number;

      if (sortField === "propertyUsers") {
        aValue = a._count.propertyUsers;
        bValue = b._count.propertyUsers;
      } else if (sortField === "createdAt") {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, roleFilter, sortField, sortOrder]);

  return (
    <div>
      {/* 検索とフィルター */}
      <div className="mb-4 space-y-3">
        <p className="text-sm text-gray-600">
          全 {initialUsers.length} 名のユーザー
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          {/* 検索バー */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="名前、メールアドレスで検索..."
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

          {/* 権限フィルター */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全ての権限</option>
              <option value="admin">管理者</option>
              <option value="editor">編集者</option>
            </select>
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
              onClick={() => handleSort("createdAt")}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                sortField === "createdAt"
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              登録日
              {sortField === "createdAt" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          </div>
        </div>

        {/* 検索結果数 */}
        {(searchQuery || roleFilter !== "all") && (
          <div className="text-sm text-gray-600">
            {filteredAndSortedUsers.length} 名のユーザーが見つかりました
          </div>
        )}
      </div>

      {filteredAndSortedUsers.length === 0 && initialUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>ユーザーがいません</p>
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>該当するユーザーが見つかりません</p>
          <p className="text-sm mt-2">別の条件で検索してください</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  権限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  担当物件数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user._count.propertyUsers} 件
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
                      disabled={deletingId === user.id}
                      className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      編集
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deletingId === user.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === user.id ? "削除中..." : "削除"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
