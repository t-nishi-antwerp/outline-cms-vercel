import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDefaultPropertyData } from "@/lib/property-utils";
import { z } from "zod";

// 物件作成スキーマ
const CreatePropertySchema = z.object({
  name: z.string().min(1, "物件名は必須です"),
  slug: z.string().min(1, "識別子は必須です"),
  siteUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  description: z.string().optional(),
});

// GET /api/properties - 物件一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    let properties;

    if (session.user.role === "admin") {
      // 管理者は全物件を取得
      properties = await prisma.property.findMany({
        orderBy: { updatedAt: "desc" },
      });
    } else {
      // 編集者は紐付けられた物件のみ
      properties = await prisma.property.findMany({
        where: {
          propertyUsers: {
            some: {
              userId: session.user.id,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("物件一覧取得エラー:", error);
    return NextResponse.json(
      { error: "物件一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/properties - 物件作成（管理者のみ）
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = CreatePropertySchema.parse(body);

    // slugの重複チェック
    const existingProperty = await prisma.property.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProperty) {
      return NextResponse.json(
        { error: "この識別子は既に使用されています" },
        { status: 400 }
      );
    }

    // デフォルトデータを生成
    const defaultData = createDefaultPropertyData(session.user.id);

    // 物件とデータを作成
    const property = await prisma.property.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        siteUrl: validatedData.siteUrl || null,
        description: validatedData.description || null,
        propertyData: {
          create: {
            version: defaultData.version,
            data: defaultData,
            isPublished: false,
            createdBy: session.user.id,
          },
        },
        propertyHistory: {
          create: {
            action: "create",
            summary: "物件を作成しました",
            dataAfter: defaultData,
            createdBy: session.user.id,
          },
        },
      },
      include: {
        propertyData: true,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが無効です", details: error.errors },
        { status: 400 }
      );
    }

    console.error("物件作成エラー:", error);
    return NextResponse.json(
      { error: "物件の作成に失敗しました" },
      { status: 500 }
    );
  }
}
