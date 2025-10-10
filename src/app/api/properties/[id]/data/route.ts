import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProperty } from "@/lib/auth-utils";
import { z } from "zod";

// プロパティアイテムスキーマ
const PropertyItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  order: z.number(),
});

// プロパティセクションスキーマ
const PropertySectionSchema = z.object({
  id: z.string(),
  type: z.enum(["fixed", "variable"]),
  title: z.string(),
  order: z.number(),
  items: z.array(PropertyItemSchema),
});

// プロパティデータスキーマ
const PropertyDataSchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  updatedBy: z.string(),
  sections: z.array(PropertySectionSchema),
});

// POST /api/properties/[id]/data - 下書き保存
export async function POST(
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

    const body = await request.json();
    const validatedData = PropertyDataSchema.parse(body);

    // 現在の下書きバージョンを取得
    const currentDraft = await prisma.propertyData.findFirst({
      where: {
        propertyId,
        isPublished: false,
      },
      orderBy: { createdAt: "desc" },
    });

    // バージョン番号をインクリメント
    const versionNumber = currentDraft
      ? parseInt(currentDraft.version.split(".")[1]) + 1
      : 1;

    const newVersion = `draft.${versionNumber}`;

    // 下書きデータを保存
    const propertyData = await prisma.propertyData.create({
      data: {
        propertyId,
        version: newVersion,
        data: {
          ...validatedData,
          version: newVersion,
          lastUpdated: new Date().toISOString(),
          updatedBy: session.user.id,
        },
        isPublished: false,
        createdBy: session.user.id,
      },
    });

    // 履歴を記録
    await prisma.propertyHistory.create({
      data: {
        propertyId,
        action: "update",
        summary: "下書きを保存しました",
        dataAfter: propertyData.data as any,
        createdBy: session.user.id,
      },
    });

    // 物件の更新日時を更新
    await prisma.property.update({
      where: { id: propertyId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ propertyData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが無効です", details: error.errors },
        { status: 400 }
      );
    }

    console.error("下書き保存エラー:", error);
    return NextResponse.json(
      { error: "下書きの保存に失敗しました" },
      { status: 500 }
    );
  }
}

// GET /api/properties/[id]/data - 最新の下書きまたは公開データを取得
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

    // URLパラメータから公開版/下書き版を判定
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "draft"; // 'draft' or 'published'

    const propertyData = await prisma.propertyData.findFirst({
      where: {
        propertyId,
        isPublished: type === "published",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!propertyData) {
      return NextResponse.json(
        { error: "データが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ propertyData });
  } catch (error) {
    console.error("データ取得エラー:", error);
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
