# BookMemo App（読書メモアプリ）— 100% Cursor自動生成プロジェクト

> **このリポジトリは、AIペアプログラミングツール [Cursor](https://cursor.sh) によって、
> コード・設定ファイル・ドキュメントのすべてが自動生成されたことを実証・公開するためのプロジェクトです。**
>
> - 開発者（人間）は「次に何をすべきか」を日本語で指示したのみで、ソースコードやドキュメントの記述は一切行っていません。
> - すべての設計・実装・テスト・運用・README/ARCHITECTURE.md/日報等のドキュメントもCursorが自動生成しています。
> - 本アプリ（読書メモ管理）は、そのAI自動生成プロセスのデモ・検証用の題材です。

---

## プロジェクトの目的

- **Cursorによる100%自動生成開発の実証・公開**
- AIによる設計・実装・ドキュメント生成の品質・再現性・運用性の検証
- その過程・成果をGitHubで公開し、AI開発の可能性を広く共有

---

# アプリ概要・特徴

シンプルな読書メモを管理するWebアプリケーションです。書籍のISBNを元に書誌情報を取得し、メモと一緒に保存・管理することができます。

*   **フロントエンド**: React (Vite)
*   **データベース**: Firebase Firestore
*   **認証**: Firebase Authentication

より詳細な技術スタックや設計思想については、[**ARCHITECTURE.md**](./ARCHITECTURE.md) をご覧ください。

## このリポジトリの特徴：AIによる100%のコード生成

**このプロジェクトの最も特筆すべき点は、`cursor-chats` ディレクトリ内のチャットログを除き、すべてのコード、設定ファイル、ドキュメントがCursorとの対話を通じて自動生成されたものである、という点です。**

開発者（ユーザー）は、日本語で「次に何をすべきか」を指示したのみで、ソースコードの記述は一切行っていません。

### 開発の記録

Cursorとの具体的なやり取りや、日々の開発の進捗は以下のドキュメントで確認できます。

*   `cursor-chats/`: Cursorとの対話ログ（プロンプトとAIの応答）が格納されています。
*   `doc/`: 日々の開発内容をまとめた日報が格納されています。

## セットアップ手順

### 前提条件
- Node.js
- Firebase プロジェクトの作成

### インストール
```bash
npm install
```

### 環境変数の設定
プロジェクトルートに `.env.local` ファイルを作成し、Firebaseプロジェクトの情報を記述してください。

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 開発サーバーの起動
```bash
npm run dev
```

## テスト

### ユニットテスト
```bash
npm test
```

### E2Eテスト（Cypress）
- CypressでE2Eテストを自動化
- テスト用Firebaseユーザーは自動で作成・削除
- テストは1ファイル1シナリオで分割・独立性重視

#### 実行方法
1. Firebaseサービスアカウント鍵（`serviceAccountKey.json`）をプロジェクト直下に配置（`.gitignore`済み）
2. 依存パッケージのインストール
   ```bash
   npm install
   ```
3. テスト用ユーザーの自動作成
   ```bash
   npm run setup-test-user
   ```
4. Cypressテストの実行
   - 特定ファイルのみ: `npx cypress run --spec cypress/e2e/book_add.cy.js`
   - すべて実行: `npx cypress run` または `npm run e2e`

#### 注意事項
- `serviceAccountKey.json`は**絶対にGit管理しないでください**
- テスト用ユーザーのメール・パスワードはスクリプトで変更可能
- 詳細な運用・工夫は[ARCHITECTURE.md](./ARCHITECTURE.md)や`doc/`参照

## 主な機能・設計の特徴
- 書籍・メモにタグ付与（API自動セット＋履歴サジェスト＋編集可）
- タグ履歴はFirestoreで用途別に管理し、Autocompleteで補完候補を表示
- タグ検索・フィルタは大文字小文字・全角半角を区別せず快適に利用可能
- UIはスマホ・PC両対応、タグ入力はカンマ区切りもOK
- 書影・出版社・出版日などの書誌情報も管理
- バグ・改善案・TODOは`doc/bug-feature-memo.md`で管理
- 設計・運用方針は`ARCHITECTURE.md`や日報に詳細記載

## 既知の制約・今後の課題
- 画像添付は現状未対応（Firebase Storage無料枠の制約）
- スマホのカメラ・バーコード読み取りに一部バグあり（バグメモ参照）
- Algolia等の全文検索サービス、PWA化、タグ分析機能なども今後の拡張候補

## 運用・セキュリティ履歴
- Firestoreのセキュリティルールを本番用に設定し、認証ユーザーのみ自分のデータにアクセス可能に
- ルール・インデックス・CLI認証・デプロイ手順は`firestore.rules`や`firebase.json`等で管理
- 詳細は日報や`doc/`参照

## 参考ドキュメント
- [ARCHITECTURE.md](./ARCHITECTURE.md): 設計・運用方針の詳細
- `doc/`: 日報・バグメモ・開発メモ
- `cursor-chats/`: Cursorとの対話ログ
