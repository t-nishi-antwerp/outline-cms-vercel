import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProperty } from "@/lib/auth-utils";

// GET /api/properties/[id]/backups - バックアップ一覧取得
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

    // バックアップ一覧を取得
    const backups = await prisma.propertyBackup.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ backups });
  } catch (error) {
    console.error("バックアップ一覧取得エラー:", error);
    return NextResponse.json(
      { error: "バックアップ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/properties/[id]/backups - 手動バックアップ作成
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
    const { reason } = body;

    // 現在の公開版を取得
    const currentPublished = await prisma.propertyData.findFirst({
      where: {
        propertyId,
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!currentPublished) {
      return NextResponse.json(
        { error: "公開データが見つかりません" },
        { status: 404 }
      );
    }

    // バックアップを作成
    const backup = await prisma.propertyBackup.create({
      data: {
        propertyId,
        backupName: reason || `手動バックアップ ${new Date().toLocaleString("ja-JP")}`,
        description: reason || "手動バックアップ",
        data: currentPublished.data as any,
      },
    });

    return NextResponse.json({ backup });
  } catch (error) {
    console.error("バックアップ作成エラー:", error);
    return NextResponse.json(
      { error: "バックアップの作成に失敗しました" },
      { status: 500 }
    );
  }
}
