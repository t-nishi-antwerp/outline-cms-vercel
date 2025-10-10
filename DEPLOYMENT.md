# Vercelデプロイ手順

## 前提条件
- Vercelアカウント
- Neon PostgreSQLデータベース（既に設定済み）
- GitHubリポジトリ（推奨）

## 1. 環境変数の準備

Vercel Dashboardで以下の環境変数を設定してください:

### データベース接続
```bash
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_vjMPGwQ13dui@ep-sparkling-credit-a1nziwoh-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_vjMPGwQ13dui@ep-sparkling-credit-a1nziwoh.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### NextAuth.js設定
```bash
# デプロイ後のURLに変更
NEXTAUTH_URL=https://your-app.vercel.app

# 本番用のシークレットキーを生成 (64文字のランダム文字列)
# 生成コマンド: openssl rand -base64 48
NEXTAUTH_SECRET=your-random-secret-key-here
```

### アプリケーション設定
```bash
# デプロイ後のURLに変更（プレビューURL生成に使用）
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**注意:** `NEXT_PUBLIC_SITE_URL` は不要です。各物件の本番サイトURLは、物件作成・編集時に個別に設定します。

## 2. Vercelプロジェクトの作成

### GitHubからデプロイする場合（推奨）
1. GitHubにリポジトリをプッシュ
2. Vercel Dashboardで「New Project」をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定
5. 「Deploy」をクリック

### Vercel CLIでデプロイする場合
```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトディレクトリで実行
vercel

# 本番デプロイ
vercel --prod
```

## 3. ビルド設定

Vercelのビルド設定は自動検出されますが、必要に応じて以下を設定:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x 以上

## 4. データベースマイグレーション

初回デプロイ時、`build`コマンドで自動的にマイグレーションが実行されます:
```bash
prisma generate && prisma migrate deploy && next build
```

手動でマイグレーションを実行する場合:
```bash
npm run db:migrate:deploy
```

## 5. 管理者アカウントの作成

デプロイ後、管理者アカウントを作成する必要があります。

### 方法1: ローカルから本番データベースに接続
```bash
# .env.localを本番データベースURLに一時的に変更
POSTGRES_PRISMA_URL=<本番データベースURL>

# 管理者アカウント作成
npm run create-admin
```

### 方法2: Vercel CLIで実行
```bash
vercel env pull .env.production.local
npm run create-admin
```

### 方法3: SQL直接実行
Neon Dashboardから以下のSQLを実行:
```sql
INSERT INTO users (email, name, password_hash, role, created_at, updated_at)
VALUES (
  'admin@example.com',
  'Admin User',
  '$2b$10$...', -- bcryptでハッシュ化したパスワード
  'admin',
  NOW(),
  NOW()
);
```

## 6. デプロイ後の確認

1. アプリケーションが正常に起動することを確認
2. `/login` にアクセスして管理者ログイン
3. ダッシュボードで物件管理機能を確認
4. Public API (`/api/public/[slug]`) の動作確認

## 7. カスタムドメインの設定（オプション）

1. Vercel Dashboardでプロジェクトを開く
2. Settings > Domains に移動
3. カスタムドメインを追加
4. DNSレコードを設定
5. 環境変数の `NEXTAUTH_URL` と `NEXT_PUBLIC_APP_URL` をカスタムドメインに更新

## トラブルシューティング

### ビルドエラー: Prisma Client not found
→ `postinstall` スクリプトが実行されていることを確認

### 環境変数が読み込まれない
→ Vercel Dashboardで環境変数が正しく設定されているか確認

### データベース接続エラー
→ Neonデータベースが起動しているか確認
→ 接続文字列が正しいか確認

### NextAuth.js認証エラー
→ `NEXTAUTH_URL` が本番URLと一致しているか確認
→ `NEXTAUTH_SECRET` が設定されているか確認

## セキュリティチェックリスト

- [ ] `NEXTAUTH_SECRET` を本番用のランダムな値に変更
- [ ] データベース認証情報が環境変数に正しく設定されている
- [ ] 本番用の管理者アカウントを作成
- [ ] 開発用の環境変数がコミットされていないことを確認
- [ ] CORS設定が適切（Public APIは `*` で問題なし）
- [ ] HTTPS接続が有効（Vercelは自動対応）

## パフォーマンス最適化

- ISR（Incremental Static Regeneration）を活用
- 画像最適化は Next.js Image コンポーネントを使用
- CDNキャッシュを活用（Public API は 5-10分のキャッシュ設定済み）
