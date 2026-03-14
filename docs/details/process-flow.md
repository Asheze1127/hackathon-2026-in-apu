# 処理フロー設計：Decision Path

---

## 0. 設計前提

| 項目 | 内容 |
| --- | --- |
| 対象機能 | アカウント作成 / 最初のアンケート / ホーム画面 / 自分の木を眺める / 自分の木に追加する / 自分が選択していない道を見る |
| 認証方式 | JWT Bearer トークン |
| AI 処理方針 | LLM API 呼び出しはストリーミングで返却 |

---

## 1. 全体フロー概要

```mermaid
flowchart LR
    A[アカウント作成] --> B[最初のアンケート\n今までの具体的な判断を取得する]
    B --> C[ホーム画面]
    C --> D[自分の木を眺める]
    D --> E[自分の木に追加する]
    D --> F[自分が選択していない道を見る]
```

---

## 2. アカウント作成フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as フロントエンド
    participant API as バックエンド API
    participant DB as データベース

    User->>FE: メールアドレス・パスワードを入力
    FE->>API: POST /auth/register
    API->>DB: ユーザー情報を保存
    DB-->>API: 保存完了
    API-->>FE: JWT トークン発行
    FE-->>User: 最初のアンケート画面へ遷移
```

---

## 3. 最初のアンケートフロー

> 今までの具体的な判断（ターニングポイント・選択）を取得する。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as フロントエンド
    participant API as バックエンド API
    participant DB as データベース

    User->>FE: アンケート（これまでの意思決定）を入力
    Note right of User: 例）高校 → 大学進学 YES\n大学 → インターン YES → 就職
    FE->>API: POST /users/me/life-logs（複数件）
    API->>DB: 意思決定ログをまとめて保存
    DB-->>API: 保存完了
    API-->>FE: 成功レスポンス
    FE-->>User: ホーム画面へ遷移
```

---

## 4. ホーム画面

ホーム画面ではユーザーが以下の操作に進める起点となる。

| 操作 | 遷移先 |
| --- | --- |
| 自分の木を見る | 自分の木を眺める画面 |
| ロールモデルを探す | ロールモデル検索（将来拡張） |

---

## 5. 自分の木を眺めるフロー

> ユーザー自身の意思決定ログを木構造（ツリー）で可視化して表示する。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as フロントエンド
    participant API as バックエンド API
    participant DB as データベース

    User->>FE: 「自分の木を見る」を選択
    FE->>API: GET /users/me/life-logs
    API->>DB: 自分の意思決定ログを取得
    DB-->>API: ログ一覧返却
    API-->>FE: ツリー構造データ返却
    FE-->>User: 意思決定の木をグラフで表示
```

この画面から以下の2つの操作に進める。

```mermaid
flowchart LR
    D[自分の木を眺める] --> E[自分の木に追加する]
    D --> F[自分が選択していない道を見る]
```

---

## 6. 自分の木に追加するフロー

> 新たな意思決定ログを追加し、木を育てる。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as フロントエンド
    participant API as バックエンド API
    participant DB as データベース

    User->>FE: 新しいターニングポイントと選択を入力
    Note right of User: 例）就職 → スタートアップを選んだ
    FE->>API: POST /users/me/life-logs
    API->>DB: 意思決定ログを保存
    DB-->>API: 保存完了
    API-->>FE: 成功レスポンス
    FE-->>User: 自分の木を更新して表示
```

---

## 7. 自分が選択していない道を見るフロー

> 自分が選ばなかった選択肢を選んだ場合のキャリアパターンをロールモデルデータから提示する。

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FE as フロントエンド
    participant API as バックエンド API
    participant DB as データベース

    User->>FE: 自分の木のノードで「別の道を見る」を選択
    Note right of User: 例）大学進学 NO を選んだ場合は？
    FE->>API: GET /career-paths?turning_point=xxx&choice=yyy
    API->>DB: 同じ選択をしたロールモデルのキャリアパターンを検索
    DB-->>API: 複数の分岐パターン返却
    API-->>FE: 分岐パターンデータ返却
    FE-->>User: 「選ばなかった道」のキャリア事例を表示
```

---

## 8. エラー処理方針

| ケース | 対応 |
| --- | --- |
| 認証エラー | 401 を返却 → フロントは `/login` へリダイレクト |
| 権限エラー | 403 を返却 → エラー画面を表示 |
| データなし | 404 を返却 → 「まだログがありません」を表示 |
| LLM API エラー | リトライ最大 3 回。失敗時はユーザーに「しばらくしてから再試行してください」を表示 |
| DB エラー | 500 を返却 → ログ出力 |

---
