# 読書メモアプリ (BookMemo App)

[![Made with Cursor](https://img.shields.io/badge/Made%20with-Cursor-blue.svg)](https://cursor.sh)

このリポジトリは、AIペアプログラミングツール **[Cursor](https://cursor.sh)** を用いたモダンなWebアプリケーション開発の実現可能性を調査・検証するために作成されたプロジェクトです。

## プロジェクト概要

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

## セットアップと実行方法

### 前提条件

*   Node.js
*   Firebase プロジェクトの作成

### インストール

```bash
npm install
```

### 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、自身のFirebaseプロジェクトの情報を記述してください。

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

### テストの実行

```bash
npm test
```

## E2Eテスト（Cypress）について

### 仕組み・概要
- 本プロジェクトでは、Cypressを用いてE2E（エンドツーエンド）テストを自動化しています。
- 主に「ログイン」「本の追加」など、実際のユーザー操作をブラウザ上で再現し、アプリ全体の動作確認を行います。
- テスト用Firebaseユーザーは、テスト前に自動で作成・削除される仕組みです。

### ディレクトリ構成
- `cypress/e2e/` ... E2Eテストコード（例: `book_add.cy.js`）
- `scripts/setupTestUser.cjs` ... テスト用Firebaseユーザー自動作成スクリプト

### 実行方法
1. **サービスアカウント鍵の配置**
   - Firebaseコンソールから `serviceAccountKey.json` を取得し、プロジェクト直下に配置してください。
   - `.gitignore` でGit管理対象外になっています。
2. **依存パッケージのインストール**
   ```bash
   npm install
   ```
3. **テスト用ユーザーの自動作成**
   ```bash
   npm run setup-test-user
   ```
   - これにより、`testuser@example.com` / `testpassword` のユーザーが毎回クリーンな状態で作成されます。
4. **Cypressテストの実行**
   - 特定のテストファイルのみ実行:
     ```bash
     npx cypress run --spec cypress/e2e/book_add.cy.js
     ```
   - すべてのE2Eテストを実行:
     ```bash
     npx cypress run
     ```
   - もしくは、npm scriptで一括実行:
     ```bash
     npm run e2e
     ```
     （`package.json`に`"e2e": "npm run setup-test-user && npx cypress run"` を追加）

### 修正・工夫した点
- ログイン画面のinput要素のtypeやセレクタに合わせてテストコードを修正。
- テスト用ユーザーの自動作成・削除をNode.jsスクリプトで実現し、手動管理の手間やミスを防止。
- テストは小さく分割し、まず「ログイン画面→本一覧遷移」だけを確実に通す形から段階的に拡張。
- `.gitignore`に`serviceAccountKey.json`を追加し、セキュリティにも配慮。

### 注意事項
- `serviceAccountKey.json`は**絶対にGit管理しないでください**。
- テスト用ユーザーのメール・パスワードは必要に応じてスクリプト内で変更可能です。

---

E2Eテストや自動化の運用について不明点があれば、`doc/`配下のメモやこのREADMEを参照してください。

### 主な機能・設計の特徴（2024年6月時点）

- 書籍・メモにタグ付与（API自動セット＋履歴サジェスト＋編集可）
- タグ履歴はFirestoreで用途別に管理し、Autocompleteで補完候補を表示
- タグ検索・フィルタは大文字小文字・全角半角を区別せず快適に利用可能
- UIはスマホ・PC両対応、タグ入力はカンマ区切りもOK
- 書影・出版社・出版日などの書誌情報も管理
- バグ・改善案・TODOは`doc/bug-feature-memo.md`で管理
- 設計・運用方針は`ARCHITECTURE.md`や日報に詳細記載

#### 既知の制約・今後の課題
- 画像添付は現状未対応（Firebase Storage無料枠の制約）
- スマホのカメラ・バーコード読み取りに一部バグあり（バグメモ参照）

---

## 運用・セキュリティ対応履歴（2024年6月26日）

- **Firebase Firestoreのセキュリティルールを本番用に設定**
  1. プロジェクトルートに `firestore.rules` を新規作成し、認証ユーザーのみ自分のデータにアクセスできるようにルールを記述
  2. `firebase.json` と `firestore.indexes.json` も作成し、ルール・インデックスを管理
  3. Node.jsをv22にアップデート（公式インストーラー利用）
  4. Firebase CLIの認証・プロジェクト指定をやり直し
  5. 下記コマンドでルールをデプロイ
     ```powershell
     firebase deploy --only firestore:rules --project <プロジェクトID>
     ```
  6. ルール反映後、`npm test` で自動テストがすべてパスすることを確認

- **注意点**
  - PowerShellではコマンドの区切りに `;` を使う
  - Firebase CLIの認証エラー時は `firebase logout` → `firebase login` で再認証
  - テストや本番でFirestoreの権限エラーが出た場合は、ルール・認証状態・プロジェクトIDを再確認
