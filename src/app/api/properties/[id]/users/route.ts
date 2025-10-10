import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ユーザー追加スキーマ
const AddUserSchema = z.object({
  userId: z.string().min(1, "ユーザーIDは必須です"),
});

// POST /api/properties/[id]/users - 物件にユーザーを追加（管理者のみ）
export async function POST(
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

    const { id: propertyId } = await params;
    const body = await request.json();
    const validatedData = AddUserSchema.parse(body);

    // 既に紐付いているかチェック
    const existing = await prisma.propertyUser.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId: validatedData.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "このユーザーは既に追加されています" },
        { status: 400 }
      );
    }

    // ユーザーを追加
    const propertyUser = await prisma.propertyUser.create({
      data: {
        propertyId,
        userId: validatedData.userId,
      },
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
    });

    return NextResponse.json({
      message: "ユーザーを追加しました",
      propertyUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが無効です", details: error.errors },
        { status: 400 }
      );
    }

    console.error("ユーザー追加エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの追加に失敗しました" },
      { status: 500 }
    );
  }
}
