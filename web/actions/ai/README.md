# AI Actions

`web/actions/ai` は OpenRouter、Gemini、学内 GPT-OSS の接続差分を吸収するための緩衝材。

## Files

- `web/actions/ai/actions.ts` - Server Action の公開入口
- `web/actions/ai/client.ts` - provider ごとの API 呼び出しと正規化
- `web/actions/ai/types.ts` - 共通の OpenAI 互換型

## Purpose

- 呼び出し側は `provider` を切り替えるだけで `openrouter` `gemini` `campus` を同じ関数で扱える
- 返り値は OpenAI 互換の `choices[0].message.content` で読む
- API キーは Server Action 側に閉じ込める

## Usage

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

## Provider Notes

### `openrouter`

- `https://openrouter.ai/api/v1/chat/completions` をそのまま呼ぶ
- `messages`, `tools`, `tool_choice` をそのまま送る

### `gemini`

- Gemini API の OpenAI 互換 endpoint `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` を使う
- `messages`, `tools`, `tool_choice` をそのまま送る
- `GEMINI_MODEL` 未指定時は `gemini-2.5-flash` を使う

### `campus`

- 学内 GPT-OSS は OpenAI 互換の `/v1/chat/completions` ではなく `POST /api/generate` を使う
- `messages[]` を 1 本の `prompt` に変換して送る
- `gpt-oss` モデルでは `think=low` をデフォルトで付けて reasoning を抑える
- レスポンスの `response` を連結し、HTML entity と `<br>` を整形して `choices[0].message.content` に詰め直す
- `done_reason` が返れば `finish_reason` に反映し、`prompt_eval_count` / `eval_count` は `usage` に変換する

## Limitations

- `campus` の `/api/generate` は text generation 前提なので `tools` / `tool_choice` はサポートしない
- `campus` で tool calling が必要なら別 API か別実装が必要

## Environment Variables

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-oss-120b:free

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

CAMPUS_AI_BASE_URL=
CAMPUS_AI_API_KEY=
CAMPUS_AI_MODEL=gpt-oss:120b
CAMPUS_AI_THINK=low
```
