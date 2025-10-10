import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { UserList } from "@/components/users/UserList";
import Link from "next/link";

export default async function UsersPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          propertyUsers: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">ユーザー管理</h2>
          <Link
            href="/dashboard/users/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規ユーザー作成
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <UserList initialUsers={users} currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
