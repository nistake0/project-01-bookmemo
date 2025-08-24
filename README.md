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

### テスト実装方針

#### テスト要素の特定方法
- **data-testid属性による決定的な要素特定**: すべてのテスト対象要素には `data-testid` 属性を付与し、テストでは `cy.get('[data-testid="element-name"]')` を使用
- **テキストベースの要素特定の回避**: `cy.contains()` や `getAllByText()` などのテキストベースの要素特定は避け、UI変更に影響されない安定したテストを実装
- **一貫性の確保**: テスト要素の命名規則を統一し、保守性を向上

#### 実装パターン
- **Test ID Pattern**: テスト専用のID属性を使用した要素特定
- **Semantic Test Selectors**: 意味のあるセレクタ名による要素特定
- **Stable Test Selectors**: UI変更に影響されない安定したセレクタの使用

### ユニットテスト
```bash
npm test
```

### E2Eテスト（Cypress）
- CypressでE2Eテストをローカル実行
- テスト用Firebaseユーザーは自動で作成・削除
- テストは1ファイル1シナリオで分割・独立性重視
- **重要**: E2Eテスト実行には開発サーバーの起動が必須
- **data-testid対応**: UI変更に影響されない安定したテスト設計
- **HTTPS対応**: 開発環境のHTTPS設定に対応したCypress設定

#### 実装パターン
- **Test ID Pattern**: テスト専用のID属性を使用した要素特定
- **Semantic Test Selectors**: 意味のあるセレクタ名による要素特定
- **Stable Test Selectors**: UI変更に影響されない安定したセレクタの使用
- **data-testid優先**: `cy.contains`の使用を避け、`data-testid`ベースの検証を優先

#### 実行方法
1. Firebaseサービスアカウント鍵（`serviceAccountKey.json`）をプロジェクト直下に配置（`.gitignore`済み）
2. 依存パッケージのインストール
   ```bash
   npm install
   ```
3. テスト用ユーザーの自動作成
   ```bash
   npm run test:setup
   ```
4. **開発サーバーの起動**（E2Eテスト実行に必須）
   ```bash
   npm run dev
   ```
5. Cypressテストの実行
   - 特定ファイルのみ: `npx cypress run --spec cypress/e2e/book_add.cy.js`
   - すべて実行: `npm run test:e2e` または `npm run e2e`
   - GUIモード: `npm run test:e2e:open`
   - 全テスト実行（ユニット＋E2E）: `npm run test:all`

#### 注意事項
- `serviceAccountKey.json`は**絶対にGit管理しないでください**
- **E2Eテスト実行前には必ず開発サーバー（`npm run dev`）を起動してください**
- テスト用ユーザーのメール・パスワードはスクリプトで変更可能
- **HTTPS開発環境**: 開発サーバーがHTTPSで起動するため、Cypress設定もHTTPS対応
- **data-testid使用**: 新しいコンポーネント作成時は必ず`data-testid`属性を追加
- 詳細な運用・工夫は[ARCHITECTURE.md](./ARCHITECTURE.md)や`doc/`参照

## 主な機能・設計の特徴
- 書籍・メモにタグ付与（API自動セット＋履歴サジェスト＋編集可）
- タグ履歴はFirestoreで用途別に管理し、Autocompleteで補完候補を表示
- タグ検索・フィルタは大文字小文字・全角半角を区別せず快適に利用可能
- UIはスマホ・PC両対応、タグ入力はカンマ区切りもOK
- 書影・出版社・出版日などの書誌情報も管理
- 統計ページ（読書ダッシュボード）を実装（@mui/x-charts）
  - 総冊数／読了／読書中
  - 月別読了冊数、月別追加冊数、月別メモ数
  - タグ上位の円グラフ、著者トップ／出版社トップ
  - ステータス内訳の円グラフ
 - 書籍一覧・検索/タグでタブをsticky固定
   - `App.jsx` 直下に `#app-scroll-container`（height: 100vh, overflow-y: auto）を導入し、確実にstickyが効くように調整
   - `BookList.jsx` / `TagSearch.jsx` のタブコンテナに `position: 'sticky', top: 0, zIndex: 1100` を付与
- タグ管理
  - タグの編集・削除・統合（別名→正規名）に対応
  - 一括削除ダイアログ（補完対応）を追加（タグ履歴から候補提示／複数選択）
  - 一括統合ダイアログ（補完対応）を追加（正規タグ＋別名複数、Autocomplete対応）
  - 正規化の最小強化（NFKC/小文字化/空白正規化）
- バグ・改善案・TODOは`doc/bug-feature-memo.md`で管理
- 設計・運用方針は`ARCHITECTURE.md`や日報に詳細記載

## 既知の制約・今後の課題
- 画像添付は現状未対応（Firebase Storage無料枠の制約）
- スマホのカメラ・バーコード読み取りに一部バグあり（バグメモ参照）
- Algolia等の全文検索サービス、PWA化、タグ分析機能なども今後の拡張候補

## 開発進捗

### 完了済み機能
- [x] **Phase 1-6**: 基本機能（認証、書籍管理、メモ管理、タグ機能）
- [x] **Phase 7**: 共通フック化プロジェクト（useBookList、useBookActions、useBookSearch）
- [x] **Phase 8**: スマートフォンUI/UX改善（レスポンシブデザイン、Material-UI最適化）
- [x] **Phase 9**: 検索・タグ機能の統合実装
- [x] **Phase 10**: バーコードスキャン機能
- [x] **Phase 11**: メモOCR機能（iPhoneカメラ + ペースト機能）
- [x] **Phase 12-13**: 本番デプロイ環境の構築（GitHub Pages、CI/CD）
- [x] **Phase 14**: スキップされたテストの復活（テストカバレッジ100%回復）
- [x] **Phase 15-1**: メモ検索結果の専用表示
- [x] **Phase 15-1.5**: 検索UI改善（統合テキスト検索、視覚的区別）
- [x] **Phase 15-2**: 統計ページの実装（グラフ・ランキング表示）
- [x] **Phase 15-3**: タグ編集・削除機能（一括操作、正規化機能）
- [x] **PWA機能の完全実装** ✅ **2025-08-15完了**
  - [x] Service Worker（キャッシュ戦略、オフライン対応）
  - [x] Web App Manifest（アプリメタデータ、アイコン設定）
  - [x] PWA管理フック（usePWA.js）
  - [x] インストールプロンプト（基本・強化版）
  - [x] **PWAインストール促進機能** ✅ **2025-08-15完了**
    - [x] ユーザー行動追跡（エンゲージメント、訪問回数）
    - [x] インストール促進ロジック（適切なタイミングでの表示）
    - [x] ヘッダーインストールボタン（BookListページ）
    - [x] インストール状態管理
  - [x] E2Eテストの修正（URLパス問題解決）

### 現在の課題・バグ修正
- [x] バグ修正: 検索結果のメモクリック時に書籍へ遷移する問題を修正（メモ詳細ダイアログを表示）
- [x] バグ修正: タグ検索でメモが検索対象に含まれない問題を修正
- [x] バグ修正: E2EテストのURLパス問題を修正
- [x] **E2Eテストのdata-testid対応と安定性向上** ✅ **2025-08-24完了**
  - [x] PageHeaderコンポーネントにdata-testid属性追加
  - [x] E2Eテストの`cy.contains`を`data-testid`ベースの検証に置き換え
  - [x] HTTPS設定の修正とタイムアウト設定の最適化
  - [x] テストの安定性と保守性の大幅向上

- [ ] **Phase 15-4**: マイページの実装（3-4時間）
  - [ ] MyPage.jsxの基本構造作成
  - [ ] ユーザー情報管理機能
  - [ ] 設定機能の実装
  - [ ] データ管理機能の実装

- [ ] **将来タスク**: 機能改善と拡張
  - [ ] PWAアイコンの作成（192x192, 512x512）
  - [ ] 動的インポートの実装
  - [ ] 画像最適化（WebP形式、遅延読み込み）
  - [ ] OCR機能の拡張（Tesseract.jsベース）

### 優先度変更（2025-08-14）
- [x] **PWA化を最優先で着手** ✅ **完了**
  - [x] Service Worker導入（手動実装）
  - [x] Web App Manifest作成（アイコン、display、theme_color、start_url）
  - [x] ルートフォールバック（オフライン時のApp Shell）
  - [x] キャッシュ戦略（静的: CacheFirst、API: StaleWhileRevalidate）
  - [x] 更新検知と再読み込みUX（SW更新通知）
  - [x] PWA関連のユニットテスト整備
  - [x] **PWAインストール促進機能の強化** ✅ **完了**
    - [x] ユーザー行動追跡機能
    - [x] インストール促進ロジック
    - [x] ヘッダーインストールボタン
- [ ] **タグの残タスクは優先度を下げ、後続で対応**（正規化高度化、一括操作専用画面など）

## 運用・セキュリティ履歴
- Firestoreのセキュリティルールを本番用に設定し、認証ユーザーのみ自分のデータにアクセス可能に
- ルール・インデックス・CLI認証・デプロイ手順は`firestore.rules`や`firebase.json`等で管理
- **重要なセキュリティ修正（2025-08-12）**: `.env`ファイルのGitコミット問題を発見・修正
  - Git履歴から機密情報を完全に除去（`git filter-branch`で163個のコミットをクリーンアップ）
  - `.gitignore`に環境変数ファイルを追加して再発防止
  - セキュリティ警告と管理手順をドキュメントに追加
- **本番デプロイ環境完成（2025-08-13）**: 本番Firebaseプロジェクトの設定完了
  - 本番環境での動作確認完了
  - GitHub Actionsによる自動デプロイ準備完了
  - セキュリティ設定の完全実装
- 詳細は日報や`doc/`参照

## コミットメッセージ運用ルール
- すべてのコミットメッセージは日本語で記述
- 先頭にカテゴリ（例: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`）を付ける
- 要約は50文字程度に収め、必要なら本文で詳細を記載

## 開発開始時の手順

新しい開発セッションを開始する際は、以下の手順を実行してください：

1. `doc/development-startup-prompts.md` ファイルを確認
2. 記載されている3つのプロンプトを順番に実行：
   - プロジェクト状況確認
   - テスト状況確認  
   - 開発方針議論

## 参考ドキュメント
- [ARCHITECTURE.md](./ARCHITECTURE.md): 設計・運用方針の詳細
- `doc/`: 日報・バグメモ・開発メモ
- `cursor-chats/`: Cursorとの対話ログ

## ドキュメント構成

- `doc/`
  - `bug-feature-memo.md` ... バグ・機能・改善案などの重要メモ（常時参照）
  - `development-startup-prompts.md` ... 開発開始時の必須プロンプト・運用ルール
  - `daily/` ... 日々の開発日報（進捗・議論・技術的知見の記録）
  - `archive/` ... 一時的な設計メモ・議事録・平時に参照しない記録のアーカイブ
- `ARCHITECTURE.md` ... 設計・運用方針の詳細
- `cursor-chats/` ... Cursorとの対話ログ（AI自動生成の全記録）

## 本番デプロイ（GitHub Pages）

### 仕組み
- GitHub Actions（`.github/workflows/deploy.yml`）で `main` ブランチへの push を契機に自動ビルド・デプロイ
- ビルド: `vite build`（`vite.config.js` の `base` は production 時に `'/project-01-bookmemo/'` に自動切替）
- デプロイ: `peaceiris/actions-gh-pages@v3` で `dist/` を `gh-pages` ブランチへ公開
  - `permissions: contents: write` を付与し、`actions/checkout` は `persist-credentials: false`
  - `gh-pages` はビルド成果物のみを保持（通常は orphan push。`main` と履歴は結合しません）

### 実装（ワークフロー概要）
- Job: test
  - `npm ci`
  - `npm run test:unit`
  - 任意で E2E 実行（`RUN_E2E == 'true'` の場合のみ）
    - `.env.local` を Secrets から生成
    - 必要であれば `serviceAccountKey.json` を Secrets から生成
    - `npm run dev` をバックグラウンド起動 → `npm run test:e2e`
- Job: build-and-deploy（main 時のみ）
  - `.env.production` を Secrets から生成
  - `npm run build`
  - `peaceiris/actions-gh-pages` で `dist/` を `gh-pages` に公開

### 事前準備
1. GitHub Pages の有効化
   - GitHub → Settings → Pages → Source: `Deploy from a branch`, Branch: `gh-pages`
2. Secrets（本番 Firebase 設定）
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. （任意/E2E 用）Secrets と Variables
   - `SERVICE_ACCOUNT_KEY_JSON`（JSON文字列; E2E のテストデータセットアップ用）
   - Actions Variables: `RUN_E2E = true`（E2E をCIで回したい場合）

### 手順
- 通常運用: `main` に push するだけで、自動でビルド→`gh-pages` へデプロイ
- 手動検証（ローカル）:
  - `npm run build:prod`
  - `npm run preview`

### 本番環境へのアクセス
- 本番URL: `https://nistake0.github.io/project-01-bookmemo/`

### トラブルシューティング
- 403（Pages への push 失敗）
  - ワークフローに `permissions: contents: write` があるか確認
  - `actions/checkout` で `persist-credentials: false` を設定
- `auth/invalid-api-key`
  - 上記 Firebase Secrets が設定されているか確認（`.env.production` 生成）
- `serviceAccountKey.json` が無い（E2E）
  - `SERVICE_ACCOUNT_KEY_JSON` を Secrets に設定、もしくは E2E をオフにする（`RUN_E2E` 未設定）
