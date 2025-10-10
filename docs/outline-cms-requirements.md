# 物件概要CMS 要件定義書

**バージョン**: 2.0  
**作成日**: 2025年10月8日  
**更新日**: 2025年10月9日  
**対象**: 複数物件の概要情報管理

---

## 1. プロジェクト概要

### 1.1 目的
複数の不動産物件の概要ページ（`.p-outline__inner`内の情報）を、HTMLを直接編集することなく、管理画面から更新できるようにする。

### 1.2 背景
- 現在は都度HTMLファイルを編集して更新している
- 複数物件を効率的に管理する必要がある
- 更新作業の効率化とヒューマンエラーの削減が必要
- 非技術者でも更新できる仕組みを構築したい

### 1.3 スコープ
- **対象範囲**: 複数物件の概要ページの `.p-outline__inner` 内のコンテンツ
- **対象外**: その他のページや要素

---

## 2. システム構成

### 2.1 アーキテクチャ概要

```
[GitHub Repository]
      ↓ (push)
[Vercel自動デプロイ]
      ↓
[管理画面 + API (Next.js 15)]
      ↓ (データベース接続)
[Vercel Postgres]
      ↓ (JSONP APIで配信)
[本番サイト (predear.jp等)]
```

### 2.2 環境

| 項目 | 詳細 |
|------|------|
| 開発環境 | ローカル (Node.js 18+) |
| デプロイ先 | Vercel |
| バージョン管理 | GitHub |
| フレームワーク | Next.js 15 (App Router) |
| データベース | Vercel Postgres (PostgreSQL) |
| 認証 | NextAuth.js v5 |
| デプロイ方法 | GitHub連携による自動デプロイ |
| CLI接続 | Claude Code からVercelに接続可能 |

---

## 3. 機能要件

### 3.1 認証・ユーザー管理機能

#### 3.1.1 認証機能
- **ログイン**
  - メールアドレス/パスワード認証
  - メール認証（2段階認証）
  - NextAuth.js v5を使用
  - セッション管理（有効期限: 24時間）
  
- **ユーザー管理**
  - ユーザー情報: ID、メールアドレス、氏名、権限（管理者/編集者）
  - ユーザーは複数の物件にアクセス可能
  - 管理者は全物件にアクセス可能
  - 編集者は紐付けられた物件のみアクセス可能

#### 3.1.2 権限管理
- **管理者権限**
  - 全物件にアクセス可能
  - ユーザーの追加・編集・削除
  - 物件の作成・編集・削除
  - 全ての編集機能にアクセス可能
  
- **編集者権限**
  - 紐付けられた物件のみ表示・編集可能
  - ユーザーの追加・削除：不可
  - 物件の作成・削除：不可
  - コンテンツの編集・公開：可能

#### 3.1.3 ユーザーと物件の紐付け
- 管理者が各ユーザーにアクセス可能な物件を設定
- ユーザーは自分に紐付けられた物件のみ表示・編集可能
- 物件ごとのアクセス権限管理

### 3.2 物件管理機能

#### 3.2.1 物件一覧
- ログイン後、アクセス可能な物件一覧を表示
- 物件カード形式で表示（物件名、最終更新日、サムネイル）
- 検索・フィルタ機能
- ソート機能（更新日順、名前順）

#### 3.2.2 物件の作成・編集・削除（管理者のみ）
- **物件作成**
  - 物件名
  - 物件識別子（URL用: 例 "ofuna"）
  - 本番サイトのURL
  - 説明・メモ
  - 作成時に以下のデフォルトセクションを自動生成：
    - 「全体概要」（固定セクション）
    - 「情報更新日」（可変セクション、デフォルトで表示）
  
- **物件編集**
  - 物件情報の編集
  - アクセス権限を持つユーザーの追加/削除
  
- **物件削除**
  - 物件データの完全削除
  - 削除前の確認ダイアログ
  - 関連する全てのバックアップ・履歴も削除

### 3.3 コンテンツ編集機能

#### 3.3.1 セクション管理

**固定セクション: 「全体概要」**
- テーブル自体の追加/削除: 不可
- 項目（行）の追加/削除/並び替え: 可
- 各項目の編集:
  - 項目名（左列）
  - 項目値（右列）
  - 複数行テキスト対応

**可変セクション: すべての販売概要系セクション・情報更新日セクション**
- セクションの追加/削除: 可
- セクション名の編集: 可
- セクションの並び替え: 可
- 各セクション内の項目追加/削除/並び替え: 可
- 各項目の編集内容は「全体概要」と同様

**テーブル（セクション）追加機能**
- 「+ 新しいセクションを追加」ボタンで新規セクション作成
- セクション作成時に入力する項目：
  - セクション名（必須）
  - 初期項目（オプション）
- 作成後は可変セクションとして扱われる

**注意**: 
- 「情報更新日」セクションは可変セクションだが、物件の新規作成時にデフォルトで生成される
- ユーザーが削除することも可能

**共通機能**
- ドラッグ&ドロップでの並び替え
- 項目の複製機能
- 一括削除機能（選択した複数項目）

#### 3.3.2 プレビュー機能

**管理画面内プレビュー**
- 編集中のデータをリアルタイムでプレビュー表示
- 本番環境と同じCSSを適用して表示
- プレビューエリアはレスポンシブ対応（PC/タブレット/スマホ表示切替）

**プレビュー用URL発行**
- 一時的なプレビュー用URLを生成
- URL形式: `https://cms.example.com/preview/{物件ID}/{一意なトークン}`
- 有効期限: 24時間
- 本番環境のデザインを完全再現
- 認証不要でアクセス可能（トークンによる保護）

#### 3.3.3 公開機能
- 「公開」ボタンクリックで即座に本番環境に反映
- 公開前の確認ダイアログ表示
- 公開履歴の自動記録（日時、ユーザー、物件）

#### 3.3.4 バックアップ・履歴管理機能

**自動バックアップ（公開時）**
- 「公開」ボタンクリック時、公開前に自動的にバックアップを作成
- バックアップ作成時のモーダルダイアログで以下を入力：
  - バックアップ名（必須）
  - 説明（オプション）
- バックアップ名の例: "2025年10月版"、"価格改定前"、"第2期販売開始前"
- バックアップ作成後、データを本番環境に公開
- 公開履歴の自動記録（日時、ユーザー、物件）

**バックアップ一覧**
- 作成日時順で表示
- 表示項目: バックアップ名、説明、作成者、作成日時
- 検索・フィルタ機能
- ソート機能（作成日時順、名前順）

**バックアップ操作**
- **プレビュー**: バックアップ内容をプレビュー表示
- **復元**: バックアップから復元（復元実行前に現在のデータを自動バックアップ）
- **コピー**: バックアップを複製して新しいバックアップとして保存
  - コピー時に新しい名前を入力
  - 元のバックアップは保持される
- **削除**: バックアップを削除（削除確認ダイアログ表示）

**変更履歴**
- 公開履歴の一覧表示（最新50件）
- 各履歴の表示項目: 公開日時、ユーザー、物件、バックアップ名、変更内容のサマリー
- 履歴からのロールバック機能

### 3.4 ユーザー管理機能（管理者のみ）

#### 3.4.1 ユーザー一覧
- 全ユーザーの一覧表示
- 表示項目: 名前、メールアドレス、権限、作成日時
- 検索・フィルタ機能

#### 3.4.2 ユーザーの追加
- 新規ユーザー作成フォーム
- 入力項目:
  - 名前（必須）
  - メールアドレス（必須）
  - パスワード（必須）
  - 権限（管理者/編集者）
  - アクセス可能な物件（編集者の場合）

#### 3.4.3 ユーザーの編集
- ユーザー情報の編集
- 権限の変更
- アクセス可能な物件の追加/削除

#### 3.4.4 ユーザーの削除
- ユーザーの削除
- 削除前の確認ダイアログ
- 削除されたユーザーの履歴は保持される

---

## 4. データ構造

### 4.1 データベーススキーマ

#### 4.1.1 users テーブル
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.2 properties テーブル
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  site_url VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.3 property_users テーブル（物件とユーザーの紐付け）
```sql
CREATE TABLE property_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, user_id)
);
```

#### 4.1.4 property_data テーブル（物件の概要データ）
```sql
CREATE TABLE property_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  version VARCHAR(20) DEFAULT '1.0',
  data JSONB NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.5 property_backups テーブル
```sql
CREATE TABLE property_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  backup_name VARCHAR(100) NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.6 property_history テーブル
```sql
CREATE TABLE property_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  summary TEXT,
  data_before JSONB,
  data_after JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.7 preview_tokens テーブル
```sql
CREATE TABLE preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 JSONデータ構造（property_data.dataカラム）

```json
{
  "version": "1.0",
  "lastUpdated": "2025-10-08T12:00:00Z",
  "updatedBy": "user-uuid",
  "sections": [
    {
      "id": "section-1",
      "type": "fixed",
      "title": "全体概要",
      "order": 1,
      "items": [
        {
          "id": "item-1",
          "label": "名称",
          "value": "プレディア大船ヒルトップ",
          "order": 1
        }
      ]
    },
    {
      "id": "section-2",
      "type": "variable",
      "title": "第2期2次先着順概要",
      "order": 2,
      "items": [...]
    },
    {
      "id": "section-3",
      "type": "variable",
      "title": "情報更新日",
      "order": 999,
      "items": [...]
    }
  ]
}
```

---

## 5. API仕様

### 5.1 認証API

#### POST /api/auth/login
- **説明**: ログイン（NextAuth.js）

#### POST /api/auth/logout
- **説明**: ログアウト

### 5.2 物件管理API

#### GET /api/properties
- **説明**: アクセス可能な物件一覧取得
- **認証**: 必要
- **レスポンス**:
```json
{
  "properties": [
    {
      "id": "uuid",
      "name": "プレディア大船ヒルトップ",
      "slug": "ofuna",
      "lastUpdated": "2025-10-08T12:00:00Z"
    }
  ]
}
```

#### POST /api/properties
- **説明**: 物件作成（管理者のみ）
- **認証**: 必要

#### PUT /api/properties/{propertyId}
- **説明**: 物件情報更新（管理者のみ）
- **認証**: 必要

#### DELETE /api/properties/{propertyId}
- **説明**: 物件削除（管理者のみ）
- **認証**: 必要

### 5.3 データ管理API

#### GET /api/properties/{propertyId}/data/current
- **説明**: 現在公開中のデータ取得
- **認証**: 不要（JSONP形式）

#### GET /api/properties/{propertyId}/data/draft
- **説明**: 下書きデータ取得
- **認証**: 必要

#### POST /api/properties/{propertyId}/data/draft
- **説明**: 下書き保存
- **認証**: 必要

#### POST /api/properties/{propertyId}/data/publish
- **説明**: 公開（draft → current）
- **認証**: 必要

### 5.4 バックアップAPI

#### GET /api/properties/{propertyId}/backups
- **説明**: バックアップ一覧取得

#### POST /api/properties/{propertyId}/backups
- **説明**: 公開時の自動バックアップ作成
- **リクエスト**:
```json
{
  "backupName": "2025年10月版",
  "description": "価格改定前のバックアップ"
}
```

#### GET /api/properties/{propertyId}/backups/{backupId}
- **説明**: 特定バックアップ取得

#### POST /api/properties/{propertyId}/backups/{backupId}/restore
- **説明**: バックアップから復元

#### POST /api/properties/{propertyId}/backups/{backupId}/copy
- **説明**: バックアップをコピー
- **リクエスト**:
```json
{
  "newBackupName": "2025年10月版（コピー）",
  "description": "オプションの説明"
}
```

#### DELETE /api/properties/{propertyId}/backups/{backupId}
- **説明**: バックアップ削除

### 5.5 プレビューAPI

#### POST /api/properties/{propertyId}/preview
- **説明**: プレビューURL生成

#### GET /api/preview/{token}
- **説明**: プレビューデータ取得

### 5.6 ユーザー管理API（管理者のみ）

#### GET /api/users
- **説明**: ユーザー一覧取得
- **認証**: 必要（管理者のみ）

#### POST /api/users
- **説明**: ユーザー作成
- **認証**: 必要（管理者のみ）
- **リクエスト**:
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "password": "password123",
  "role": "editor",
  "propertyIds": ["uuid1", "uuid2"]
}
```

#### PUT /api/users/{userId}
- **説明**: ユーザー情報更新
- **認証**: 必要（管理者のみ）

#### DELETE /api/users/{userId}
- **説明**: ユーザー削除
- **認証**: 必要（管理者のみ）

---

## 6. 本番環境への組み込み

### 6.1 本番HTMLへの実装

```html
<!-- 既存のHTMLページ内 -->
<div class="p-outline__inner">
  <div id="outline-content">読み込み中...</div>
</div>

<script>
  const PROPERTY_SLUG = 'ofuna'; // 物件識別子
  
  function loadOutlineData(data) {
    const container = document.getElementById('outline-content');
    container.innerHTML = generateHTML(data);
  }
  
  function generateHTML(data) {
    let html = '';
    data.sections.forEach(section => {
      html += `
        <section class="outline-section">
          <h2>${section.title}</h2>
          <dl>
            ${section.items.map(item => `
              <dt>${item.label}</dt>
              <dd>${item.value}</dd>
            `).join('')}
          </dl>
        </section>
      `;
    });
    return html;
  }
</script>
<script src="https://cms.example.com/api/properties/${PROPERTY_SLUG}/data/current?callback=loadOutlineData"></script>
```

---

## 7. 画面設計の指針

### 7.1 管理画面の構成

#### ログイン画面
- メール、パスワード入力
- 「ログイン」ボタンでメール認証画面へ遷移

#### メール認証画面
- 6桁の認証コード入力フォーム

#### 物件一覧画面
- ログイン後の最初の画面
- アクセス可能な物件をカード形式で表示
- 物件カードをクリックで編集画面へ遷移
- 管理者のみ「新規物件作成」ボタン表示
- 検索・フィルタ機能

#### メイン編集画面
- **ヘッダー**
  - 物件名表示
  - 物件一覧に戻るボタン
  - ユーザー情報、ログアウト
  
- **サイドバー**
  - コンテンツ編集
  - バックアップ管理
  - 変更履歴
  - 物件設定（管理者のみ）
  - ユーザー管理（管理者のみ、物件編集画面から独立）
  
- **メインエリア**
  - セクション編集フォーム
  - 「+ 新しいセクションを追加」ボタン
  
- **プレビューエリア**
  - リアルタイムプレビュー
  
- **フッター**
  - 下書き保存、プレビューURL発行、公開ボタン

#### バックアップ管理画面
- バックアップ一覧（テーブル形式）
- 各バックアップの「プレビュー」「復元」「コピー」「削除」ボタン
- コピー時のモーダルダイアログ（新しいバックアップ名を入力）

#### 公開確認モーダル
- 公開前にバックアップ名を入力
- バックアップ名（必須）
- 説明（オプション）
- 「キャンセル」と「バックアップして公開」ボタン

---

## 8. 非機能要件

### 8.1 セキュリティ

- NextAuth.js v5による認証
- パスワードはbcryptでハッシュ化
- CSRF対策
- SQL インジェクション対策（Prisma ORM使用）
- XSS対策
- レートリミット

### 8.2 パフォーマンス

- Vercelの自動最適化
- データベースクエリの最適化
- キャッシング戦略

### 8.3 可用性

- Vercelの自動スケーリング
- データベースの自動バックアップ
- 99.9%以上の稼働率（Vercel SLA）

---

## 9. 技術スタック

### 9.0 パッケージ構成（package.json）

```json
{
  "name": "property-outline-cms",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "next-auth": "^5.0.0-beta",
    "@auth/prisma-adapter": "^1.0.0",
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "zustand": "^4.4.7",
    "bcrypt": "^5.1.1",
    "@types/bcrypt": "^5.0.2",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  },
  "devDependencies": {
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 9.1 フロントエンド

| 項目 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js (App Router) | 15.x |
| 言語 | TypeScript | 5.x |
| UIライブラリ | React | 19.x |
| スタイリング | Tailwind CSS | 3.x |
| フォーム管理 | React Hook Form | 7.x |
| バリデーション | Zod | 3.x |
| 状態管理 | Zustand | 4.x |
| ドラッグ&ドロップ | @dnd-kit | 6.x+ |

### 9.2 バックエンド

| 項目 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js API Routes (App Router) | 15.x |
| 認証 | NextAuth.js v5 | 5.x |
| ORM | Prisma | 5.x |
| データベース | Vercel Postgres (PostgreSQL) | - |
| パスワードハッシュ | bcrypt | 5.x |

### 9.3 インフラ

| 項目 | 技術 |
|------|------|
| ホスティング | Vercel |
| データベース | Vercel Postgres |
| バージョン管理 | GitHub |
| デプロイ | GitHub連携自動デプロイ |

---

## 10. デプロイ

### 10.1 Vercelへのデプロイ手順

#### 初回セットアップ

1. **GitHubリポジトリ作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/property-cms.git
   git push -u origin main
   ```

2. **Vercelプロジェクト作成**
   - Vercel.comでGitHubリポジトリをインポート
   - プロジェクト設定でNext.js 15を選択
   - 環境変数を設定

3. **Vercel Postgresセットアップ**
   - Vercelダッシュボードから「Storage」→「Create Database」
   - Postgresを選択
   - 接続情報が自動的に環境変数に設定される

4. **データベースマイグレーション**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **自動デプロイ**
   - mainブランチへのpushで自動的にVercelがデプロイ

#### Claude Codeからの接続

```bash
# Vercel CLIのインストール
npm i -g vercel

# ログイン
vercel login

# プロジェクトにリンク
vercel link

# 環境変数の取得
vercel env pull .env.local

# ローカル開発
npm run dev

# デプロイ
git push origin main  # 自動デプロイ
```

### 10.2 環境変数

```env
# データベース（Vercelが自動設定）
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# NextAuth.js
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=ランダムな秘密鍵（64文字以上推奨）

# メール設定（オプション: メール認証用）
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com

# アプリケーション設定
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://www.predear.jp
```

---

## 11. 制約事項・前提条件

### 11.1 技術的制約
- Vercelのサーバーレス環境での実行
- Vercel Postgresの制限内での運用
- 同時接続ユーザー数はプランによる

### 11.2 運用上の制約
- 複数人の同時編集は排他制御で対応
- 物件数: 初期は50物件程度を想定
- バックアップの保存数: 物件ごとに最大100件
- ユーザー数: 初期は50名程度を想定
- 公開時には必ずバックアップが作成される（スキップ不可）

### 11.3 ブラウザ対応
- 管理画面: Chrome最新版、Firefox最新版、Edge最新版、Safari最新版
- 本番環境: モダンブラウザ全般

---

## 12. 今後の拡張可能性

### 12.1 Phase 2で検討可能な機能
- 画像アップロード機能
- Markdown記法のサポート
- 多言語対応
- ワークフロー（申請・承認フロー）
- リアルタイム同時編集
- 変更差分の可視化
- CSVインポート/エクスポート
- テンプレート機能

---

## 13. 開発スケジュール（参考）

| フェーズ | 期間 | 内容 |
|---------|------|------|
| 環境構築 | 1日 | Next.js 15環境、Vercel、GitHub設定 |
| データベース設計 | 1日 | Prismaスキーマ、マイグレーション |
| 認証・権限管理 | 3-4日 | NextAuth.js、ログイン、権限管理、ユーザー管理 |
| 物件管理機能 | 2-3日 | CRUD操作、一覧表示 |
| データ管理API | 2-3日 | CRUD操作、公開機能 |
| 管理画面UI | 6-8日 | 物件一覧、編集画面、ドラッグ&ドロップ、テーブル追加 |
| プレビュー機能 | 2日 | プレビュー、URL発行 |
| バックアップ機能 | 3-4日 | 自動作成、コピー、復元、一覧 |
| 本番組込JS | 1-2日 | JSONP読み込み、HTML生成 |
| テスト | 3-4日 | 機能テスト、統合テスト、権限テスト |
| デプロイ | 1日 | Vercel本番デプロイ |
| **合計** | **約4-5週間** | |

---

## 14. 参考資料

### 14.1 ドキュメント
- Next.js 15: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- NextAuth.js v5: https://authjs.dev
- Prisma: https://www.prisma.io/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres

---

**END OF DOCUMENT**