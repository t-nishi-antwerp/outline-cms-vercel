# JSONP統合トラブルシューティングガイド

## 問題: 本番環境のHTMLにJavaScriptを挿入してもデータが表示されない

このガイドでは、JSONP API統合の問題を診断・解決する方法を説明します。

---

## ステップ1: 物件データが公開されているか確認

**問題:** 最も一般的な原因 - データが下書きとして保存されているが公開されていない

**解決方法:**
1. 管理画面にログイン: `https://your-app.vercel.app/login`
2. 物件一覧に移動
3. 対象の物件をクリック
4. 「公開中」バッジが表示されているか確認
5. 表示されていない場合、右サイドバーの「アクション」セクションにある「公開」ボタンをクリック
6. 公開アクションを確認

**API仕様:** APIエンドポイント `/api/public/[slug]` は `isPublished: true` のデータのみを返します

---

## ステップ2: APIエンドポイントを直接テスト

**テストURL形式:**
```
https://your-app.vercel.app/api/public/[YOUR-SLUG]?callback=handlePropertyData
```

`[YOUR-SLUG]` を物件のslug識別子に置き換えてください。

**期待されるレスポンス（JSONP）:**
```javascript
handlePropertyData({
  "property": {
    "name": "物件名",
    "slug": "property-slug",
    "siteUrl": "https://example.com",
    "description": "説明"
  },
  "data": {
    "version": "1.0",
    "lastUpdated": "2025-10-10T...",
    "updatedBy": "user-id",
    "sections": [
      {
        "id": "section-1",
        "type": "fixed",
        "title": "セクションタイトル",
        "order": 0,
        "items": [
          {
            "id": "item-1",
            "label": "ラベル",
            "value": "値",
            "order": 0
          }
        ]
      }
    ]
  },
  "version": "1.0",
  "updatedAt": "2025-10-10T..."
});
```

**エラーレスポンス（公開データなし）:**
```javascript
handlePropertyData({
  "error": "No published data found",
  "slug": "property-slug"
});
```

**エラーレスポンス（物件が見つからない）:**
```javascript
handlePropertyData({
  "error": "Property not found",
  "slug": "property-slug"
});
```

**テスト方法:**
1. URLをブラウザで直接開く
2. レスポンスが `handlePropertyData(` で始まっているか確認
3. データ構造が期待される形式と一致しているか確認
4. エラーが表示される場合、エラーメッセージを確認

---

## ステップ3: HTML統合コードを確認

**正しい統合例:**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>物件概要テスト</title>
  <style>
    .property-section {
      margin-bottom: 2rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .section-title {
      background-color: #f9fafb;
      padding: 1rem 1.5rem;
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
    }
    .section-items {
      margin: 0;
      padding: 0;
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
    }
    .item-value {
      color: #6b7280;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <h1>物件概要表示テスト</h1>

  <!-- 物件データ用コンテナ -->
  <div id="property-outline">読み込み中...</div>

  <!-- JSONPコールバック関数 -->
  <script>
    function handlePropertyData(response) {
      console.log('JSONPレスポンス:', response);

      // エラーチェック
      if (response.error) {
        const container = document.getElementById('property-outline');
        container.innerHTML = '<p style="color: red;">エラー: ' + response.error + '</p>';
        console.error('APIエラー:', response.error, response);
        return;
      }

      // 物件データを取得
      const propertyData = response.data;
      const container = document.getElementById('property-outline');

      // HTMLを構築
      let html = '<h2>' + response.property.name + '</h2>';

      propertyData.sections.forEach(function(section) {
        html += '<div class="property-section">';
        html += '<h3 class="section-title">' + section.title + '</h3>';
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
    }
  </script>

  <!-- JSONPスクリプトを読み込み -->
  <script src="https://your-app.vercel.app/api/public/YOUR-SLUG?callback=handlePropertyData"></script>
</body>
</html>
```

**重要なポイント:**
1. コールバック関数 `handlePropertyData` は、APIを読み込むscriptタグより**前に**定義する必要があります
2. URLパラメータの関数名は、定義した関数名と正確に一致する必要があります
3. `YOUR-SLUG` を実際の物件slugに置き換えてください
4. `your-app.vercel.app` をVercelデプロイメントURLに置き換えてください

---

## ステップ4: ブラウザコンソールを確認

**開発者ツールを開く:**
- Chrome/Edge: `F12` または `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Firefox: `F12` または `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- Safari: 環境設定で開発メニューを有効にし、`Cmd+Option+C`

**確認項目:**
1. **コンソールエラー:**
   - CORSエラー（当APIでは発生しないはず）
   - スクリプト読み込みエラー
   - JavaScript構文エラー

2. **ネットワークタブ:**
   - `/api/public/[slug]?callback=handlePropertyData` へのリクエストを探す
   - ステータスコードを確認（200であるべき）
   - リクエストをクリックしてレスポンスを表示
   - レスポンスが有効なJSONP形式か確認

3. **コンソールログ:**
   - `console.log('JSONPレスポンス:', response);` の出力を確認
   - ログが表示される場合、データは正しく読み込まれています
   - `response.error` が存在するか確認

---

## ステップ5: よくある問題と解決策

### 問題1: "Property not found" エラー
**原因:** URLのslugがデータベース内のどの物件とも一致しない
**解決策:**
- slugが正しいか確認（管理画面で確認）
- slugは大文字小文字を区別します
- ハイフン以外のスペースや特殊文字は使用できません

### 問題2: "No published data found" エラー
**原因:** 物件は存在するが、公開データがない（下書きのみ）
**解決策:**
- 管理画面に移動
- 「公開」ボタンをクリックしてデータを公開
- 数秒待ってから本番ページを更新

### 問題3: 何も表示されず、エラーもない
**考えられる原因:**
- コールバック関数がscriptタグの後に定義されている
- コールバック関数名のタイプミス
- コンテナ要素のIDが一致していない

**解決策:**
```html
<!-- 誤った順序 -->
<script src="API_URL"></script>
<script>function handlePropertyData() {}</script>

<!-- 正しい順序 -->
<script>function handlePropertyData() {}</script>
<script src="API_URL"></script>
```

### 問題4: CORSエラー（発生する可能性は低い）
**原因:** ブラウザがクロスオリジンリクエストをブロックしている
**解決策:** 当APIには `Access-Control-Allow-Origin: *` ヘッダーが含まれているため、これは発生しないはずです。発生した場合は以下を確認：
- URLスキーム（http vs https）
- ブラウザのセキュリティ設定
- 企業のファイアウォール/プロキシ

### 問題5: データが更新されない
**原因:** ブラウザまたはCDNのキャッシュ
**解決策:**
- 強制リフレッシュ: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- ブラウザキャッシュをクリア
- CDNキャッシュの有効期限（最大10分）を待つ（Cache-Control: max-age=600）

---

## ステップ6: 最小限のテストページを作成

これを `test.html` として保存し、ブラウザで開きます:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>JSONPテスト</title>
</head>
<body>
  <h1>JSONP APIテスト</h1>
  <div id="result">読み込み中...</div>

  <script>
    function handlePropertyData(response) {
      document.getElementById('result').innerHTML =
        '<pre>' + JSON.stringify(response, null, 2) + '</pre>';
    }
  </script>

  <script src="https://your-app.vercel.app/api/public/YOUR-SLUG?callback=handlePropertyData"></script>
</body>
</html>
```

これが動作するのに本番サイトが動作しない場合:
- 動作するテストページと本番コードを比較
- JavaScriptの競合を確認
- 他のスクリプトが干渉していないか確認

---

## ステップ7: サーバーサイド検証

**データベースを直接確認:**

Neon PostgreSQLコンソールにアクセスできる場合:

```sql
-- 物件が存在するか確認
SELECT id, name, slug, "siteUrl"
FROM properties
WHERE slug = 'your-slug';

-- 公開データが存在するか確認
SELECT pd.id, pd.version, pd."isPublished", pd."createdAt"
FROM property_data pd
JOIN properties p ON p.id = pd."propertyId"
WHERE p.slug = 'your-slug'
ORDER BY pd."createdAt" DESC;
```

**期待される結果:**
- 一致するslugを持つ物件が存在する
- `isPublished = true` の `property_data` レコードが少なくとも1つ存在する

---

## ステップ8: Vercelデプロイメントログを確認

1. Vercel Dashboardに移動
2. プロジェクトを選択
3. デプロイメントをクリック
4. "Runtime Logs" を確認
5. `/api/public/[slug]` に関連するエラーを探す

**よくあるログエラー:**
- データベース接続タイムアウト
- Prismaクエリエラー
- 環境変数が見つからない

---

## クイックチェックリスト

- [ ] 物件データが公開されている（下書きのままでない）
- [ ] API URLが正しく、適切なslugが使用されている
- [ ] コールバック関数名が関数定義とURLの両方で一致している
- [ ] コールバック関数がscriptタグより前に定義されている
- [ ] コンテナ要素のIDが一致している（`property-outline`）
- [ ] ブラウザコンソールにエラーが表示されていない
- [ ] ネットワークタブでAPIリクエストのステータスが200
- [ ] APIレスポンスが有効なJSONP形式である
- [ ] 他のスクリプトとのJavaScript競合がない

---

## サポートを受けるには

上記のすべてのステップを試しても問題が解決しない場合:

1. **APIエンドポイントを直接テスト**し、正確なレスポンスをメモする
2. **ブラウザコンソール**でエラーを確認し、メモする
3. **以下の情報を提供:**
   - 読み込もうとしている物件のslug
   - 使用している完全なAPI URL
   - ブラウザコンソールのエラー（あれば）
   - ネットワークタブのレスポンス（完全なレスポンスをコピー）
   - 管理画面でデータが公開されているかどうか

---

## 成功の基準

統合が正しく動作していることを確認できる条件:
1. APIのURLを直接開くと、`handlePropertyData(` で始まるJSONPレスポンスが表示される
2. ブラウザコンソールに "JSONPレスポンス: {データを含むオブジェクト}" がログ出力される
3. 物件データがページに正しく表示される
4. ブラウザコンソールにエラーが表示されない
5. ネットワークタブでAPIリクエストのステータスが200である
