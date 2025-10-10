import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = "admin@example.com";
  const password = "admin123";
  const name = "管理者";

  try {
    // 既存のユーザーをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("✅ 管理者ユーザーは既に存在しています");
      console.log(`   メール: ${email}`);
      return;
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // 管理者ユーザーを作成
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "admin",
      },
    });

    console.log("✅ 管理者ユーザーを作成しました");
    console.log(`   メール: ${email}`);
    console.log(`   パスワード: ${password}`);
    console.log(`   ユーザーID: ${admin.id}`);
  } catch (error) {
    console.error("❌ エラー:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
