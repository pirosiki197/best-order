# Best Order

自分専用の「お店のベストオーダー」を写真付きで記録・管理し、自分だけのグルメ帳を作るWebアプリケーションです。

## 技術スタック

### フロントエンド (apps/web)
- **Framework:** React + Vite (TypeScript)
- **Routing:** React Router DOM (Single Page Application)
- **Styling:** Tailwind CSS + shadcn/ui

### バックエンド (apps/server)
- **Framework:** Hono (Cloudflare Workers)
- **Database:** PostgreSQL
- **Object Storage:** Cloudflare R2

## セットアップ

### 1. 依存関係のインストール
プロジェクトのルートディレクトリで以下を実行します。
```bash
mise install
pnpm install
```

### 2. 環境変数の設定
`apps/server/.env`ファイルを作成し、接続するPostgreSQLのデータベースURLを記述します。
```txt
DATABASE_URL="postgres://postgres:password@localhost:5432/best-order"
```

### 3. ローカル開発サーバーの起動
フロントエンドとバックエンドを同時に立ち上げます。
```bash
mise run dev
```

- フロントエンド: `http://localhost:5173`
- バックエンド: `http://localhost:8787`
