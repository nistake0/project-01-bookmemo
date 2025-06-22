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
