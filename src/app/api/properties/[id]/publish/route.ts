import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProperty } from "@/lib/auth-utils";

// POST /api/properties/[id]/publish - 下書きを公開
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

    // 最新の下書きを取得
    const latestDraft = await prisma.propertyData.findFirst({
      where: {
        propertyId,
        isPublished: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestDraft) {
      return NextResponse.json(
        { error: "公開する下書きがありません" },
        { status: 404 }
      );
    }

    // 現在の公開版を取得（バックアップ用）
    const currentPublished = await prisma.propertyData.findFirst({
      where: {
        propertyId,
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // トランザクションで処理
    const result = await prisma.$transaction(async (tx) => {
      // 1. 現在の公開版をバックアップ
      if (currentPublished) {
        await tx.propertyBackup.create({
          data: {
            propertyId,
            backupName: `公開前バックアップ ${new Date().toLocaleString("ja-JP")}`,
            description: "新しいバージョンを公開したため",
            data: currentPublished.data,
          },
        });

        // 現在の公開版を非公開に
        await tx.propertyData.update({
          where: { id: currentPublished.id },
          data: { isPublished: false },
        });
      }

      // 2. 下書きを公開版に昇格
      const timestamp = Date.now().toString().slice(-8); // 最後の8桁のみ使用
      const publishedData = await tx.propertyData.update({
        where: { id: latestDraft.id },
        data: {
          isPublished: true,
          version: `v.${timestamp}`, // v.12345678 (11文字)
        },
      });

      // 3. 履歴を記録
      await tx.propertyHistory.create({
        data: {
          propertyId,
          action: "publish",
          summary: "コンテンツを公開しました",
          dataBefore: currentPublished?.data,
          dataAfter: publishedData.data,
          createdBy: session.user.id,
        },
      });

      // 4. 物件の更新日時を更新
      await tx.property.update({
        where: { id: propertyId },
        data: { updatedAt: new Date() },
      });

      return publishedData;
    });

    return NextResponse.json({
      message: "公開しました",
      propertyData: result,
    });
  } catch (error) {
    console.error("公開エラー:", error);
    return NextResponse.json(
      { error: "公開に失敗しました" },
      { status: 500 }
    );
  }
}
