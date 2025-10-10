import { requireAuth } from "@/lib/auth-utils";
import { Header } from "@/components/dashboard/Header";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">ダッシュボード</h2>
          <p className="text-gray-600">
            ようこそ、{session.user.name}さん
          </p>
          <div className="mt-6 space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">
                アカウント情報
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">メールアドレス</dt>
                  <dd className="text-sm font-medium">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">権限</dt>
                  <dd className="text-sm font-medium">
                    {session.user.role === "admin" ? "管理者" : "編集者"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">ユーザーID</dt>
                  <dd className="text-sm font-mono text-xs">
                    {session.user.id}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">
                クイックアクセス
              </h3>
              <div className="space-y-2">
                <a
                  href="/dashboard/properties"
                  className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">
                      物件一覧
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
