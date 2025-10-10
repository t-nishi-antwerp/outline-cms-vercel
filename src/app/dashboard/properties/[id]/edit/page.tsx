import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { DeletePropertyButton } from "@/components/properties/DeletePropertyButton";
import { PropertyUserManager } from "@/components/properties/PropertyUserManager";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id: propertyId } = await params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      propertyUsers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  // 全ユーザーを取得（紐付け用）
  const allUsers = await prisma.user.findMany({
    where: {
      role: "editor", // 編集者のみ
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/properties/${propertyId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← 物件詳細に戻る
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">物件設定編集</h2>
          <p className="mt-1 text-sm text-gray-600">
            物件の基本情報を編集します。
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <PropertyForm
            mode="edit"
            propertyId={propertyId}
            initialData={{
              name: property.name,
              slug: property.slug,
              siteUrl: property.siteUrl || "",
              description: property.description || "",
            }}
          />
        </div>

        {/* ユーザー紐付け管理セクション */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            アクセス権限の管理
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            この物件にアクセスできるユーザーを管理します。編集者のみが追加可能です。
          </p>
          <PropertyUserManager
            propertyId={propertyId}
            propertyUsers={property.propertyUsers}
            allUsers={allUsers}
          />
        </div>

        {/* 削除セクション */}
        <div className="mt-8 bg-white shadow rounded-lg p-6 border-2 border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            危険な操作
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            この物件を削除すると、関連する全てのデータ(概要データ、バックアップ、履歴)が完全に削除されます。この操作は取り消せません。
          </p>
          <DeletePropertyButton
            propertyId={propertyId}
            propertyName={property.name}
          />
        </div>
      </main>
    </div>
  );
}
