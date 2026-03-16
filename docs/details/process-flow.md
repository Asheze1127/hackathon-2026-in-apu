# 処理フロー設計：Decision Path

---

## 0. 前提

| 項目 | 内容 |
| --- | --- |
| 認証 | Supabase Auth |
| UI 基盤 | Next.js App Router |
| 書き込み | Server Actions 中心 |
| リアルタイム | Supabase Realtime |
| AI 用途 | タグ付け、ロールモデル比較助言、擬似人格応答 |

---

## 1. 全体フロー

```mermaid
flowchart LR
    A[ログイン / 新規登録]
    B[オンボーディング開始]
    C[質問 2 問]
    D[プロフィール入力]
    E[ホーム]
    F[ノード追加 / 差し込み]
    G[未来候補を見る]
    H[ロールモデル比較]
    I[AI相談 / DM]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    H --> I
```

---

## 2. オンボーディング

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as フロント
    participant Action as submitOnboardingForm
    participant DB as Supabase
    participant AI as Campus/OpenAI互換

    User->>FE: 2つの質問に回答
    FE->>FE: sessionStorage に draft 保存
    User->>FE: 名前とプロフィールを入力
    FE->>Action: submitOnboardingForm
    Action->>AI: present / reason を渡してタグ付け
    Action->>DB: profiles を upsert
    Action->>DB: ルートノードを insert
    Action->>DB: profiles.onboarded = true
    Action-->>FE: 完了
    FE-->>User: /onboarding/done -> / へ遷移
```

---

## 3. ホームの木

### 3-1. 初期表示

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Page as /
    participant Helper as listUserTreeNodes
    participant DB as Prisma/Supabase

    User->>Page: ホームを開く
    Page->>Helper: 自分の木を取得
    Helper->>DB: nodes を親から順に取得
    DB-->>Helper: ノード一覧
    Helper-->>Page: Graph 用データ
    Page-->>User: 木を表示
```

### 3-2. ノード追加

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Graph as ホーム UI
    participant Action as addNode
    participant AI as Campus/OpenAI互換
    participant DB as Prisma/Supabase

    User->>Graph: 未来 or 過去追加を開く
    Graph->>Action: addNode
    Action->>AI: concreteAnswer / abstractAnswer を渡してタグ付け
    Action->>DB: nodes を insert / 差し込み更新
    Action-->>Graph: 保存済みノード
    Graph-->>User: router.refresh で木を再描画
```

### 3-3. 未来候補

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Graph as ホーム UI
    participant Action as getFutureSuggestions
    participant DB as Prisma

    User->>Graph: ノード本体をクリック
    Graph->>Action: getFutureSuggestions(nodeId)
    Action->>DB: 自分のノードタグを取得
    Action->>DB: 他ユーザーの一致ノードとその子孫を検索
    Action-->>Graph: 最大5本、最大3手先の候補
    Graph-->>User: ピンクの予測ノードをオーバーレイ表示
```

---

## 4. ロールモデル比較

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as ホーム or /profile/[uid]
    participant Action as generateRoleModelAdvice
    participant DB as Prisma/Supabase
    participant AI as Campus/OpenAI互換

    User->>FE: AIアドバイスを押す
    FE->>Action: targetUserId を送る
    Action->>DB: role_model_selections を確認
    Action->>DB: 自分とロールモデルの木を取得
    Action->>AI: 木と重なりタグを渡して助言生成
    Action-->>FE: currentPosition / nextStep / preparation / pitfalls
    FE-->>User: 比較カードを表示
```

---

## 5. チャット

### 5-1. 人間 DM

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as /chat/user/[uid]
    participant Helper as getOrCreateUserDmRoomForCurrentUser
    participant DB as Prisma/Supabase

    User->>FE: DMを送る
    FE->>Helper: room を再利用または作成
    Helper->>DB: 既存 room 検索
    alt 既存 room がある
        DB-->>Helper: roomId
    else
        Helper->>DB: chat_rooms / chat_room_members 作成
        DB-->>Helper: roomId
    end
    FE-->>User: /chat/[roomId] に遷移
```

### 5-2. room 会話

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Client as chat-room-view
    participant DB as Supabase
    participant RT as Supabase Realtime

    User->>Client: メッセージ送信
    Client->>DB: messages に insert
    DB-->>Client: 保存済みメッセージ
    RT-->>Client: postgres_changes INSERT
    RT-->>Client: typing broadcast
    Client-->>User: 新着と入力中表示を更新
```

### 5-3. AI相談

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Client as rolemodel-ai-chat-view
    participant Action as generateRoleModelReply
    participant AI as Campus/OpenAI互換

    User->>Client: 質問を入力
    Client->>Action: message + history を送信
    Action->>AI: persona prompt と履歴を渡す
    AI-->>Action: 応答
    Action-->>Client: 返答テキスト
    Client-->>User: その場で会話を継続
```

---

## 6. エラー処理

| ケース | 対応 |
| --- | --- |
| 未認証 | `UNAUTHORIZED` を返し、画面側で `/auth/login` へ誘導 |
| 入力不正 | `VALIDATION_ERROR` を表示 |
| 他人のノード操作 | `FORBIDDEN` |
| ノード / プロフィール未存在 | `NODE_NOT_FOUND` / `PROFILE_NOT_FOUND` |
| AI 応答失敗 | 画面上に再試行可能なメッセージを表示 |

---

## 7. 実装メモ

- ホームのロールモデル比較カードはモバイルで compact 表示
- 未来候補の補助パネルは desktop のみ。モバイルでは予測ノードだけ表示
- チャットは WebRTC ではなく Supabase Realtime
