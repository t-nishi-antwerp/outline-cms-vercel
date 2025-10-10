import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProperty } from "@/lib/auth-utils";
import { randomBytes } from "crypto";

// POST /api/properties/[id]/preview - プレビュートークン生成
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

    // 物件の存在チェック
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: "物件が見つかりません" },
        { status: 404 }
      );
    }

    // 既存のプレビュートークンを無効化（1物件につき1トークンのみ有効）
    await prisma.previewToken.deleteMany({
      where: {
        propertyId,
      },
    });

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
        { error: "プレビューする下書きがありません" },
        { status: 404 }
      );
    }

    // 新しいプレビュートークンを生成
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24時間有効

    const previewToken = await prisma.previewToken.create({
      data: {
        propertyId,
        token,
        data: latestDraft.data as any,
        expiresAt,
      },
    });

    // プレビューURL生成
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const previewUrl = `${baseUrl}/preview/${property.slug}?token=${token}`;

    return NextResponse.json({
      token,
      expiresAt: previewToken.expiresAt,
      previewUrl,
    });
  } catch (error) {
    console.error("プレビュートークン生成エラー:", error);
    return NextResponse.json(
      { error: "プレビュートークンの生成に失敗しました" },
      { status: 500 }
    );
  }
}
