import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * サーバーコンポーネントで現在のセッションを取得
 */
export async function getSession() {
  return await auth();
}

/**
 * 認証が必要なページで使用
 * 未ログインの場合はログインページにリダイレクト
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * 管理者権限が必要なページで使用
 * 権限がない場合は403ページにリダイレクト
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/dashboard"); // または403ページ
  }
  return session;
}

/**
 * ユーザーが指定した物件にアクセスできるかチェック
 */
export async function canAccessProperty(
  propertyId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  // 管理者は全物件にアクセス可能
  if (userRole === "admin") {
    return true;
  }

  // 編集者は紐付けられた物件のみアクセス可能
  const { prisma } = await import("@/lib/prisma");
  const propertyUser = await prisma.propertyUser.findUnique({
    where: {
      propertyId_userId: {
        propertyId,
        userId,
      },
    },
  });

  return !!propertyUser;
}
