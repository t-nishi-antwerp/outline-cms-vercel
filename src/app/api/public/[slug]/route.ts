import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug] - 公開データをJSONPで取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const callback = searchParams.get("callback");

    // slugから物件を検索
    const property = await prisma.property.findUnique({
      where: { slug },
      include: {
        propertyData: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!property) {
      const errorData = {
        error: "Property not found",
        slug,
      };

      if (callback) {
        return new NextResponse(`${callback}(${JSON.stringify(errorData)});`, {
          status: 404,
          headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300, s-maxage=600",
          },
        });
      }

      return NextResponse.json(errorData, { status: 404 });
    }

    const publishedData = property.propertyData[0];

    if (!publishedData) {
      const errorData = {
        error: "No published data found",
        slug,
      };

      if (callback) {
        return new NextResponse(`${callback}(${JSON.stringify(errorData)});`, {
          status: 404,
          headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300, s-maxage=600",
          },
        });
      }

      return NextResponse.json(errorData, { status: 404 });
    }

    // レスポンスデータを構築
    const responseData = {
      property: {
        name: property.name,
        slug: property.slug,
        siteUrl: property.siteUrl,
        description: property.description,
      },
      data: publishedData.data,
      version: publishedData.version,
      updatedAt: publishedData.updatedAt,
    };

    // JSONPリクエストの場合
    if (callback) {
      // callbackパラメータが安全な関数名かチェック
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(callback)) {
        return new NextResponse("Invalid callback parameter", {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }

      return new NextResponse(
        `${callback}(${JSON.stringify(responseData)});`,
        {
          status: 200,
          headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300, s-maxage=600",
          },
        }
      );
    }

    // 通常のJSONレスポンス
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (error) {
    console.error("Public API error:", error);
    const errorData = {
      error: "Internal server error",
    };

    const { searchParams } = new URL(request.url);
    const callback = searchParams.get("callback");

    if (callback && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(callback)) {
      return new NextResponse(`${callback}(${JSON.stringify(errorData)});`, {
        status: 500,
        headers: {
          "Content-Type": "application/javascript",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return NextResponse.json(errorData, { status: 500 });
  }
}
