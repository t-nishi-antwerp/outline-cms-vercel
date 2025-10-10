import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProperty } from "@/lib/auth-utils";

// POST /api/properties/[id]/backups/[backupId]/restore - バックアップを復元
export async function POST(
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

    // トランザクションで復元処理
    const result = await prisma.$transaction(async (tx) => {
      // 現在の下書きを取得（存在すれば削除）
      const currentDraft = await tx.propertyData.findFirst({
        where: {
          propertyId,
          isPublished: false,
        },
        orderBy: { createdAt: "desc" },
      });

      if (currentDraft) {
        // 既存の下書きを削除
        await tx.propertyData.delete({
          where: { id: currentDraft.id },
        });
      }

      // バックアップデータを新しい下書きとして作成
      const timestamp = Date.now().toString().slice(-8); // 最後の8桁のみ使用
      const restoredData = await tx.propertyData.create({
        data: {
          propertyId,
          version: `r.${timestamp}`, // r.12345678 (11文字)
          data: backup.data as any,
          isPublished: false, // 下書きとして作成
          createdBy: session.user.id,
        },
      });

      // 履歴を記録
      const currentPublished = await tx.propertyData.findFirst({
        where: {
          propertyId,
          isPublished: true,
        },
        orderBy: { createdAt: "desc" },
      });

      await tx.propertyHistory.create({
        data: {
          propertyId,
          action: "restore",
          summary: `バックアップから復元しました (${backup.backupName}) - 下書きとして作成`,
          dataBefore: currentPublished?.data as any,
          dataAfter: restoredData.data as any,
          createdBy: session.user.id,
        },
      });

      // 物件の更新日時を更新
      await tx.property.update({
        where: { id: propertyId },
        data: { updatedAt: new Date() },
      });

      return restoredData;
    });

    return NextResponse.json({
      message: "バックアップを下書きとして復元しました。内容を確認後、公開してください。",
      propertyData: result,
    });
  } catch (error) {
    console.error("バックアップ復元エラー:", error);
    return NextResponse.json(
      { error: "バックアップの復元に失敗しました" },
      { status: 500 }
    );
  }
}
