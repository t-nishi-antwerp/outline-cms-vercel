import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  // ログイン済みの場合はダッシュボードにリダイレクト
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">物件概要CMS</h1>
        <p className="text-lg text-gray-600 mb-8">
          不動産物件の概要情報を管理するCMSシステム
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ログイン
        </Link>
      </div>
    </div>
  );
}
