# コード品質レビュー報告書 - 2025年1月21日

## 📊 概要

BookMemoプロジェクトのコード品質と抽象化粒度について詳細な調査を実施し、改善が必要な箇所を特定しました。

## 🔍 調査方法

1. **主要コンポーネントの複雑性分析** - 単一責任の原則の遵守状況
2. **フックの複雑性分析** - 責務の分離状況
3. **ファイルサイズと複雑性の定量分析** - 行数による複雑性測定
4. **複雑性の高いファイルの詳細分析** - 具体的な問題点の特定

## 🚨 重大な問題（優先度：高）

### 1. useSearch.js - 最も複雑なファイル（495行）

**問題点:**
- **単一責任の原則違反**: クエリ構築、実行、結果処理、エラーハンドリングが全て混在
- **複雑性**: 5つの異なる責務が1つのフックに集約
- **保守性**: 修正時の影響範囲が広すぎる

**改善案:**
```
useSearch.js (494行) → 
├── useSearchQuery.js (クエリ構築)
├── useSearchExecution.js (Firestore実行)  
├── useSearchResults.js (結果処理)
└── useSearch.js (状態管理統合)
```

### 2. useBookList.js - 複雑な状態管理（175行）

**問題点:**
- **責務過多**: データ取得、フィルタリング、検索、統計計算が混在
- **冗長なエラーハンドリング**: Reactコンテキストの安全性チェックが過剰
- **パフォーマンス**: 統計計算が毎回実行される

**改善案:**
```
useBookList.js (174行) →
├── useBookData.js (データ取得)
├── useBookFiltering.js (フィルタリング)
├── useBookStats.js (統計計算)
└── useBookList.js (統合)
```

### 3. ManualHistoryAddDialog.jsx - バリデーションロジックの混在

**問題点:**
- **ビジネスロジックの混在**: 複雑なバリデーションロジックがコンポーネント内に直接記述
- **再利用性**: バリデーションロジックが再利用できない
- **テスタビリティ**: コンポーネントとロジックが密結合

**改善案:**
```
ManualHistoryAddDialog.jsx →
├── useHistoryValidation.js (バリデーション)
└── ManualHistoryAddDialog.jsx (UI専用)
```

## ⚠️ 中程度の問題（優先度：中）

### 4. MemoAdd.jsx - 複雑な状態管理（302行）

**問題点:**
- **状態変数過多**: 8つの状態変数が混在
- **フォームロジック**: 複雑なフォームリセットとバリデーション

### 5. MemoEditor.jsx - モード管理の複雑性

**問題点:**
- **モード切り替え**: view/edit/delete確認の3つのモード管理
- **状態同期**: 複数の状態が相互に依存

## 📝 軽微な問題（優先度：低）

### 6. useBookStatusHistory.js - 計算ロジックの混在

**問題点:**
- **計算ロジック**: 日付計算、期間計算がフック内に混在
- **責務の境界**: データ取得と計算処理の境界が曖昧

## 📈 ファイルサイズ分析結果

### 最も複雑なファイル（行数順）
1. **useSearch.js** - 495行 ⚠️
2. **MemoCard.test.jsx** - 630行
3. **BookDetail.test.jsx** - 604行
4. **App.jsx** - 357行（分離後）
5. **useBookList.js** - 143行（分離後）

（注）行数は 2025-09-23 時点の実ファイルを基に補正。

## 🎯 改善優先度

### 優先度1（最優先）
- **useSearch.js の責務分離** - 494行の巨大フックを4つに分離（未着手）
- **useBookList.js の責務分離** - 進捗: フィルタ/統計の分離完了（2025-09-23）。残: データ取得の切り出し検討

### 優先度2（重要）
- **ManualHistoryAddDialog.jsx のバリデーション分離** - 完了（2025-09-23）
- **MemoAdd.jsx の状態管理改善** - 8つの状態変数の整理（未着手）

### 優先度2-追加（UI/ロジック分離の強化）
- **App.jsx の責務分離** - 完了（2025-09-23）
  - テーマ定義を `src/theme/appTheme.js` に分離
  - グローバルエラーハンドリング/デバッグユーティリティを `src/utils/errorLogger.js` に分離
  - 目的: ルーティング/レイアウトと設定・ユーティリティの分離による可読性向上

### 優先度3（改善）
- **MemoEditor.jsx のモード管理簡素化** - 3つのモード管理の改善（未着手）
- **useBookStatusHistory.js の計算ロジック分離** - 完了（2025-09-23）

## ✅ 進捗更新（2025-09-23）
- App.jsx の責務分離を実施し、テーマ/エラーロガーを外部化
- ManualHistoryAddDialog のバリデーションをフックへ分離
- useBookList のフィルタ/統計ロジックを分離（`useBookFiltering`/`useBookStats`）
- useBookStatusHistory の計算ロジックをユーティリティへ分離

## 🔄 次のステップ

1. **優先度1の問題から順次対応**
2. **各改善前に詳細な設計検討**
3. **テストカバレッジの維持**
4. **段階的なリファクタリング実施**

---

## 🎨 ロジックとUIデザインの分離性レビュー（2025-09-23追記）

### 現状評価（主要ホットスポット）
- **useSearch.js**（495行）: クエリ構築・Firestore実行・クライアントフィルタ・ソート・結果整形が同居。UIは持たないが、ロジック責務が過多。
- **useBookList.js**（175行）: データ取得とフィルタ/検索/統計計算が同居。フィルタと統計を分離可能。
- **ManualHistoryAddDialog.jsx**: バリデーション（未来日時、重複、ステータス妥当性）がUIコンポーネント内に存在。
- **MemoAdd.jsx / MemoEditor.jsx**: 入力状態・送信ロジックとUIが同居（許容範囲だが、フォームロジックを薄くするとテスト容易性が向上）。
- **App.jsx**（617行）: テーマ設定、グローバルエラーハンドリング、デバッグ関数、PWA初期化、ルーティング/レイアウトが同居。

### 分離ガイドライン（推奨）
- **Hooks分割**: データ取得/更新（副作用）と純粋ロジック（フィルタ/ソート/集計）を分離。
  - 例: `useSearchQuery`（クエリ構築）, `useSearchExecution`（取得/フォールバック）, `useSearchResults`（テキスト/タグ/メモ内容フィルタ＋ソート）。
  - 例: `useBookData`（取得）, `useBookFiltering`（検索/タグ/ステータス）, `useBookStats`（統計）。
- **UIコンポーネント**は入出力（props, callbacks）に集中し、フォームのバリデーション・正規化はフックへ委譲。
- **テーマ/スタイル**は MUI Theme と `sx` で統一。色/余白/フォント等はテーマトークンに集約し、インライン数値の重複を排除。
- **エラーハンドリング**は共通ダイアログ（`CommonErrorDialog`）経由に統一。各フックはユーザー向け文言を返すか、エラー型を共通化。
- **ユーティリティ**（日付/タグ正規化/デバッグログ）は `src/utils/` に移し副作用を限定。

### 具体アクション（小さく刻む）
1. `App.jsx` の分離
   - `src/utils/errorLogger.js`（ErrorLogger, setupGlobalErrorHandling, debugコマンド）
   - `src/theme/appTheme.js`（createTheme の切り出し）
2. `ManualHistoryAddDialog.jsx`
   - `src/hooks/useHistoryValidation.js` 新設（未来日/重複/ステータス妥当性）
3. `useBookList.js`
   - `useBookFiltering`, `useBookStats` を切り出し。既存インポート先に合わせて段階導入。
4. `useSearch.js`
   - 上記3分割＋統合フック構成に段階移行（テストを先行作成）。

補足: `useBookStatusHistory.js` は、履歴取得（副作用）と期間計算（純粋ロジック）が同居しているため、`getImportantDates`/`getReadingDuration` を `utils/date` 系へ移管すると単体テストが簡潔になります。

## 📚 参考資料

- 単一責任の原則（Single Responsibility Principle）
- React Hooks のベストプラクティス
- コンポーネント設計パターン
- テスト駆動開発（TDD）

---

**作成日**: 2025年1月21日  
**作成者**: AI Assistant  
**レビュー対象**: BookMemoプロジェクト全体
