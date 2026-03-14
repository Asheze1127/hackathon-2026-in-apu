# 技術スタック：Decision Path

---

## 0. 前提定義

| 項目 | 内容 |
| --- | --- |
| プロダクト種別 | Web アプリケーション（キャリアパス提示 / 人生ログ管理） |
| 想定ユーザー規模 | ハッカソン期間中のデモ利用 / 数名〜数十名程度 |
| 可用性目標 | ハッカソン発表まで動けば十分（短時間のダウンは許容） |
| セキュリティ要件 | LLM API キーはサーバー側で管理（クライアント露出なし） |
| パフォーマンス要件 | AI チャットはストリーミングで体感レスポンスを改善する |
| チーム体制 | hinata・tsubasa の 2 名 / Front: tsubasa(main) hinata(sub) / Back: hinata(main) tsubasa(sub) |
| 予算制約 | 最低限で運用する方針 |

---

## 1. フロントエンド

| 項目 | 採用技術 | 採用理由 |
| --- | --- | --- |
| 言語 | TypeScript | 型安全性 |
| フレームワーク | Next.js | 現時点で最も普及している TS フレームワーク / App Router で Server Actions も使える |
| UI ライブラリ | shadcn/ui | Tailwind CSS ベースで高品質なコンポーネントを迅速に利用できる |
| 状態管理 | なし | MVP スコープでは不要な複雑性を避ける |
| ツリー可視化 | React Flow | 意思決定ツリーのノード・エッジ描画に特化したライブラリ |
| Linter / Formatter | Biome | コードの一貫性を保つ / 設定が軽量 |

---

## 2. バックエンド

| 項目 | 採用技術 | 採用理由 |
| --- | --- | --- |
| 基盤 | Supabase | DB・認証・ストレージをまとめて提供 / ハッカソンの速度に最適 |
| API | Next.js Route Handlers | フロントと同一リポジトリで完結 / サーバーサイド処理を簡潔に書ける |
| ORM | Prisma | TypeScript フレンドリー / Supabase（PostgreSQL）との相性が良い |
| 認証 | Supabase Auth | メール認証 / OAuth をすぐに使える / JWT 発行も組み込み |
| AI 呼び出し | Vercel AI SDK | ストリーミング対応 / Amazon Bedrock 経由で LLM を呼び出す |

---

## 3. データベース

| 項目 | 採用技術 | 採用理由 |
| --- | --- | --- |
| メイン DB | Supabase（PostgreSQL） | Supabase に内包 / Prisma で型安全にアクセスできる |
| 類似検索（Nice to have） | pgvector | PostgreSQL 拡張として Supabase 上で有効化でき、別サービス不要 |

---

## 4. インフラ / DevOps

| 項目 | 採用技術 | 採用理由 |
| --- | --- | --- |
| ホスティング | Vercel | Next.js との親和性が最高 / デプロイが簡単 |
| BaaS | Supabase | DB・認証・ストレージを一括管理 |
| CI/CD | GitHub Actions | Linter / Formatter / 型チェックを実行 |
| ログ管理 | Vercel Logs / Supabase Logs | 追加設定なしで利用できる |

---

## 5. セキュリティ

| 項目 | 方針 |
| --- | --- |
| 認証方式 | Supabase Auth が発行する JWT を使用 |
| 認可 | MVP は `USER` ロールのみ。自分のリソースのみ書き込み・削除可能 |
| Row Level Security | Supabase の RLS ポリシーでユーザーごとのデータアクセスを制限 |
| 通信 | HTTPS 必須（Vercel / Supabase いずれもデフォルトで対応） |
| シークレット管理 | LLM API キーは Vercel の環境変数で管理し、クライアントには一切露出しない |
