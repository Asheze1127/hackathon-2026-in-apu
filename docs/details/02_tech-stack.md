# 技術スタック：Decision Path

---

## 0. 前提

| 項目 | 内容 |
| --- | --- |
| プロダクト種別 | Web アプリ |
| 想定規模 | ハッカソン期間中のデモ利用 |
| 主要要件 | 認証、木構造 UI、AI 呼び出し、リアルタイムチャット |

---

## 1. フロントエンド

| 項目 | 採用技術 | 用途 |
| --- | --- | --- |
| 言語 | TypeScript | 型安全性 |
| フレームワーク | Next.js 16 App Router | ページ、Server Components、Server Actions |
| UI | Tailwind CSS + shadcn/ui | ベースコンポーネント |
| フォーム | React Hook Form + Zod | オンボーディング / プロフィール編集 |
| ツリー可視化 | `@xyflow/react` | 意思決定ツリー描画 |
| レイアウト補助 | `@dagrejs/dagre` | ノードの自動レイアウト |
| 画像アップロード UI | `react-dropzone` | アバター upload |

---

## 2. バックエンド / データアクセス

| 項目 | 採用技術 | 用途 |
| --- | --- | --- |
| BaaS | Supabase | Auth / DB / Storage / Realtime |
| ORM | Prisma | server side の read / write |
| 更新処理 | Next.js Server Actions | ノード追加、オンボーディング保存、ロールモデル保存など |
| 認証 | Supabase Auth | セッション管理 |
| 画像保存 | Supabase Storage | プロフィール画像 |

---

## 3. チャット / リアルタイム

| 項目 | 採用技術 | 用途 |
| --- | --- | --- |
| メッセージ保存 | Supabase Postgres (`messages`) | room 単位の会話保存 |
| 新着同期 | Supabase Realtime `postgres_changes` | 新着 message の反映 |
| 入力中表示 | Supabase Realtime `broadcast` | typing indicator |

注意:

- 現在のチャットは WebRTC ではない
- Supabase Realtime を使ったリアルタイム同期である

---

## 4. AI

| 項目 | 採用技術 | 用途 |
| --- | --- | --- |
| 共通 AI 呼び出し層 | `web/actions/ai` | provider 差分吸収 |
| provider | `campus`, `openrouter`, `gemini` | 実行環境に応じて切替 |
| 主用途 | タグ付け、ロールモデル比較助言、擬似人格応答 | 木とプロフィール文脈の利用 |

現行の主経路:

- ノード保存時のタグ付け
- オンボーディング初期タグ付け
- ロールモデル比較 AI
- ロールモデル擬似人格チャット

---

## 5. インフラ / 開発環境

| 項目 | 採用技術 | 用途 |
| --- | --- | --- |
| ホスティング | Vercel 想定 | Next.js デプロイ |
| DB / Auth / Storage | Supabase | バックエンド基盤 |
| CI 補助 | Husky + lint-staged | pre-commit チェック |
| Lint / Format | ESLint + Prettier | 静的検査 |

---

## 6. セキュリティと制約

| 項目 | 状態 |
| --- | --- |
| 秘密情報管理 | 環境変数でサーバー側保持 |
| DB アクセス | Prisma / Supabase client を併用 |
| RLS | 一部未整備。Storage policy は別設定が必要 |
| チャット送信 | client からの `messages` insert が残っている |

今後の改善候補:

1. message 送信を server action 経由に寄せる
2. chat 周辺の RLS を強化する
3. 人間 DM を `dm_model` から分離する
