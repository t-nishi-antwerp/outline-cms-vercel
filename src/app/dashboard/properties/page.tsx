import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { PropertyList } from "@/components/properties/PropertyList";
import Link from "next/link";

export default async function PropertiesPage() {
  const session = await requireAuth();

  // ユーザーがアクセス可能な物件を取得
  let properties;

  if (session.user.role === "admin") {
    // 管理者は全物件にアクセス可能
    properties = await prisma.property.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });
  } else {
    // 編集者は紐付けられた物件のみ
    properties = await prisma.property.findMany({
      where: {
        propertyUsers: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">物件一覧</h2>
          {session.user.role === "admin" && (
            <Link
              href="/dashboard/properties/new"
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
              新規物件作成
            </Link>
          )}
        </div>

        <PropertyList properties={properties} isAdmin={session.user.role === "admin"} />
      </main>
    </div>
  );
}
