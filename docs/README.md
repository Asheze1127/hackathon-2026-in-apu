# Docs Overview

このディレクトリには、Decision Path の仕様・設計メモを置く。

## 読み方

- 全体像を把握したいときは `docs/details/01_feature-list.md` から順に読む
- API の入出力を確認したいときは `docs/details/06_api-design.md` を参照する
- 実装と仕様に差分がある場合は、この README に補足メモを残す

## ドキュメント一覧

- `docs/details/01_feature-list.md` - 機能一覧
- `docs/details/02_tech-stack.md` - 技術スタック
- `docs/details/03_screen-flow.md` - 画面遷移
- `docs/details/04_permission-design.md` - 権限設計
- `docs/details/05_erd.md` - ERD
- `docs/details/06_api-design.md` - API 設計
- `docs/details/process-flow.md` - 業務・処理フロー

## AI Action Memo

フロント側には AI 呼び出しの緩衝材として `web/actions/ai/actions.ts` / `web/actions/ai/client.ts` / `web/actions/ai/types.ts` を置いている。

### 目的

- 呼び出し側は `provider` だけ切り替えれば `openrouter` と `campus` を同じ関数で扱える
- 返り値は OpenAI 互換の `choices[0].message.content` で読める形にそろえる
- API キーは Server Action 側に閉じ込め、クライアントへ露出させない

### 使い方

```ts
import { createChatCompletion } from "@/actions/ai/actions"

const result = await createChatCompletion({
  provider: "campus",
  model: "gpt-oss:120b",
  messages: [
    { role: "system", content: "回答は500文字以内で。" },
    { role: "user", content: "カレーの作り方を教えてください。" },
  ],
})

const text = result.choices[0]?.message.content ?? ""
```

### Provider ごとの吸収内容

#### `openrouter`

- `https://openrouter.ai/api/v1/chat/completions` をそのまま呼ぶ
- `messages`, `tools`, `tool_choice` をそのまま送る

#### `campus`

- 学内 GPT-OSS は OpenAI 互換の `/v1/chat/completions` ではなく、`POST /api/generate` を使う
- そのため `messages[]` を 1 本の `prompt` に変換して送る
- レスポンスの `response` を連結し、HTML entity と `<br>` を整形して `choices[0].message.content` に詰め直す
- `prompt_eval_count` / `eval_count` が返れば `usage` に変換する

### 制約

- `campus` の `/api/generate` は text generation 前提なので、`tools` / `tool_choice` はサポートしない
- `docs/details/06_api-design.md` では AI 呼び出しを OpenRouter 前提で書いているが、実装上は `provider` 切り替えで学内 GPT-OSS も利用できる

### 環境変数

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-oss-120b:free

CAMPUS_AI_BASE_URL=https://aisvr221.aikb.kyutech.ac.jp
CAMPUS_AI_API_KEY=
CAMPUS_AI_MODEL=gpt-oss:120b
```
