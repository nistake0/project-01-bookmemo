# 本番デプロイ環境構築ガイド

## ⚠️ セキュリティ警告
**重要**: 環境変数ファイル（`.env`、`.env.production`等）は絶対にGitにコミットしないでください。
- 本番環境のAPIキーや機密情報が漏洩する可能性があります
- `.gitignore`に環境変数ファイルが含まれていることを確認してください
- 既にコミットされた環境変数ファイルがある場合は、Git履歴から完全に削除してください

## 概要
BookMemoアプリの本番デプロイ環境をGitHub Pages + Firebaseで構築します。

## Phase 1: 本番Firebaseプロジェクト設定

### 1.1 本番Firebaseプロジェクト作成（完了）
- プロジェクトID: `project-01-bookmemo-prod`
- プロジェクト名: BookMemo Production
- Firebase Console: https://console.firebase.google.com/project/project-01-bookmemo-prod/overview

### 1.2 Firestore API有効化（重要）
本番プロジェクトでFirestoreを使用するために、以下の手順でAPIを有効化してください：

1. [Firebase Console](https://console.firebase.google.com/project/project-01-bookmemo-prod/overview)を開く
2. 左メニューから「Firestore Database」を選択
3. 「データベースを作成」をクリック
4. セキュリティルールを選択（本番環境では「本番モードで開始」を推奨）
5. ロケーションを選択（asia-northeast1を推奨）

### 1.3 本番環境変数設定
本番環境用の`.env.production`ファイルを作成し、以下の環境変数を設定してください：

```env
# 本番環境用Firebase設定
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=project-01-bookmemo-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-01-bookmemo-prod
VITE_FIREBASE_STORAGE_BUCKET=project-01-bookmemo-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
VITE_FIREBASE_APP_ID=your_production_app_id
```

**設定手順:**
1. Firebase Consoleで`project-01-bookmemo-prod`プロジェクトを開く
2. プロジェクト設定 → 全般 → マイアプリ → Webアプリを追加
3. アプリ登録後、設定値をコピーして`.env.production`に設定

### 1.4 Firestore設定
本番環境のFirestoreを初期化します：

```bash
# 本番プロジェクトに切り替え
firebase use project-01-bookmemo-prod

# Firestoreルールとインデックスをデプロイ
firebase deploy --only firestore:rules,firestore:indexes
```

## Phase 2: GitHub Pages設定

### 2.1 GitHub Secrets設定
GitHubリポジトリのSettings → Secrets and variables → Actionsで以下のシークレットを設定：

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 2.2 GitHub Pages有効化
1. GitHubリポジトリのSettings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages
4. Save

### 2.3 GitHub Actionsワークフロー作成（完了）
`.github/workflows/deploy.yml`を作成済み

## Phase 3: CI/CDパイプライン構築

### 3.1 テスト自動実行
プルリクエスト時にテストを自動実行します。

### 3.2 ビルド自動化
mainブランチへのマージ時に自動ビルド・デプロイします。

## セキュリティ注意事項

### 環境変数の管理
- `.env.production`は絶対にGitにコミットしない
- GitHub Secretsを使用して環境変数を管理
- 本番環境のAPIキーは厳重に管理

**環境変数ファイルの管理手順:**
1. `.gitignore`に以下が含まれていることを確認:
   ```
   .env
   .env.local
   .env.development
   .env.production
   .env.test
   ```

2. 既存の環境変数ファイルをGit履歴から削除:
   ```bash
   git rm --cached .env
   git commit -m "Remove .env file from repository"
   ```

3. GitHub Secretsで環境変数を管理:
   - リポジトリのSettings → Secrets and variables → Actions
   - 各環境変数を個別にシークレットとして追加

### Firestoreセキュリティ
- 本番環境のFirestoreルールを適切に設定
- 認証済みユーザーのみアクセス可能に設定
- データの読み書き権限を最小限に設定

## デプロイ確認手順

### 1. 本番環境での動作確認
```bash
# 本番環境変数でビルド
npm run build:prod

# 本番環境でプレビュー
npm run preview
```

### 2. 本番デプロイ
```bash
# GitHub Actionsで自動デプロイ
git push origin main
```

## トラブルシューティング

### よくある問題
1. **Firestore APIエラー**
   - Firebase ConsoleでFirestore Databaseを作成
   - APIが有効化されるまで数分待機

2. **環境変数が読み込まれない**
   - `.env.production`ファイルの存在確認
   - 環境変数名の正確性確認

3. **Firebase認証エラー**
   - 本番プロジェクトの設定確認
   - APIキーの有効性確認

4. **ビルドエラー**
   - 依存関係の確認
   - TypeScriptエラーの確認

## 次のステップ
- [ ] Firestore Databaseの作成
- [ ] 本番環境変数の設定
- [ ] GitHub Secretsの設定
- [ ] GitHub Pagesの有効化
- [ ] 自動デプロイのテスト
- [ ] 本番環境での動作確認
