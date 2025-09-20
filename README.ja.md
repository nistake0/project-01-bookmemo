# BookMemo App（読書メモアプリ）— 100% Cursor自動生成プロジェクト

[🇯🇵 日本語](README.ja.md) | [🇺🇸 English](README.md)

## 目次

* [プロジェクトについて](#プロジェクトについて)
* [アプリ概要・特徴](#アプリ概要・特徴)
* [技術スタック](#技術スタック)
* [セットアップ手順](#セットアップ手順)
* [テスト](#テスト)
* [プロジェクト構造](#プロジェクト構造)
* [プロジェクトドキュメント](#プロジェクトドキュメント)
* [運用・セキュリティ](#運用・セキュリティ)
* [本番デプロイ](#本番デプロイ)
* [ライセンス](#ライセンス)

React + Firebaseを使用した読書メモ管理Webアプリケーションです。

## プロジェクトについて

このプロジェクトは、**完全にCursor AIによって作成されました**。コーディングはすべてAIによって行われ、人間の手は一切借りていません。Cursor AIは、コードの生成、リファクタリング、テストの作成など、開発の全工程をサポートするAIアシスタントです。このプロジェクトでは、Cursor AIが以下の役割を果たしました：

* プロジェクトの初期設定と構造の設計
* アプリケーションロジックの実装（認証、データ管理、UI/UX）
* 画面遷移やアニメーションなどの機能の実装
* テストコードの作成と実行（ユニットテスト・E2Eテスト）
* コードのリファクタリングと最適化
* バグの修正とデバッグ
* ドキュメントの生成（README、ARCHITECTURE.md、日報等）
* 本番デプロイ環境の構築

Cursor AIは、開発者の意図を理解し、適切なコードを提案することで、効率的な開発を実現しました。このプロジェクトは、AIによる完全なコーディングの可能性を示す一例となっています。

### 開発の記録

Cursorとの具体的なやり取りや、日々の開発の進捗は以下のドキュメントで確認できます。

* `cursor-chats/`: Cursorとの対話ログ（プロンプトとAIの応答）が格納されています。
* `doc/`: 日々の開発内容をまとめた日報が格納されています。

## アプリ概要・特徴

シンプルな読書メモを管理するWebアプリケーションです。書籍のISBNを元に書誌情報を取得し、メモと一緒に保存・管理することができます。

**技術的詳細**: プロジェクトの詳細な技術仕様、アーキテクチャ、実装詳細については、[DeepWiki](https://deepwiki.com/nistake0/project-01-bookmemo)で確認できます。

### 主な機能

* **書籍管理**: ISBNスキャン・手動入力による書籍登録
* **メモ機能**: 書籍ごとの読書メモ・感想・タグ管理
* **検索・フィルタ**: 統合検索、タグフィルタ、ステータスフィルタ
* **統計ダッシュボード**: 読書データの可視化（グラフ・ランキング）
* **タグ管理**: タグの編集・削除・統合機能
* **PWA対応**: オフライン対応、インストール可能
* **OCR機能**: カメラ・ペーストによるテキスト認識
* **レスポンシブデザイン**: モバイル・PC両対応

## 技術スタック

* **フロントエンド**: React 18 + Vite
* **UI フレームワーク**: Material-UI (MUI)
* **データベース**: Firebase Firestore
* **認証**: Firebase Authentication
* **ホスティング**: GitHub Pages
* **テスト**: Jest + React Testing Library + Cypress
* **PWA**: Service Worker + Web App Manifest

## セットアップ手順

### 必要条件

* Node.js (v16以上推奨)
* npm (v7以上推奨)
* Firebase プロジェクトの作成

### インストール

```bash
# 依存パッケージのインストール
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

開発サーバーが起動し、ブラウザで`http://localhost:5173`にアクセスすることでアプリを利用できます。コードの変更は自動的に反映されます。

### ビルド

```bash
npm run build
```

プロジェクトをビルドし、`dist`ディレクトリに出力します。

### ビルド結果のプレビュー

```bash
npm run preview
```

ビルドされたアプリをローカルでプレビューできます。

## テスト

このプロジェクトではJestとCypressを使用してテストを実行します。

### ユニットテスト

```bash
# ユニットテストの実行
npm run test:unit

# テストの監視モード（ファイル変更時に自動実行）
npm run test:unit:watch

# テストカバレッジの確認
npm run test:coverage
```

テストカバレッジレポートは`coverage`ディレクトリに生成されます。

### E2Eテスト（Cypress）

#### テスト実装方針

- **data-testid属性による決定的な要素特定**: すべてのテスト対象要素には `data-testid` 属性を付与
- **テキストベースの要素特定の回避**: UI変更に影響されない安定したテストを実装
- **一貫性の確保**: テスト要素の命名規則を統一し、保守性を向上

#### 実行方法

1. Firebaseサービスアカウント鍵（`serviceAccountKey.json`）をプロジェクト直下に配置
2. テスト用ユーザーの自動作成
   ```bash
   npm run test:setup
   ```
3. **開発サーバーの起動**（E2Eテスト実行に必須）
   ```bash
   npm run dev
   ```
4. Cypressテストの実行
   - すべて実行: `npm run test:e2e`
   - GUIモード: `npm run test:e2e:open`
   - 全テスト実行（ユニット＋E2E）: `npm run test:all`

#### 注意事項

- `serviceAccountKey.json`は**絶対にGit管理しないでください**
- **E2Eテスト実行前には必ず開発サーバー（`npm run dev`）を起動してください**
- **HTTPS開発環境**: 開発サーバーがHTTPSで起動するため、Cypress設定もHTTPS対応

## プロジェクト構造

```
src/
├── components/      # Reactコンポーネント
│   ├── auth/       # 認証関連
│   ├── common/     # 共通コンポーネント
│   ├── search/     # 検索関連
│   └── tags/       # タグ管理
├── hooks/          # カスタムフック
├── pages/          # ページコンポーネント
├── constants/      # 定数定義
├── firebase.js     # Firebase設定
└── utils/          # ユーティリティ関数
```

## プロジェクトドキュメント

このプロジェクトの詳細なドキュメントは以下の場所で確認できます：

* **ARCHITECTURE.md**: 設計・運用方針の詳細
* **doc/bug-feature-memo.md**: バグ・機能・改善案などの重要メモ
* **doc/daily/**: 日々の開発日報（進捗・議論・技術的知見の記録）
* **cursor-chats/**: Cursorとの対話ログ（AI自動生成の全記録）

これらのドキュメントにより、プロジェクトの構造や実装の詳細を効率的に理解することができます。

## 既知の制約・今後の課題

- 画像添付は現状未対応（Firebase Storage無料枠の制約）
- スマホのカメラ・バーコード読み取りに一部バグあり
- Algolia等の全文検索サービス、タグ分析機能なども今後の拡張候補

## 運用・セキュリティ

### セキュリティ対策
- Firestoreのセキュリティルールを本番用に設定し、認証ユーザーのみ自分のデータにアクセス可能
- **重要なセキュリティ修正（2025-08-12）**: `.env`ファイルのGitコミット問題を発見・修正
  - Git履歴から機密情報を完全に除去（`git filter-branch`で163個のコミットをクリーンアップ）
  - `.gitignore`に環境変数ファイルを追加して再発防止
  - セキュリティ警告と管理手順をドキュメントに追加

### 本番デプロイ環境
- **本番デプロイ環境完成（2025-08-13）**: 本番Firebaseプロジェクトの設定完了
  - 本番環境での動作確認完了
  - GitHub Actionsによる自動デプロイ準備完了
  - セキュリティ設定の完全実装

### コミットメッセージ運用ルール
- すべてのコミットメッセージは日本語で記述
- 先頭にカテゴリ（例: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`）を付ける
- 要約は50文字程度に収め、必要なら本文で詳細を記載

### 開発開始時の手順

新しい開発セッションを開始する際は、以下の手順を実行してください：

1. `doc/development-startup-prompts.md` ファイルを確認
2. 記載されている3つのプロンプトを順番に実行：
   - プロジェクト状況確認
   - テスト状況確認  
   - 開発方針議論

## 本番デプロイ

### GitHub Pages

本アプリはGitHub Pagesを使用してデプロイされています。

#### デプロイ手順

```bash
# ビルド
npm run build

# GitHub Pagesにデプロイ
npm run deploy
```

#### 本番環境へのアクセス

- **本番URL**: https://nistake0.github.io/project-01-bookmemo/
- **GitHubリポジトリ**: https://github.com/nistake0/project-01-bookmemo

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
