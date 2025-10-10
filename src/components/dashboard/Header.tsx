import { LogoutButton } from "@/components/auth/LogoutButton";
import Link from "next/link";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                物件概要CMS
              </h1>
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/dashboard/properties"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                物件管理
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/dashboard/users"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ユーザー管理
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">
                {user.role === "admin" ? "管理者" : "編集者"}
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
