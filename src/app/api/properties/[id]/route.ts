import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProperty } from "@/lib/auth-utils";
import { z } from "zod";

// 物件更新スキーマ
const UpdatePropertySchema = z.object({
  name: z.string().min(1, "物件名は必須です").optional(),
  slug: z.string().min(1, "識別子は必須です").optional(),
  siteUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  description: z.string().optional(),
});

// GET /api/properties/[id] - 物件詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id: propertyId } = await params;

    // アクセス権限チェック
    const hasAccess = await canAccessProperty(
      propertyId,
      session.user.id,
      session.user.role
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "この物件へのアクセス権限がありません" },
        { status: 403 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        propertyData: {
          orderBy: { createdAt: "desc" },
          take: 2, // 公開版と下書き版
        },
        propertyUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "物件が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error("物件詳細取得エラー:", error);
    return NextResponse.json(
      { error: "物件詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - 物件更新（管理者のみ）
export async function PUT(
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
    const validatedData = UpdatePropertySchema.parse(body);

    // slugの重複チェック（変更する場合）
    if (validatedData.slug) {
      const existingProperty = await prisma.property.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: propertyId },
        },
      });

      if (existingProperty) {
        return NextResponse.json(
          { error: "この識別子は既に使用されています" },
          { status: 400 }
        );
      }
    }

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...validatedData,
        siteUrl: validatedData.siteUrl || null,
      },
    });

    return NextResponse.json({ property });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが無効です", details: error.errors },
        { status: 400 }
      );
    }

    console.error("物件更新エラー:", error);
    return NextResponse.json(
      { error: "物件の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - 物件削除（管理者のみ）
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

    const { id: propertyId } = await params;

    // 物件を削除（CASCADE設定により関連データも自動削除）
    await prisma.property.delete({
      where: { id: propertyId },
    });

    return NextResponse.json({ message: "物件を削除しました" });
  } catch (error) {
    console.error("物件削除エラー:", error);
    return NextResponse.json(
      { error: "物件の削除に失敗しました" },
      { status: 500 }
    );
  }
}
