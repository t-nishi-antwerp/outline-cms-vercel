import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProperty } from "@/lib/auth-utils";

// DELETE /api/properties/[id]/backups/[backupId] - バックアップ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; backupId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id: propertyId, backupId } = await params;

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

    // バックアップを取得
    const backup = await prisma.propertyBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup || backup.propertyId !== propertyId) {
      return NextResponse.json(
        { error: "バックアップが見つかりません" },
        { status: 404 }
      );
    }

    // バックアップを削除
    await prisma.propertyBackup.delete({
      where: { id: backupId },
    });

    return NextResponse.json({
      message: "バックアップを削除しました",
    });
  } catch (error) {
    console.error("バックアップ削除エラー:", error);
    return NextResponse.json(
      { error: "バックアップの削除に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/[id]/backups/[backupId] - バックアップ名称・説明変更
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; backupId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id: propertyId, backupId } = await params;

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

    // バックアップを取得
    const backup = await prisma.propertyBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup || backup.propertyId !== propertyId) {
      return NextResponse.json(
        { error: "バックアップが見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { backupName, description } = body;

    // バックアップ名称・説明を更新
    const updatedBackup = await prisma.propertyBackup.update({
      where: { id: backupId },
      data: {
        ...(backupName && { backupName }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      message: "バックアップを更新しました",
      backup: updatedBackup,
    });
  } catch (error) {
    console.error("バックアップ更新エラー:", error);
    return NextResponse.json(
      { error: "バックアップの更新に失敗しました" },
      { status: 500 }
    );
  }
}
