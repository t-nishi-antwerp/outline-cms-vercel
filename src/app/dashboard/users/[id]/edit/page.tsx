import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { UserEditForm } from "@/components/users/UserEditForm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id: userId } = await params;

  // ユーザー情報と紐付け物件を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      propertyUsers: {
        include: {
          property: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // 全物件を取得（紐付け用）
  const allProperties = await prisma.property.findMany({
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
          <h2 className="text-2xl font-bold text-gray-900">ユーザー編集</h2>
          <p className="mt-1 text-sm text-gray-600">
            ユーザー情報とアクセス権限を編集します。
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <UserEditForm
            user={user}
            allProperties={allProperties}
            currentUserId={session.user.id}
          />
        </div>
      </main>
    </div>
  );
}
