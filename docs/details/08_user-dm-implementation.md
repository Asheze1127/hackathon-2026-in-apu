# 実ユーザー DM 実装メモ：Decision Path

---

## 0. 目的

他ユーザーのプロフィールから 1対1 の DM を始められるようにする。

現行実装は、**既存の room 構造を流用して最短で成立させる** 方針を採っている。

---

## 1. 現在の実装状態

### 1-1. ユーザーフロー

1. ユーザー A が `/profile/[uid]` で他ユーザーのプロフィールを開く
2. `DMを送る` を押す
3. `/chat/user/[uid]` に入る
4. server side で `getOrCreateUserDmRoomForCurrentUser(uid)` を実行する
5. 既存 room があれば再利用、無ければ作成
6. `/chat/[roomId]` に redirect

### 1-2. 使用テーブル

- `chat_rooms`
- `chat_room_members`
- `messages`

新しい DM 専用テーブルは作っていない。

---

## 2. 現行データ設計

### 2-1. room_type

実装上は **実ユーザー DM も `dm_model` を使っている**。

| `room_type` | 用途 |
| --- | --- |
| `dm_model` | 既定 mentor room と人間同士の 1対1 DM |
| `community` | goal ベースのコミュニティ |

つまり、今の区別は `room_type` ではなく **member 構成と `peerProfile` の解決結果** で行っている。

### 2-2. 人間 DM の作成条件

- 作成者本人は 1 人目の member
- 相手ユーザーを 2 人目の member として追加
- room 名は固定で `1対1のDM`
- `goal` は `null`

---

## 3. 実装ファイル

| ファイル | 役割 |
| --- | --- |
| `web/app/(main)/(app)/chat/user/[uid]/page.tsx` | エントリページ。room 作成 / 再利用後に redirect |
| `web/lib/chat.ts` | room 作成 / 再利用 / 一覧取得 / 詳細取得 |
| `web/components/chat/chat-room-list.tsx` | 一覧表示。相手プロフィールがあれば人間DMとして見せる |
| `web/components/chat/chat-room-view.tsx` | room 本体表示。Realtime と入力中表示を持つ |
| `web/app/(main)/(app)/profile/[uid]/page.tsx` | `DMを送る` 導線の起点 |

---

## 4. room 作成ロジック

`getOrCreateUserDmRoomForCurrentUser(targetUserId)` の流れ:

1. current user を取得
2. `targetUserId === currentUserId` なら中断
3. `profiles.onboarded = true` の相手だけ許可
4. 既に自分と相手の両方が member になっている `dm_model` room を検索
5. あればその `roomId` を返す
6. 無ければ新しい room を作成して 2 人を member に追加

### 検索条件

- `roomType = dm_model`
- members に current user が含まれる
- members に target user が含まれる

---

## 5. UI 上の見せ方

### 5-1. チャット一覧

一覧では room ごとに `peerProfile` を解決する。

`peerProfile` がある場合:

- タイトル: 相手の `display_name`
- 説明: 相手の `current_occupation` または最新メッセージ
- アイコン: `MessageCircle`

### 5-2. room 詳細

ヘッダーでは `peerProfile` がある場合、相手名と職業を表示する。

入力中表示も:

- 人間 DM なら `〇〇が入力中...`
- community なら `1人が入力中...`

---

## 6. 既知の制約

### 6-1. `dm_model` 流用

現実装では mentor room と人間 DM が同じ `room_type` を共有している。

問題点:

- データ上の意味が曖昧
- analytics や管理画面で区別しづらい
- 将来 unread / moderation を入れるときに条件分岐が増える

### 6-2. 一意キー未導入

昔の設計案にあった `dm_key` はまだ無い。

現在は「両 member を含む room を検索する」方式で重複を防いでいる。

### 6-3. DB 認可

message 送信は client 側から Supabase に insert しているため、RLS 強化前提ではまだ弱い。

---

## 7. 次に整理するなら

優先順は次の通り。

1. `dm_user` を追加して人間 DM を `dm_model` から分離する
2. 必要なら `dm_key` を導入して 2 人組の一意性を DB 側でも保証する
3. `messages` 送信を server action 経由に寄せる
4. unread / last_read_at を追加する

---

## 8. 結論

現行実装は「room ベースを崩さず、プロフィール起点の 1対1 DM を最短で成立させる」ことには成功している。

一方で、`dm_model` 流用は将来の整理対象なので、**今の仕様としては動作済み、設計としては暫定** という位置づけで扱う。
