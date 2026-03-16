# 権限制御設計：Decision Path

---

## 0. 前提

現行 MVP ではロール概念は持たず、基本的に **認証済みユーザー = 1 権限** で扱う。

ただし、操作対象が「自分のデータか / 他人の公開データか / chat room の member か」で制御を分けている。

---

## 1. 認証

| 項目 | 内容 |
| --- | --- |
| 認証基盤 | Supabase Auth |
| セッション取得 | Server Component / Server Action / Supabase client |
| 未認証時 | `/auth/login` へ誘導、または `UNAUTHORIZED` |

---

## 2. 認可方針

### 2-1. 自分だけが操作できるもの

- オンボーディング保存
- 自分のプロフィール編集
- 自分の木へのノード追加 / 更新 / 削除
- 自分のロールモデル保存 / 解除

### 2-2. 他ユーザーの公開情報として見られるもの

- `/profile/[uid]` のプロフィール
- ロールモデル一覧
- 他ユーザーの公開タイムライン / ツリー
- 未来候補として表示される他ユーザー由来の経路

前提:

- `profiles.onboarded = true` のユーザーのみ表示対象にする

### 2-3. room membership が必要なもの

- `/chat/[roomId]`
- room に属するメッセージ履歴

server side で `chat_room_members` を確認し、非所属なら表示しない。

---

## 3. Action ごとの制御

| 処理 | 制御 |
| --- | --- |
| `submitOnboardingForm` | current user 必須 |
| `updateProfileSettings` | current user の `profiles.id` のみ更新 |
| `addNode` / `updateNode` / `deleteNode` | `node.userId === currentUserId` を確認 |
| `getFutureSuggestions` | 選択ノードの owner が current user であることを確認 |
| `saveRoleModelSelection` | 自分自身の保存を禁止 |
| `generateRoleModelAdvice` | 自分が保存済みのロールモデルだけ比較可能 |
| `generateRoleModelReply` | 自分自身への AI相談は禁止 |
| `getOrCreateUserDmRoomForCurrentUser` | 自分自身との DM 作成は禁止 |

---

## 4. 現在の弱い点

| 項目 | 状態 |
| --- | --- |
| chat の DB レベル認可 | まだ弱い |
| `messages` insert | client 直 insert が残っている |
| Storage policy | bucket ごとの policy 設定が必要 |
| admin / moderation | 未実装 |

---

## 5. 将来の強化候補

1. `messages` 送信を server action 経由に寄せる
2. chat 周辺の RLS を強化する
3. 公開 / 非公開プロフィールの切り替えを導入する
4. 運営向けの moderation 権限を追加する
