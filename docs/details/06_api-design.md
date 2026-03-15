# API 設計書：Decision Path

---

## 0. 設計前提

| 項目                     | 内容                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| ベース URL               | `/api` (Next.js Route Handlers)                                        |
| 認証方式                 | Supabase Auth が発行する JWT を `Authorization: Bearer <token>` で送信 |
| レスポンス形式           | `Content-Type: application/json`                                       |
| 木構造の実装方針         | 隣接リスト（`parent_id`）+ 再帰クエリで取得                            |
| AI 呼び出し              | OpenRouter 経由。すべてバックエンドのビジネスロジック内で完結する      |
| エラーレスポンス共通形式 | `{ "error": { "code": "ERROR_CODE", "message": "説明" } }`             |

### AIが関わる処理（2箇所のみ）

| #   | タイミング                        | 内容                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | ノード保存時（`POST /api/nodes`） | ユーザーの木全体を文脈としてAIに渡し、今回の「出来事」に関する深掘り質問を生成して返す |
| 2   | ノード保存時（`POST /api/nodes`） | 入力内容をもとにAIが `realTags` / `emotionalTags` を自動付与する                       |

> どちらもノード追加のビジネスロジック内で完結する。AI専用エンドポイントは不要。

### DBマスタとAPIの関係

| マスタテーブル       | フロントからの取得API | 理由                                                                                                                                      |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `concrete_questions` | **不要**              | オンボーディングは「今何をしていますか？」の固定1問。ノード追加時も自由入力（出来事を記述させる）。バックエンドでシードのIDを直接参照する |
| `abstract_questions` | **不要**              | ノード追加時の「なぜそれをしていますか？」も固定1問。同上                                                                                 |
| `tags`               | **不要**              | タグはAIが自動付与するためフロントで選ばせない                                                                                            |

---

## 1. エンドポイント一覧

| #   | メソッド | パス                 | 概要                                                        | 認証 | 優先度 |
| --- | -------- | -------------------- | ----------------------------------------------------------- | ---- | ------ |
| 1   | GET      | `/api/nodes`         | 自分の木（全ノード）を取得                                  | 必須 | P0     |
| 2   | POST     | `/api/nodes`         | ノードを追加する（AI深掘り質問生成・タグ付けを内包）        | 必須 | P0     |
| 3   | PATCH    | `/api/nodes/:nodeId` | ノードの親変更（差し込み・移動）または内容編集              | 必須 | P0     |
| 4   | DELETE   | `/api/nodes/:nodeId` | ノードを削除する                                            | 必須 | P0     |
| 5   | POST     | `/api/onboarding`    | 初回オンボーディングを完了する（1ノード保存 + profile更新） | 必須 | P0     |
| 6   | GET      | `/api/profile`       | 自分のプロフィールを取得                                    | 必須 | P0     |
| 7   | PATCH    | `/api/profile`       | プロフィール（goal等）を更新                                | 必須 | P0     |

---

## 2. エンドポイント詳細

---

### 2-1. `GET /api/nodes` — 自分の木を取得

自分のすべてのノードを取得し、フロントがツリー描画できる形で返す。  
DB では隣接リスト方式で保持しているが、**再帰クエリで全子孫を取得**し、フラットな配列として返す。フロントがツリー構造に組み立てる。

返却順序は **`depth` 昇順 → `createdAt` 昇順**（親→子の順が保証される）。同じ深さの兄弟ノードは作成日時の古い順に並ぶ。

```sql
WITH RECURSIVE node_tree AS (
  SELECT id, parent_id, concrete_answer, created_at, 0 AS depth
  FROM nodes
  WHERE user_id = $userId AND parent_id IS NULL

  UNION ALL

  SELECT n.id, n.parent_id, n.concrete_answer, n.created_at, nt.depth + 1
  FROM nodes n
  INNER JOIN node_tree nt ON nt.id = n.parent_id
)
SELECT * FROM node_tree
ORDER BY depth ASC, created_at ASC;
```

#### Request

```http
GET /api/nodes
Authorization: Bearer <token>
```

クエリパラメータ（任意）:

| パラメータ | 型            | 説明                                                   |
| ---------- | ------------- | ------------------------------------------------------ |
| `rootId`   | string (UUID) | 指定した場合、そのノードを起点とするサブツリーのみ返す |

#### Response `200 OK`

```json
{
  "nodes": [
    {
      "id": "uuid",
      "parentId": null,
      "concreteAnswer": "エンジニアとして働いている",
      "abstractAnswer": "ものづくりが好きだから",
      "realTags": ["uuid", "uuid"],
      "emotionalTags": ["uuid"],
      "createdAt": "2026-03-15T00:00:00.000Z"
    }
  ]
}
```

> `concreteQuestionId` / `abstractQuestionId` はフロントの表示には不要なため省略する。  
> 必要な場合は `include=questions` クエリパラメータで追加可能（P1）。

---

### 2-2. `POST /api/nodes` — ノードを追加する

ユーザーが新しい出来事（意思決定ログ）を木に追加する。

#### バックエンド内部の処理フロー

```
1. リクエストを受け取る
2. ユーザーの木全体を再帰クエリで取得
3. AIに「木の全文脈 + 今回の入力」を渡してタグ付けを実行
   → realTags / emotionalTags を取得
4. AIに「木の全文脈 + 今回の入力」を渡して深掘り質問を生成
5. Node を INSERT（concreteQuestionId / abstractQuestionId はバックエンドで固定シードIDを設定）
6. 生成した深掘り質問と保存したノードをまとめてレスポンス
```

> `concreteQuestionId` / `abstractQuestionId` はフロントから送らない。  
> 「今何をしていますか？」「なぜそれをしていますか？」の固定シード値をバックエンドで設定する。

#### ノードの挿入パターン

| パターン       | 説明                                      | `parentId` の値                                                       |
| -------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| **末尾追加**   | 既存ノードの子として追加（通常ケース）    | 親ノードのID                                                          |
| **ルート追加** | 木の新しいルートとして追加                | `null`                                                                |
| **差し込み**   | 「親→既存子」の間に新しいノードを挿入する | 挿入したい親のID。その後 `PATCH` で既存の子の `parentId` を付け替える |

#### Request

```http
POST /api/nodes
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "parentId": "uuid or null",
  "concreteAnswer": "エンジニアとして働いている",
  "abstractAnswer": "ものづくりが好きだから"
}
```

| フィールド       | 型             | 必須 | 説明                                               |
| ---------------- | -------------- | ---- | -------------------------------------------------- |
| `parentId`       | string \| null | ✅   | 親ノードのID。ルートノードの場合は `null`          |
| `concreteAnswer` | string         | ✅   | 「今何をしていますか？」への回答（出来事）         |
| `abstractAnswer` | string         |      | 「なぜそれをしていますか？」への回答（理由・動機） |

#### Response `201 Created`

```json
{
  "node": {
    "id": "uuid",
    "parentId": "uuid or null",
    "concreteAnswer": "エンジニアとして働いている",
    "abstractAnswer": "ものづくりが好きだから",
    "realTags": ["uuid", "uuid"],
    "emotionalTags": ["uuid"],
    "createdAt": "2026-03-15T00:00:00.000Z"
  },
  "aiQuestion": "ものづくりへの興味はいつ頃から気づきましたか？きっかけになった経験があれば教えてください。"
}
```

| フィールド   | 説明                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| `node`       | 保存されたノード（AIが付与したタグ含む）                                     |
| `aiQuestion` | AIが生成した深掘り質問。フロントはこれをユーザーに表示してリアクションを促す |

---

### 2-3. `PATCH /api/nodes/:nodeId` — ノードを更新する

ノードの親変更（差し込み・移動）や回答内容の修正に使う。

#### ユースケース

- **差し込み後の既存子ノードの親を付け替える**（`parentId` だけ変更）
- **ノードの回答を編集する**

#### Request

```http
PATCH /api/nodes/:nodeId
Authorization: Bearer <token>
Content-Type: application/json
```

変更したいフィールドのみ送る（すべて省略可）:

```json
{
  "parentId": "uuid",
  "concreteAnswer": "修正後の回答",
  "abstractAnswer": "修正後の理由"
}
```

| フィールド       | 型             | 説明                                     |
| ---------------- | -------------- | ---------------------------------------- |
| `parentId`       | string \| null | 親ノードのIDを変更する（差し込み・移動） |
| `concreteAnswer` | string         | 具体回答を修正する                       |
| `abstractAnswer` | string \| null | 抽象回答を修正する                       |

#### Response `200 OK`

```json
{
  "node": {
    "id": "uuid",
    "parentId": "uuid",
    "concreteAnswer": "修正後の回答",
    "abstractAnswer": "修正後の理由",
    "realTags": ["uuid"],
    "emotionalTags": ["uuid"],
    "createdAt": "2026-03-15T00:00:00.000Z"
  }
}
```

#### エラーケース

| ステータス | コード               | 説明                                                        |
| ---------- | -------------------- | ----------------------------------------------------------- |
| 403        | `FORBIDDEN`          | 他人のノードを操作しようとした                              |
| 404        | `NODE_NOT_FOUND`     | 指定した `nodeId` が存在しない                              |
| 422        | `CIRCULAR_REFERENCE` | `parentId` に自分自身または自分の子孫を指定した（循環参照） |

---

### 2-4. `DELETE /api/nodes/:nodeId` — ノードを削除する

指定したノードを削除する。  
**子ノードは削除しない**（子ノードの `parentId` を削除ノードの親に自動で付け替える）。

#### バックエンド内部の処理フロー

```
1. 削除対象ノードの parentId（= 「祖父」）を取得する
2. 削除対象の直接の子ノードの parentId を「祖父」に一括 UPDATE
3. 削除対象ノードを DELETE
```

#### Request

```http
DELETE /api/nodes/:nodeId
Authorization: Bearer <token>
```

#### Response `200 OK`

```json
{
  "deletedNodeId": "uuid",
  "updatedChildIds": ["uuid", "uuid"]
}
```

| フィールド        | 説明                                                  |
| ----------------- | ----------------------------------------------------- |
| `deletedNodeId`   | 削除したノードのID                                    |
| `updatedChildIds` | 親を付け替えた子ノードのIDリスト（0件の場合は空配列） |

---

### 2-5. `POST /api/onboarding` — 初回オンボーディングを完了する

初回ログイン時（S-02）専用。  
「今何をしていますか？」「なぜそれをしていますか？」への回答を1ノードとして保存し、`profile.onboarded` を `true` にする。  
通常のノード追加（`POST /api/nodes`）と異なり、AI深掘り質問の生成は行わない（初回はそのままホームへ遷移する）。

#### Request

```http
POST /api/onboarding
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "goal": "グローバルに活躍できるエンジニアになりたい",
  "concreteAnswer": "大学でコンピュータサイエンスを専攻している",
  "abstractAnswer": "ソフトウェアで社会課題を解決したいから"
}
```

| フィールド       | 型     | 必須 | 説明                                        |
| ---------------- | ------ | ---- | ------------------------------------------- |
| `goal`           | string | ✅   | ユーザーの最終目標（`profile.goal` に保存） |
| `concreteAnswer` | string | ✅   | 「今何をしていますか？」への回答            |
| `abstractAnswer` | string |      | 「なぜそれをしていますか？」への回答        |

#### バックエンド内部の処理フロー

```
1. profile.goal を UPDATE
2. Node を INSERT（parentId = null のルートノード、concreteQuestionId / abstractQuestionId はシードIDを設定）
3. AIにタグ付けを依頼して realTags / emotionalTags を Node に保存
4. profile.onboarded を true に UPDATE
5. レスポンス返却
```

`realTags` / `emotionalTags` に保存する値はタグ名ではなく `tags.id` の UUID。
ノード同士の類似検索は UUID 配列の重なりで行い、タグ名の部分一致検索が必要な場合は `tags` テーブルを先に検索して `id` を解決してから `nodes` を絞り込む。

#### Response `201 Created`

```json
{
  "profile": {
    "id": "uuid",
    "goal": "グローバルに活躍できるエンジニアになりたい",
    "onboarded": true
  },
  "node": {
    "id": "uuid",
    "parentId": null,
    "concreteAnswer": "大学でコンピュータサイエンスを専攻している",
    "abstractAnswer": "ソフトウェアで社会課題を解決したいから",
    "realTags": ["uuid"],
    "emotionalTags": ["uuid"],
    "createdAt": "2026-03-15T00:00:00.000Z"
  }
}
```

---

### 2-6. `GET /api/profile` — 自分のプロフィールを取得

#### Request

```http
GET /api/profile
Authorization: Bearer <token>
```

#### Response `200 OK`

```json
{
  "profile": {
    "id": "uuid",
    "displayName": "田中 太郎",
    "avatarUrl": "https://cdn.example.com/profiles/user-1.png",
    "currentOccupation": "ソフトウェアエンジニア",
    "age": 28,
    "location": "東京都渋谷区",
    "goal": "グローバルに活躍できるエンジニアになりたい",
    "onboarded": true,
    "createdAt": "2026-03-15T00:00:00.000Z"
  }
}
```

---

### 2-7. `PATCH /api/profile` — プロフィールを更新

`goal` と表示用プロフィール項目の変更に使う。

#### Request

```http
PATCH /api/profile
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "displayName": "田中 太郎",
  "avatarUrl": "https://cdn.example.com/profiles/user-1.png",
  "currentOccupation": "ソフトウェアエンジニア",
  "age": 28,
  "location": "東京都渋谷区",
  "goal": "起業家として独立したい"
}
```

変更したいフィールドのみ送る。`avatarUrl` / `currentOccupation` / `age` / `location` は `null` を送るとクリアできる。

| フィールド          | 型             | 説明                       |
| ------------------- | -------------- | -------------------------- |
| `displayName`       | string         | 他ユーザーに見える表示名   |
| `avatarUrl`         | string \| null | アイコン画像 URL           |
| `currentOccupation` | string \| null | 現在の職業                 |
| `age`               | number \| null | プロフィールに表示する年齢 |
| `location`          | string \| null | 現在住んでいる場所         |
| `goal`              | string \| null | ユーザーの最終目標         |

#### Response `200 OK`

```json
{
  "profile": {
    "id": "uuid",
    "displayName": "田中 太郎",
    "avatarUrl": "https://cdn.example.com/profiles/user-1.png",
    "currentOccupation": "ソフトウェアエンジニア",
    "age": 28,
    "location": "東京都渋谷区",
    "goal": "起業家として独立したい",
    "onboarded": true
  }
}
```

---

## 3. 木操作パターンまとめ

### パターンA：末尾追加（最もシンプル）

```
Before: A → B → C
After:  A → B → C → D（新規）
```

```http
POST /api/nodes
{ "parentId": "C_id", "concreteAnswer": "...", "abstractAnswer": "..." }
```

---

### パターンB：差し込み（BとCの間にXを挿入）

```
Before: A → B → C
After:  A → B → X（新規） → C
```

```http
# Step 1: XをBの子としてINSERT
POST /api/nodes
{ "parentId": "B_id", "concreteAnswer": "...", "abstractAnswer": "..." }
# → X_id が返ってくる

# Step 2: CのparentIdをX_idに変更
PATCH /api/nodes/C_id
{ "parentId": "X_id" }
```

---

### パターンC：前に追加（ルートAの前にYを挿入）

```
Before: A（root） → B → C
After:  Y（新root） → A → B → C
```

```http
# Step 1: YをrootとしてINSERT
POST /api/nodes
{ "parentId": null, "concreteAnswer": "...", "abstractAnswer": "..." }
# → Y_id が返ってくる

# Step 2: AのparentIdをY_idに変更
PATCH /api/nodes/A_id
{ "parentId": "Y_id" }
```

---

### パターンD：中間ノード削除（BをA→Cにつなぎ直して削除）

```
Before: A → B → C
After:  A → C（バックエンドが自動でつなぎ直す）
```

```http
DELETE /api/nodes/B_id
```

---

## 4. エラーコード一覧

| HTTP | コード               | 説明                                               |
| ---- | -------------------- | -------------------------------------------------- |
| 400  | `VALIDATION_ERROR`   | リクエストボディのバリデーション失敗               |
| 401  | `UNAUTHORIZED`       | JWTが未提供または期限切れ                          |
| 403  | `FORBIDDEN`          | 他人のリソースへのアクセス                         |
| 404  | `NODE_NOT_FOUND`     | ノードが存在しない                                 |
| 404  | `PROFILE_NOT_FOUND`  | プロフィールが存在しない                           |
| 422  | `CIRCULAR_REFERENCE` | 親子関係が循環してしまう操作                       |
| 500  | `INTERNAL_ERROR`     | サーバー内部エラー                                 |
| 503  | `AI_UNAVAILABLE`     | OpenRouter / LLM API が応答しない（リトライ3回後） |

---

## 5. AIプロンプト設計

### 5-1. 深掘り質問生成（`POST /api/nodes` 内部）

```
あなたはユーザーの意思決定の背景にある価値観や動機を引き出すインタビュアーです。

## ユーザーの最終目標
{profile.goal}

## これまでの意思決定の木（古い順）
1. {node1.concreteAnswer}（理由: {node1.abstractAnswer}）
2. {node2.concreteAnswer}（理由: {node2.abstractAnswer}）
...
N. {newNode.concreteAnswer}（理由: {newNode.abstractAnswer}） ← 今回追加されたノード

## タスク
上記の文脈を踏まえ、ユーザーが「なぜこの行動をしたのか」「過去の経験がどう影響しているか」を
自然に引き出せる深掘り質問を1つだけ日本語で生成してください。
質問は短く、具体的で、ユーザーが内省しやすい表現にしてください。
```

### 5-2. タグ自動付与（`POST /api/nodes` / `POST /api/onboarding` 内部）

```
以下のノード情報をもとに、適切なタグIDを選んでください。

## 入力
concreteAnswer: {concreteAnswer}
abstractAnswer: {abstractAnswer}

## 利用可能なタグ（realTags）
{realTagsList}  ← DBからバックエンドが取得して埋め込む

## 利用可能なタグ（emotionalTags）
{emotionalTagsList}  ← DBからバックエンドが取得して埋め込む

## 出力形式（JSONのみ返してください）
{
  "realTags": ["uuid", ...],
  "emotionalTags": ["uuid", ...]
}
```

> タグリストはバックエンドがDBから取得してプロンプトに埋め込む。フロントへの公開は不要。

---
