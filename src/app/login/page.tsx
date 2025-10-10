import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // すでにログインしている場合はダッシュボードにリダイレクト
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            物件概要CMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにログイン
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
        <div className="text-center text-sm text-gray-500">
          <p>初期管理者アカウント:</p>
          <p className="mt-1">
            メール: admin@example.com / パスワード: admin123
          </p>
        </div>
      </div>
    </div>
  );
}
