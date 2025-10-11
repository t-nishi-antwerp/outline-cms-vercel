import { NextRequest, NextResponse } from "next/server";

// Next.jsのキャッシュを無効化
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/public/[slug]/embed.js - 埋め込み用JavaScriptファイルを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const containerId = searchParams.get("container") || "property-outline";
  const callback = searchParams.get("callback") || "handlePropertyData";

  // APIのベースURL（本番環境のURL）
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/public/${slug}?callback=${callback}`;

  // slugを変数名として安全な形式に変換
  const safeSlug = slug.replace(/[^a-zA-Z0-9]/g, '_');

  // 埋め込み用JavaScriptコード
  const embedScript = `(function() {
  // 既にスクリプトが読み込まれている場合は何もしない
  if (window.__propertyOutlineLoaded_${safeSlug}) {
    return;
  }
  window.__propertyOutlineLoaded_${safeSlug} = true;

  // コールバック関数を定義
  window.${callback} = function(response) {
    console.log('物件データ:', response);

    // エラーチェック
    if (response.error) {
      const container = document.getElementById('${containerId}');
      if (container) {
        container.innerHTML = '<p style="color: red;">エラー: ' + response.error + '</p>';
      }
      console.error('APIエラー:', response.error, response);
      return;
    }

    // 物件データを取得
    const propertyData = response.data;
    const container = document.getElementById('${containerId}');

    if (!container) {
      console.error('コンテナ要素が見つかりません: #${containerId}');
      return;
    }

    // HTMLを構築
    let html = '';

    propertyData.sections.forEach(function(section) {
      html += '<div class="property-section">';
      html += '<h2 class="section-title">' + section.title + '</h2>';
      html += '<dl class="section-items">';

      section.items.forEach(function(item) {
        html += '<div class="item">';
        html += '<dt class="item-label">' + item.label + '</dt>';
        html += '<dd class="item-value">' + (item.value || '-') + '</dd>';
        html += '</div>';
      });

      html += '</dl>';
      html += '</div>';
    });

    container.innerHTML = html;
  };

  // JSONPスクリプトを動的に読み込み
  var script = document.createElement('script');
  script.src = '${apiUrl}';
  script.onerror = function() {
    console.error('物件データの読み込みに失敗しました');
    var container = document.getElementById('${containerId}');
    if (container) {
      container.innerHTML = '<p style="color: red;">データの読み込みに失敗しました</p>';
    }
  };
  document.head.appendChild(script);
})();`;

  return new NextResponse(embedScript, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=0, s-maxage=0, must-revalidate",
    },
  });
}
