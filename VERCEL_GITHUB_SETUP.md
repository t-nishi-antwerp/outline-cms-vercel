# Vercel と GitHub の接続手順

GitHubリポジトリが作成され、コードがpushされました！
次に、VercelプロジェクトとGitHubリポジトリを接続します。

## リポジトリ情報

**GitHubリポジトリ:** https://github.com/t-nishi-antwerp/outline-cms-vercel

---

## Vercel Dashboardでの接続手順

### 方法1: Vercelプロジェクトの設定から接続（推奨）

1. **Vercel Dashboardを開く**
   - https://vercel.com/dashboard にアクセス
   - プロジェクト一覧から `outline-cms-vercel` を選択

2. **Settings タブに移動**
   - 画面上部の「Settings」をクリック

3. **Git セクションを探す**
   - 左サイドバーの「Git」をクリック
   - または「General」タブ内の「Git Repository」セクション

4. **GitHubリポジトリを接続**
   - 「Connect Git Repository」または「Connect」ボタンをクリック
   - GitHub連携を許可（初回のみ）
   - リポジトリ `t-nishi-antwerp/outline-cms-vercel` を選択
   - 「Connect」をクリック

5. **Production Branchを設定**
   - Production Branch: `main`
   - これで、`main` ブランチへのpushが自動デプロイされます

---

### 方法2: 新規インポート（既存プロジェクトを置き換え）

既存のVercelプロジェクトをGitHub連携版に置き換える場合：

1. **Vercel Dashboardを開く**
   - https://vercel.com/dashboard にアクセス

2. **新しいプロジェクトをインポート**
   - 「Add New...」→「Project」をクリック
   - 「Import Git Repository」を選択

3. **GitHubリポジトリを選択**
   - `t-nishi-antwerp/outline-cms-vercel` を探してクリック
   - 「Import」をクリック

4. **プロジェクト設定**
   - Project Name: `outline-cms-vercel` （または任意）
   - Framework Preset: `Next.js`
   - Root Directory: `.` （デフォルト）
   - Build Command: `npm run build` （自動検出）
   - Output Directory: `.next` （自動検出）

5. **環境変数を設定**
   必須の環境変数を追加：

   ```
   DATABASE_URL=your-neon-database-url
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your-admin-password
   ```

6. **Deploy をクリック**
   - デプロイが開始されます
   - 完了後、本番URLが表示されます

7. **古いプロジェクトを削除（オプション）**
   - 古い `outline-cms-vercel` プロジェクトの Settings → Advanced → Delete Project

---

## 接続後の確認事項

### 1. 自動デプロイの確認

接続後、以下のようになります：

- ✅ `main` ブランチへのpush → 自動的に本番環境にデプロイ
- ✅ プルリクエスト作成 → 自動的にプレビュー環境を作成
- ✅ コミット履歴がVercel Dashboardに表示される

### 2. テストpush

接続を確認するため、小さな変更をpushしてみます：

```bash
# READMEを更新
echo "# Property Outline CMS" > README.md
git add README.md
git commit -m "docs: READMEを追加"
git push origin main
```

Vercel Dashboardで自動デプロイが開始されることを確認してください。

### 3. デプロイメントログの確認

Vercel Dashboard → プロジェクト → Deployments で：
- 各コミットのデプロイ履歴が表示される
- ビルドログを確認できる
- エラーがある場合、ログで詳細を確認

---

## トラブルシューティング

### GitHub連携が表示されない場合

1. **GitHub App のインストールを確認**
   - https://github.com/settings/installations
   - 「Vercel」アプリを探す
   - リポジトリアクセスを確認・設定

2. **Vercelで再接続**
   - Vercel Dashboard → Settings → Git
   - 「Reconnect」または「Configure」をクリック

### 環境変数が消えている場合

新規インポートした場合、環境変数を再設定する必要があります：
- Vercel Dashboard → Settings → Environment Variables
- 以下の5つの環境変数を追加：
  1. `DATABASE_URL`
  2. `NEXTAUTH_URL`
  3. `NEXTAUTH_SECRET`
  4. `ADMIN_EMAIL`
  5. `ADMIN_PASSWORD`

### ビルドエラーが発生する場合

1. **Prisma Generateコマンドの確認**
   - `package.json` の `build` スクリプトを確認：
   ```json
   "build": "prisma generate && next build"
   ```

2. **Node.jsバージョンの確認**
   - Vercel Dashboard → Settings → General
   - Node.js Version: `20.x` (推奨)

---

## 今後の開発フロー

GitHub接続後の通常の開発フローは：

1. **ローカルで開発**
   ```bash
   # 機能追加・バグ修正
   git add .
   git commit -m "feat: 新機能を追加"
   ```

2. **GitHubにpush**
   ```bash
   git push origin main
   ```

3. **自動デプロイ**
   - Vercelが自動的に検出してデプロイ開始
   - 数分後、本番環境に反映

4. **確認**
   - デプロイ完了通知を確認
   - 本番URLで動作確認

---

## まとめ

✅ GitHubリポジトリ作成済み: https://github.com/t-nishi-antwerp/outline-cms-vercel
✅ コードをGitHubにpush済み
⏳ Vercel Dashboard で手動接続が必要

上記の手順に従って、Vercel DashboardでGitHub連携を設定してください。
