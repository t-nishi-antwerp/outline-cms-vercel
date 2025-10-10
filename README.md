# 物件概要CMS

不動産物件の概要情報を管理するCMSシステム

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Vercel Postgres (PostgreSQL)
- **ORM**: Prisma
- **認証**: NextAuth.js v5
- **ホスティング**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを編集して、必要な環境変数を設定してください。

```bash
# .env.exampleを参考にしてください
cp .env.example .env.local
```

### 3. データベースのセットアップ

Vercelにデプロイ後、Vercel Postgresを作成し、環境変数を設定してください。

```bash
# Vercel CLIでログイン
vercel login

# プロジェクトにリンク
vercel link

# 環境変数を取得
vercel env pull .env.local
```

### 4. Prismaのセットアップ

```bash
# Prismaクライアントを生成
npm run db:generate

# データベースにスキーマをプッシュ
npm run db:push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## スクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用ビルド
- `npm run start` - 本番サーバーを起動
- `npm run lint` - ESLintを実行
- `npm run db:generate` - Prismaクライアントを生成
- `npm run db:push` - データベースにスキーマをプッシュ
- `npm run db:migrate` - マイグレーションを作成・実行
- `npm run db:studio` - Prisma Studioを起動

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリを作成してプッシュ
2. Vercelでプロジェクトをインポート
3. Vercel Postgresを作成
4. 環境変数を設定
5. デプロイ

詳細は`docs/outline-cms-requirements.md`を参照してください。

## プロジェクト構造

```
├── docs/                    # ドキュメント
├── prisma/                  # Prismaスキーマ
│   └── schema.prisma
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/          # Reactコンポーネント
│   ├── lib/                 # ユーティリティ関数
│   │   └── prisma.ts
│   └── types/               # TypeScript型定義
├── .env.example             # 環境変数のサンプル
├── .env.local               # ローカル環境変数（gitignore）
├── next.config.ts           # Next.js設定
├── tailwind.config.ts       # Tailwind CSS設定
├── tsconfig.json            # TypeScript設定
└── package.json
```

## ライセンス

Private
