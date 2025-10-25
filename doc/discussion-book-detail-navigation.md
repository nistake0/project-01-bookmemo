3. **不要になったUI**
   - 専用UIボタンは不要
   - スワイプジェスチャで対応

## 次回の実装ステップ

1. **Phase 1: useNavigationフックの作成**
   - ナビゲーション機能の統一
   - 状態復元のヘルパー

2. **Phase 2: グローバルスワイプジェスチャ実装**
   - App.jsxでスワイプジェスチャ実装
   - PWA時のみ有効化
   - 既存スワイプ実装との競合回避（`data-allow-local-swipe`要素を除外）

3. **Phase 3: 各画面での適用**
   - BookDetailでstateを処理
   - 検索画面でstateを渡す
   - MemoCardに`data-allow-local-swipe`属性を追加
   - 動作確認とテスト

## 関連ファイル

- `src/hooks/useNavigation.js` - **新規作成** 全画面共通ナビゲーションフック
- `src/App.jsx` - グローバルスワイプジェスチャ実装（競合回避機能付き）
- `src/pages/BookDetail.jsx` - 書籍詳細ページ
- `src/components/search/SearchResults.jsx` - 検索結果表示
- `src/components/MemoCard.jsx` - **既存** スワイプ実装、競合回避属性を追加
- `src/hooks/usePWA.js` - PWA判定
- `src/components/common/PageHeader.jsx` - ヘッダーコンポーネント

---

作成日: 2025-10-25
更新日: 2025-10-25（方針変更: 全画面統一実装へ、競合回避機能追加） 