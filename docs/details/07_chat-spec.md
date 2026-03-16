# チャット仕様書：Decision Path

---

## 0. 目的

Decision Path の会話体験は、現行実装では次の 3 本で構成する。

1. 実ユーザー同士の 1対1 DM
2. goal ベースの community room
3. ロールモデル擬似人格との AI相談

このうち **1 と 2 は room ベース**、**3 は room を持たない専用画面** である。

---

## 1. 現行実装の前提

| 項目 | 内容 |
| --- | --- |
| フロントエンド | Next.js App Router |
| DB | Supabase PostgreSQL |
| ORM | Prisma |
| 認証 | Supabase Auth |
| リアルタイム | Supabase Realtime |
| メッセージ送信 | Supabase JS から `messages` へ insert |
| 入力中表示 | Supabase Realtime の `broadcast` |

重要:

- これは **RTC = WebRTC / P2P 通信** ではない
- 実態は **Supabase Realtime を使った server-mediated realtime chat**

---

## 2. 画面とルート

| 画面 | URL | 役割 |
| --- | --- | --- |
| チャット一覧 | `/chat` | 自分の所属 room 一覧 |
| チャット詳細 | `/chat/[roomId]` | room ベースの会話 |
| 実ユーザーDM導線 | `/chat/user/[uid]` | 1対1 room を再利用 / 作成して redirect |
| AI相談 | `/chat/model/[uid]` | ロールモデル擬似人格との対話 |

---

## 3. room ベース会話の仕様

### 3-1. 対象

- 実ユーザー同士の 1対1 DM
- community room

### 3-2. 使用テーブル

| テーブル | 役割 |
| --- | --- |
| `chat_rooms` | room 本体 |
| `chat_room_members` | room と user の所属関係 |
| `messages` | メッセージ本文 |

### 3-3. room_type

現行の room 種別は次の 2 つ。

| `room_type` | 用途 |
| --- | --- |
| `dm_model` | 既定の mentor room と実ユーザー 1対1 DM の両方で使用 |
| `community` | goal ベースのコミュニティ |

注意:

- 実ユーザー DM 専用の `dm_user` type は **まだ導入していない**
- 人間 DM かどうかは、room 解決時に `peerProfile` が付くかどうかで UI を分けている

---

## 4. 一覧表示仕様

### 4-1. `/chat`

初回表示時に server side で次を行う。

1. `ensureChatRoomsForCurrentUser()` を実行
2. 必要なら既定 mentor room を補完
3. `goal` があれば community room を補完
4. `listChatRoomsForCurrentUser()` で membership 付き room 一覧を返す

### 4-2. 一覧カードの表示

| 条件 | 表示タイトル | 表示サブ情報 |
| --- | --- | --- |
| peerProfile がある | 相手ユーザー名 | 相手の職業または最新メッセージ |
| `room_type = dm_model` かつ peerProfile なし | room 名 | mentor 用の説明文または最新メッセージ |
| `room_type = community` | room 名 | `goal` または最新メッセージ |

---

## 5. room 詳細仕様

### 5-1. `/chat/[roomId]`

表示前に server side で次を行う。

1. `getChatRoomForCurrentUser(roomId)` で membership を確認
2. 非所属なら `notFound`
3. `listMessagesForRoom(roomId)` で `createdAt asc` の履歴を返す

### 5-2. メッセージ送信

client component 側で次を実行する。

```ts
supabase.from("messages").insert({
  room_id,
  sender_id: currentUserId,
  content,
})
```

### 5-3. 新着同期

`chat-room-view.tsx` では `room:${roomId}:messages` channel を作り、次を購読する。

- `postgres_changes` on `messages` `INSERT`
- `broadcast` event `typing`

### 5-4. 入力中表示

- payload: `{ userId, roomId, isTyping }`
- broadcast 受信後、一定時間だけ `入力中...` を表示
- 表示文言は peerProfile の有無で出し分ける

---

## 6. AI相談仕様

### 6-1. `/chat/model/[uid]`

AI相談は room を作らない。

構成:

- 初回表示時に `getRoleModelChatPersona(uid)` で persona prompt を構築
- client 側で会話履歴を state 保持
- 送信時に `generateRoleModelReply()` を呼び、AI 応答を返す

### 6-2. 文脈

AI に渡す主な材料:

- 公開プロフィール
- 意思決定ツリー
- タイムライン由来の要約
- 直近の会話履歴（最大 16 message）

### 6-3. 保存

- AI相談の会話履歴は DB 保存しない
- 画面を離れるとその場の履歴は消える

---

## 7. 実ユーザーDM導線

### 7-1. `/chat/user/[uid]`

処理:

1. `getOrCreateUserDmRoomForCurrentUser(uid)` を呼ぶ
2. 既存 room があれば再利用
3. 無ければ `chat_rooms` と `chat_room_members` を作成
4. `/chat/[roomId]` に redirect

### 7-2. 制約

- 自分自身には遷移させない
- 相手の `profiles.onboarded` が false なら作成しない

---

## 8. アクセス制御

現行方針は DB 側の厳密な認可より、アプリケーション側制御が中心。

### 実施していること

- チャット一覧は `chat_room_members.user_id = currentUserId` で絞る
- room 詳細は membership を server side で確認する
- AI相談は `targetUserId === currentUserId` を弾く

### まだ弱い点

- `messages` insert は client から直接行っている
- DB レベルで `sender_id = auth.uid()` を保証していない
- RLS の強化は今後の改善項目

---

## 9. 既知の技術的負債

| 項目 | 現状 |
| --- | --- |
| 実ユーザー DM の room_type | `dm_model` を流用している |
| AI相談の永続化 | なし |
| 既読 / unread | `unreadCount` は常に 0 |
| 添付ファイル | 未対応 |
| RLS 強化 | 未着手 |

将来的に整理するなら:

1. `dm_user` を分ける
2. `messages` 送信を server action 経由に寄せる
3. unread と read receipt を導入する
