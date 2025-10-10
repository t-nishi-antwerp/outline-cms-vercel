"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
    >
      ログアウト
    </button>
  );
}
