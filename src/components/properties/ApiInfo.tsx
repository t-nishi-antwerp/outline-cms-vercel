"use client";

import { useState } from "react";

interface ApiInfoProps {
  slug: string;
}

export function ApiInfo({ slug }: ApiInfoProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"js" | "css">("js");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const jsonUrl = `${baseUrl}/api/public/${slug}`;
  const jsonpUrl = `${baseUrl}/api/public/${slug}?callback=handlePropertyData`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exampleCode = `<!-- 本番サイトに埋め込むコード例 -->
<div id="property-outline"></div>

<script>
function handlePropertyData(response) {
  if (response.error) {
    console.error('エラー:', response.error, response.message);
    return;
  }

  console.log('物件データ取得成功:', response);

  // データを展開
  const propertyData = response.data;
  const container = document.getElementById('property-outline');

  if (!container) return;

  // HTMLを構築
  let html = '';

  propertyData.sections.forEach(section => {
    html += '<div class="property-section">';
    html += '<h2 class="section-title">' + section.title + '</h2>';
    html += '<dl class="section-items">';

    section.items.forEach(item => {
      html += '<div class="item">';
      html += '<dt class="item-label">' + item.label + '</dt>';
      html += '<dd class="item-value">' + (item.value || '-') + '</dd>';
      html += '</div>';
    });

    html += '</dl>';
    html += '</div>';
  });

  container.innerHTML = html;
}
</script>
<script src="${jsonpUrl}"></script>`;

  const exampleCSS = `/* 物件概要データのスタイル例 */
.property-section {
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  padding: 1rem 1.5rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  margin: 0;
}

.section-items {
  margin: 0;
}

.item {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.item:last-child {
  border-bottom: none;
}

.item-label {
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.item-value {
  color: #111827;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}`;

  return (
    <div className="mt-6 pt-6 border-t">
      <h4 className="font-medium text-gray-900 mb-3">API情報</h4>

      <div className="space-y-4 text-sm">
        {/* JSON URL */}
        <div>
          <label className="block text-gray-500 mb-1">JSON URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={jsonUrl}
              readOnly
              className="flex-1 px-2 py-1 text-xs font-mono bg-gray-50 border border-gray-300 rounded"
            />
            <button
              onClick={() => handleCopy(jsonUrl)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              {copied ? "✓" : "コピー"}
            </button>
          </div>
        </div>

        {/* JSONP URL */}
        <div>
          <label className="block text-gray-500 mb-1">JSONP URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={jsonpUrl}
              readOnly
              className="flex-1 px-2 py-1 text-xs font-mono bg-gray-50 border border-gray-300 rounded"
            />
            <button
              onClick={() => handleCopy(jsonpUrl)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              {copied ? "✓" : "コピー"}
            </button>
          </div>
        </div>

        {/* Test API Button */}
        <div>
          <a
            href={jsonpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            APIをテスト
          </a>
          <p className="text-xs text-gray-500 mt-1">
            新しいタブでAPIレスポンスを確認できます
          </p>
        </div>

        {/* 使用例 */}
        <details className="mt-4" open>
          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
            埋め込みコード例を表示
          </summary>
          <div className="mt-3">
            {/* タブ */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-2">
              <button
                onClick={() => setActiveTab("js")}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "js"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                JavaScript
              </button>
              <button
                onClick={() => setActiveTab("css")}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "css"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                CSS
              </button>
            </div>

            {/* コード表示 */}
            <div className="relative">
              <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-96">
                <code>{activeTab === "js" ? exampleCode : exampleCSS}</code>
              </pre>
              <button
                onClick={() => handleCopy(activeTab === "js" ? exampleCode : exampleCSS)}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                {copied ? "✓" : "コピー"}
              </button>
            </div>
          </div>
        </details>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
          <p className="text-xs text-blue-900 font-medium mb-2">
            動作しない場合のチェックポイント:
          </p>
          <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
            <li>データを「公開」していますか？（下書きのままでは表示されません）</li>
            <li>コールバック関数は &lt;script&gt; タグより前に定義されていますか？</li>
            <li>ブラウザの開発者ツールでエラーを確認しましたか？</li>
            <li>上の「APIをテスト」ボタンでデータが返ってきますか？</li>
          </ul>
          <p className="text-xs text-blue-800 mt-2">
            詳しくは <code className="bg-blue-100 px-1 rounded">TROUBLESHOOTING_JSONP.md</code> をご覧ください。
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
          <p className="text-xs text-yellow-800">
            <strong>注意:</strong> このAPIは公開データのみを返します。CORS対応済みで、本番サイトから直接呼び出すことができます。
          </p>
        </div>
      </div>
    </div>
  );
}
