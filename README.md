# 読書メモアプリ

スマホ・PC両対応のレスポンシブWebアプリで、書籍管理とメモ機能を提供するReactアプリケーションです。

## 機能

- 書籍管理（ISBNバーコードスキャン・手入力）
- メモ・感想記録（OCR、画像添付対応予定）
- 全文検索・タグ管理
- ユーザー認証（Firebase Authentication）

## 技術スタック

- **フロントエンド**: React（Vite）、Material-UI
- **バックエンド**: Firebase Firestore、Authentication
- **テスト**: Jest、React Testing Library、Cypress
- **デプロイ**: GitHub Pages

## 開発環境セットアップ

### 前提条件
- Node.js v22以上
- npm

### インストール
```bash
npm install
```

### 開発サーバー起動
```bash
npm run dev
```

### テスト実行

#### ユニットテスト
```bash
npm test
```

#### E2Eテスト（ローカル実行）
```bash
# 開発サーバーを起動（別ターミナルで）
npm run dev

# E2Eテスト実行
npm run e2e

# E2Eテスト（ブラウザで開く）
npm run e2e:open

# テストデータリセット
npm run e2e:reset
```

## テスト実行手順

### E2Eテストの実行手順

1. **開発サーバー起動**
   ```bash
   npm run dev
   ```

2. **テストデータリセット**（必要に応じて）
   ```bash
   npm run e2e:reset
   ```

3. **E2Eテスト実行**
   ```bash
   # ヘッドレスモード
   npm run e2e
   
   # ブラウザで開く
   npm run e2e:open
   ```

### テストファイル構成

#### E2Eテスト
- `cypress/e2e/book_login.cy.js` - ログイン画面
- `cypress/e2e/book_add.cy.js` - 本追加
- `cypress/e2e/memo_list_display.cy.js` - メモ一覧表示
- `cypress/e2e/memo_list_buttons.cy.js` - メモボタン操作
- `cypress/e2e/memo_list_edit.cy.js` - メモ編集
- `cypress/e2e/memo_list_delete.cy.js` - メモ削除
- `cypress/e2e/memo_list_ellipsis.cy.js` - メモ省略表示

#### ユニットテスト
- `src/pages/BookAdd.test.jsx`
- `src/pages/BookDetail.test.jsx`
- `src/pages/BookList.test.jsx`
- `src/components/MemoAdd.test.jsx`
- `src/components/MemoList.test.jsx`
- `src/components/BarcodeScanner.test.jsx`（スキップ中）

## 注意事項

- **E2Eテスト**: ローカル環境でのみ実行（GitHub Actions課金回避のため）
- **Firebase**: テスト用のFirebaseプロジェクト設定が必要
- **HTTPS**: ローカル開発ではHTTPSが必要（カメラ機能のため）

## ライセンス

MIT License
