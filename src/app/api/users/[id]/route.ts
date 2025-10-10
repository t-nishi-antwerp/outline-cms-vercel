import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

// ユーザー更新スキーマ
const UpdateUserSchema = z.object({
  name: z.string().min(1, "名前は必須です").optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
  password: z.string().min(6, "パスワードは6文字以上必要です").optional(),
  role: z.enum(["admin", "editor"], {
    errorMap: () => ({ message: "roleはadminまたはeditorを指定してください" }),
  }).optional(),
  propertyIds: z.array(z.string()).optional(),
});

// PATCH /api/users/[id] - ユーザー更新（管理者のみ）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // 自分自身のroleは変更できない
    if (session.user.id === userId) {
      const body = await request.json();
      if (body.role && body.role !== session.user.role) {
        return NextResponse.json(
          { error: "自分自身の権限は変更できません" },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const validatedData = UpdateUserSchema.parse(body);

    // メールアドレスの重複チェック（変更する場合のみ）
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 400 }
        );
      }
    }

    // パスワードをハッシュ化（変更する場合のみ）
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 10);
    }

    // ユーザーを更新（物件紐付けを含む）
    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 物件紐付けが指定されている場合、更新
      if (validatedData.propertyIds !== undefined) {
        // 既存の紐付けを削除
        await tx.propertyUser.deleteMany({
          where: { userId },
        });

        // 編集者で物件が選択されている場合、新しい紐付けを作成
        if (
          validatedData.role === "editor" &&
          validatedData.propertyIds.length > 0
        ) {
          await tx.propertyUser.createMany({
            data: validatedData.propertyIds.map((propertyId) => ({
              userId,
              propertyId,
            })),
          });
        }
      }

      return updatedUser;
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが無効です", details: error.errors },
        { status: 400 }
      );
    }

    console.error("ユーザー更新エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - ユーザー削除（管理者のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // 自分自身は削除できない
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "自分自身を削除することはできません" },
        { status: 400 }
      );
    }

    // ユーザーを削除
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "ユーザーを削除しました",
    });
  } catch (error) {
    console.error("ユーザー削除エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの削除に失敗しました" },
      { status: 500 }
    );
  }
}
