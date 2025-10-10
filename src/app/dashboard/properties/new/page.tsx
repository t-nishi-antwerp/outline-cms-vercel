import { requireAdmin } from "@/lib/auth-utils";
import { Header } from "@/components/dashboard/Header";
import { PropertyForm } from "@/components/properties/PropertyForm";

export default async function NewPropertyPage() {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">新規物件作成</h2>
          <p className="mt-1 text-sm text-gray-600">
            物件の基本情報を入力してください。作成後、概要データを編集できます。
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <PropertyForm mode="create" />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            作成時の初期設定
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 「全体概要」セクション（固定）が自動生成されます</li>
            <li>• 「情報更新日」セクション（可変）が自動生成されます</li>
            <li>• 作成後、セクションや項目を追加・編集できます</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
