"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Property {
  id: string;
  name: string;
  slug: string;
}

interface PropertyUser {
  property: Property;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  propertyUsers: PropertyUser[];
}

interface UserEditFormProps {
  user: User;
  allProperties: Property[];
  currentUserId: string;
}

export function UserEditForm({
  user,
  allProperties,
  currentUserId,
}: UserEditFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: "",
    confirmPassword: "",
    role: user.role as "admin" | "editor",
  });
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(
    user.propertyUsers.map((pu) => pu.property.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isSelf = user.id === currentUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // パスワード確認チェック（入力されている場合のみ）
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    // パスワード長チェック（入力されている場合のみ）
    if (formData.password && formData.password.length < 6) {
      setError("パスワードは6文字以上必要です");
      return;
    }

    setIsSubmitting(true);

    try {
      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        propertyIds: selectedPropertyIds,
      };

      // パスワードが入力されている場合のみ含める
      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ユーザーの更新に失敗しました");
      }

      alert("ユーザーを更新しました");
      router.push("/dashboard/users");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ユーザーの更新に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    if (selectedPropertyIds.includes(propertyId)) {
      setSelectedPropertyIds(
        selectedPropertyIds.filter((id) => id !== propertyId)
      );
    } else {
      setSelectedPropertyIds([...selectedPropertyIds, propertyId]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          新しいパスワード
        </label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="変更する場合のみ入力"
        />
        <p className="mt-1 text-xs text-gray-500">
          変更しない場合は空欄のままにしてください
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          パスワード（確認）
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="パスワードを再入力"
        />
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          権限 <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) =>
            setFormData({
              ...formData,
              role: e.target.value as "admin" | "editor",
            })
          }
          disabled={isSelf}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
          required
        >
          <option value="editor">編集者</option>
          <option value="admin">管理者</option>
        </select>
        {isSelf && (
          <p className="mt-1 text-xs text-gray-500">
            自分自身の権限は変更できません
          </p>
        )}
        {!isSelf && (
          <p className="mt-1 text-xs text-gray-500">
            管理者: すべての機能にアクセス可能 / 編集者:
            割り当てられた物件のみ編集可能
          </p>
        )}
      </div>

      {formData.role === "editor" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            アクセス可能な物件
          </label>
          {allProperties.length === 0 ? (
            <p className="text-sm text-gray-500">物件がありません</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
              {allProperties.map((property) => (
                <label
                  key={property.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPropertyIds.includes(property.id)}
                    onChange={() => handlePropertyToggle(property.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{property.name}</span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            編集者は選択された物件のみにアクセスできます
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "更新中..." : "更新"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/users")}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
