# バグ・機能メモ

## 現在の課題・TODOリスト

### 1. テスト関連
- [ ] MemoCard.test.jsxの修正（スワイプアクション対応）
- [ ] MemoList.test.jsxの再作成（FAB・クリック機能対応）
- [ ] E2Eテストの安定性向上・追加（memo_swipe_actions.cy.js等）
- [ ] ユニットテストのカバレッジ向上

### 2. 共通ロジック・リファクタ
- [ ] 共通フック（useBook, useMemo）の作成・適用

### 3. UI/UX・アクセシビリティ
- [ ] アクセシビリティ改善（ARIA属性、キーボードナビ等）
- [ ] Pull to Refreshの実装
- [ ] アニメーション効果の追加
- [ ] レスポンシブデザインの改善

### 4. パフォーマンス・最適化
- [ ] コンポーネントの最適化
- [ ] バンドルサイズの削減

## 完了した課題

### UI/UX改善
- [x] メモ全体タップ機能
- [x] FAB（Floating Action Button）実装
- [x] BookDetail.test.jsx修正
- [x] MemoAdd.test.jsx修正

### テスト修正
- [x] BookDetail.test.jsx（FAB対応・複数要素エラー解決）
- [x] MemoAdd.test.jsx（ダイアログモード対応テスト追加）

---

## 技術的メモ

### 1. Material-UI FAB
- `Fab`コンポーネントを使用
- `position: 'fixed'`で画面右下に固定
- `sx`プロパティでスタイリング

### 2. ダイアログ実装
- `Dialog`コンポーネントを使用
- `maxWidth="sm"`でサイズ制限
- `fullWidth`で幅を最大に

### 3. テスト戦略
- ユニットテスト: コンポーネントの個別機能
- E2Eテスト: ユーザーフローの検証
- モック: 外部依存関係の分離 