import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { UserForm } from "@/components/users/UserForm";
import Link from "next/link";

export default async function NewUserPage() {
  const session = await requireAdmin();

  // 全物件を取得（紐付け用）
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/users"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← ユーザー一覧に戻る
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            新規ユーザー作成
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            新しいユーザーを登録します。
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <UserForm mode="create" properties={properties} />
        </div>
      </main>
    </div>
  );
}
