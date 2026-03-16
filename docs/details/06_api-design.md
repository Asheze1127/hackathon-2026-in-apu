# API / Server Action 設計書：Decision Path

---

## 0. 前提

現行実装は、広い REST API 群ではなく **Next.js App Router の Server Actions と server helper** を中心に構成している。

整理するとインターフェースは 3 種類ある。

| 種別 | 用途 | 例 |
| --- | --- | --- |
| Server Action | フォーム送信・ミューテーション | ノード追加、オンボーディング保存、ロールモデル保存 |
| Server Helper | Server Component からの読み取り | ホームの木取得、ロールモデル一覧、チャット一覧 |
| Supabase Client + Realtime | チャット本文送信・購読 | `messages` への insert、`postgres_changes` 購読 |

共通エラー形式は次の形で扱う。

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "説明"
  }
}
```

---

## 1. インターフェース一覧

### 1-1. ノード系

| 種別 | 名前 | ファイル | 役割 |
| --- | --- | --- | --- |
| Action | `addNode` | `web/actions/nodes/actions.ts` | 未来 / 過去 / 差し込み追加。保存時に AI タグ付けも行う |
| Action | `updateNode` | `web/actions/nodes/actions.ts` | ノード内容または親子関係の更新 |
| Action | `deleteNode` | `web/actions/nodes/actions.ts` | ノード削除 |
| Action | `getUserTree` | `web/actions/nodes/actions.ts` | 自分の木またはサブツリー取得 |
| Action | `getFutureSuggestions` | `web/actions/nodes/actions.ts` | タグ部分一致から未来候補を返す |
| Helper | `listUserTreeNodes` | `web/lib/user-tree.ts` | 木データを深さ付きで取得 |
| Helper | `buildGraphTreeData` | `web/lib/user-tree.ts` | React Flow 向けノード / エッジ整形 |

### 1-2. オンボーディング / プロフィール

| 種別 | 名前 | ファイル | 役割 |
| --- | --- | --- | --- |
| Action | `submitOnboardingForm` | `web/app/(main)/(onboarding)/onboarding/actions.ts` | 質問 2 問 + プロフィールをまとめて保存し、初期ノードを作る |
| Action | `updateProfileSettings` | `web/app/(main)/(app)/profile/actions.ts` | 自分のプロフィール更新 |

### 1-3. ロールモデル

| 種別 | 名前 | ファイル | 役割 |
| --- | --- | --- | --- |
| Helper | `listRoleModels` | `web/lib/rolemodels.ts` | ロールモデル一覧を返す |
| Helper | `getRoleModelDetail` | `web/lib/rolemodels.ts` | 詳細ページ用のプロフィール / タイムライン / ツリーを返す |
| Helper | `getPrimaryRoleModelHomeCard` | `web/lib/rolemodels.ts` | ホーム左上の比較カード用データを返す |
| Action | `saveRoleModelSelection` | `web/actions/rolemodels/actions.ts` | ロールモデル保存と `isPrimary` 切り替え |
| Action | `deleteRoleModelSelection` | `web/actions/rolemodels/actions.ts` | ロールモデル保存解除 |
| Action | `generateRoleModelAdvice` | `web/actions/rolemodels/actions.ts` | 自分の木と主ロールモデルの木を比較して AI 助言を返す |
| Action | `generateRoleModelReply` | `web/actions/rolemodel-chat/actions.ts` | ロールモデル擬似人格の返答生成 |

### 1-4. チャット

| 種別 | 名前 | ファイル | 役割 |
| --- | --- | --- | --- |
| Helper | `ensureChatRoomsForCurrentUser` | `web/lib/chat.ts` | チャット一覧表示前に既定 room を補完 |
| Helper | `listChatRoomsForCurrentUser` | `web/lib/chat.ts` | 自分の所属 room 一覧を返す |
| Helper | `getOrCreateUserDmRoomForCurrentUser` | `web/lib/chat.ts` | 他ユーザーとの 1対1 room を再利用または作成 |
| Helper | `getChatRoomForCurrentUser` | `web/lib/chat.ts` | room 詳細の membership 確認 |
| Helper | `listMessagesForRoom` | `web/lib/chat.ts` | room のメッセージ履歴取得 |
| Client | `supabase.from("messages").insert(...)` | `web/components/chat/chat-room-view.tsx` | メッセージ送信 |
| Realtime | `postgres_changes` / `broadcast` | `web/components/chat/chat-room-view.tsx` | 新着同期 / 入力中表示 |

---

## 2. Action 詳細

### 2-1. `submitOnboardingForm`

| 項目 | 内容 |
| --- | --- |
| 役割 | オンボーディング完了処理 |
| 呼び出し元 | `/onboarding/profile` |
| 入力 | `present`, `reason`, `displayName`, `avatarUrl`, `currentOccupation`, `age`, `location` |
| 必須 | `present`, `reason`, `displayName` |
| 保存先 | `profiles`, `nodes` |

処理:

1. 入力を validation
2. `present` / `reason` を AI に渡してタグ付け
3. `profiles` を upsert
4. ルートノードを 1 件 insert
5. `profiles.onboarded = true` に更新

### 2-2. `updateProfileSettings`

| 項目 | 内容 |
| --- | --- |
| 役割 | 自分のプロフィール編集 |
| 呼び出し元 | `/profile/edit` |
| 更新項目 | `display_name`, `avatar_url`, `current_occupation`, `age`, `location` |
| 備考 | 更新後に `/profile` と `/profile/edit` を revalidate |

### 2-3. `addNode`

| 項目 | 内容 |
| --- | --- |
| 役割 | 木へのノード追加 |
| 呼び出し元 | ホームの木 UI |
| モード | `append`, `insert-between`, `prepend-root` |
| AI 処理 | 保存前に `realTags` / `emotionalTags` を自動付与 |

現在の UI 上の意味:

- ノード上部: 未来追加
- ノード下部: 過去追加
- 親子の間: `insert-between`

### 2-4. `getFutureSuggestions`

| 項目 | 内容 |
| --- | --- |
| 役割 | 未来候補の検索 |
| 呼び出し元 | ホームでノード本体をクリック |
| 検索対象 | 他ユーザーの onboarded なノード |
| ロジック | `realTags` / `emotionalTags` の部分一致 |
| 上限 | 最大 5 本、各候補は最大 3 手先まで |

返却内容:

- 選択ノードのラベル
- 選択ノードに付いているタグ名
- 候補ごとのルートラベル
- 候補パス (`steps`)
- 一致元ユーザーの表示名 / 職業 / プロフィール導線

### 2-5. `saveRoleModelSelection` / `deleteRoleModelSelection`

| 項目 | 内容 |
| --- | --- |
| 保存先 | `role_model_selections` |
| 制約 | 自分自身は保存不可、主ロールモデルは 1 件まで |
| 備考 | 現行実装では raw SQL で read / write している |

### 2-6. `generateRoleModelAdvice`

| 項目 | 内容 |
| --- | --- |
| 役割 | 自分とロールモデルの木の比較助言 |
| 呼び出し元 | `/profile/[uid]` とホームの比較カード |
| 出力 | `currentPosition`, `nextStep`, `preparation[]`, `pitfalls[]` |
| 保存 | DB 保存しない。都度生成 |

AI に渡す主な文脈:

- 自分の現在ノードとタイムライン
- ロールモデルの現在ノードとタイムライン
- 現在ノード周辺のタグ重なり
- `isPrimary` 状態

### 2-7. `generateRoleModelReply`

| 項目 | 内容 |
| --- | --- |
| 役割 | AI相談画面での擬似人格応答 |
| 呼び出し元 | `/chat/model/[uid]` |
| 入力 | `targetUserId`, `message`, `history[]` |
| 備考 | room 保存は行わず、その場の会話のみ保持 |

---

## 3. Server Helper 詳細

### 3-1. ホーム

- `/` は server side で `listUserTreeNodes` を呼び、初期グラフデータを作る
- 主ロールモデルがあれば `getPrimaryRoleModelHomeCard` で比較カードを描く
- mock graph は `NEXT_PUBLIC_USE_MOCK_GRAPH_DATA=true` の場合だけ有効

### 3-2. ロールモデル詳細

- `/profile/[uid]` は `getRoleModelDetail` でプロフィール、タイムライン、ツリー、保存状態をまとめて取得
- AI相談は `/chat/model/[uid]`
- 実ユーザー DM は `/chat/user/[uid]`

### 3-3. チャット

- `/chat` は `ensureChatRoomsForCurrentUser()` のあと `listChatRoomsForCurrentUser()` を呼ぶ
- `/chat/[roomId]` は `getChatRoomForCurrentUser()` で membership を確認し、`listMessagesForRoom()` で履歴を出す

---

## 4. Realtime / クライアント直接通信

チャットだけは例外的に client 側から Supabase に接続している。

### 4-1. メッセージ送信

- client component から `messages` テーブルへ insert
- 送信後はローカル state に即反映

### 4-2. 新着同期

- `channel("room:${roomId}:messages")`
- `postgres_changes` で `messages` の `INSERT` を購読

### 4-3. 入力中表示

- Supabase Realtime の `broadcast` を利用
- payload は `userId`, `roomId`, `isTyping`

---

## 5. エラーコード

| コード | 説明 |
| --- | --- |
| `UNAUTHORIZED` | 未ログイン |
| `VALIDATION_ERROR` | 入力不正 |
| `NODE_NOT_FOUND` | ノードが存在しない |
| `PROFILE_NOT_FOUND` | プロフィールが存在しない |
| `FORBIDDEN` | 他人のデータへアクセスしようとした |
| `CIRCULAR_REFERENCE` | ノードの循環参照 |
| `ROLE_MODEL_SELECTION_NOT_FOUND` | 保存済みロールモデルが見つからない |
| `INTERNAL_ERROR` | 想定外エラー |

---

## 6. 現在の実装上の注意

- docs 上の `/api/*` は現行実装の主インターフェースではない
- チャットは WebRTC ではなく Supabase Realtime
- 実ユーザー DM と既定の mentor room は、どちらも `chat_rooms.room_type = dm_model` を使っている
- AI相談画面は chat room ではなく、専用 page + Server Action で応答を返している
