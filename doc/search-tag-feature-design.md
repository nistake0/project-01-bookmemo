# 検索・タグ機能統合設計ドキュメント

## 元の要求機能

### 検索機能の拡張要求
1. **読了日時による検索機能**
   - 年別検索: "2024年に読了した本"
   - 年月検索: "2024年3月に読了した本"
   - 直近期間検索: "直近3ヶ月に読了した本"
   - 四半期検索: "2024年第1四半期に読了した本"

2. **その他の有用な検索機能**
   - メモ内容検索: メモのテキスト内容での検索
   - 読書進捗検索: 読書期間・頻度での絞り込み
   - タグ関連検索: 複数タグの組み合わせ検索
   - ISBN・出版社検索: ISBN・出版社での絞り込み

### タグ機能の日本語対応要求
1. **現在の状況**
   - 基本的な日本語タグは使用可能
   - 全角英数字→半角変換は実装済み
   - 日本語タグの正規化機能が不完全

2. **必要な改善**
   - 日本語タグの正規化機能拡張
   - 全角スペース→半角スペース変換
   - 連続スペースの正規化
   - 半角・全角の統一処理の改善

### フッターメニュー未実装項目
1. **検索・タグページ** (`/tags`)
   - 現在は仮実装状態
   - 高度な検索機能とタグ管理機能の統合が必要

2. **統計ページ** (`/stats`)
   - 読書統計・メモ統計の可視化
   - グラフ・チャート表示機能

3. **マイページ** (`/mypage`)
   - ユーザー情報管理
   - アプリ設定・データ管理

## 概要

検索機能とタグ管理機能を同一ページに統合し、ユーザビリティと開発効率を向上させる設計。

## ページ構成

### メインページ
- **TagSearchPage** (`pages/TagSearch.jsx`): メインページ（タブ切り替えUI）

### タブ構成
1. **検索タブ**: 高度な検索機能（複数条件での絞り込み）
2. **タグ管理タブ**: タグ一覧・統計・管理機能

## コンポーネント設計

### 1. ページレベルコンポーネント

#### 1.1 メインページコンポーネント
```javascript
// pages/TagSearch.jsx
- TagSearchPage: メインページ（タブ切り替えUI）
```

### 2. 検索機能関連コンポーネント

#### 2.1 検索フォームコンポーネント
```javascript
// components/search/
- AdvancedSearchForm: 高度な検索フォーム（全体） ✅
- TextSearchField: テキスト検索フィールド ✅
- StatusFilterTabs: ステータスフィルター（読書中・読了・すべて） ✅
- DateRangeSelector: 日時範囲選択 ✅
- TagSearchField: タグ検索フィールド（複数選択） ✅
- MemoContentSearchField: メモ内容検索フィールド ✅
- SortOptionsSelector: ソート条件選択
```

#### 2.2 検索結果コンポーネント
```javascript
// components/search/
- SearchResults: 検索結果表示（全体）
- SearchResultItem: 検索結果アイテム（本・メモ）
- SearchResultBookCard: 本の検索結果カード
- SearchResultMemoCard: メモの検索結果カード
- SearchResultEmpty: 検索結果なし表示
- SearchResultStats: 検索結果統計（件数等）
```

#### 2.3 検索条件管理コンポーネント
```javascript
// components/search/
- SearchConditionManager: 検索条件の管理・保存・復元
- SearchHistoryList: 検索履歴一覧
- SearchConditionChips: 現在の検索条件をチップで表示
```

### 3. タグ管理関連コンポーネント

#### 3.1 タグ一覧・統計コンポーネント
```javascript
// components/tags/
- TagList: タグ一覧表示（全体）
- TagListItem: タグ一覧アイテム
- TagStatistics: タグ統計表示
- TagUsageChart: タグ使用頻度チャート
- TagCloud: タグクラウド表示
```

#### 3.2 タグ管理コンポーネント
```javascript
// components/tags/
- TagManagementPanel: タグ管理パネル（全体）
- TagEditor: タグ編集ダイアログ
- TagDeleteConfirm: タグ削除確認ダイアログ
- TagBulkActions: タグ一括操作
- TagFilterPanel: タグフィルターパネル
```

#### 3.3 タグ表示コンポーネント
```javascript
// components/tags/
- TagChip: タグチップ（クリック可能）
- TagBadge: タグバッジ（件数表示付き）
- TagGroup: タググループ表示
```

### 4. 共通UIコンポーネント

#### 4.1 レイアウトコンポーネント
```javascript
// components/common/
- TabPanel: タブパネル（Material-UI拡張） ✅
- LoadingSpinner: ローディング表示
- ErrorBoundary: エラー境界
- EmptyState: 空状態表示
```

#### 4.2 フォームコンポーネント
```javascript
// components/common/
- DateRangePicker: 日付範囲選択 ✅ (DateRangeSelectorとして実装)
- MultiSelectField: 複数選択フィールド ✅ (TagSearchFieldとして実装)
- SearchField: 検索フィールド（基本） ✅ (AdvancedSearchForm内に統合)
- FilterChips: フィルターチップ
```

### 5. カスタムフック

#### 5.1 検索関連フック
```javascript
// hooks/search/
- useAdvancedSearch: 高度な検索ロジック
- useSearchHistory: 検索履歴管理
- useSearchConditions: 検索条件管理
- useMemoSearch: メモ検索ロジック
```

#### 5.2 タグ関連フック
```javascript
// hooks/tags/
- useTagStatistics: タグ統計取得
- useTagManagement: タグ管理ロジック
- useTagSearch: タグ検索ロジック
- useTagAnalytics: タグ分析ロジック
```

### 6. ユーティリティ関数

#### 6.1 検索関連ユーティリティ
```javascript
// utils/search/
- searchUtils: 検索ロジック
- dateRangeUtils: 日時範囲処理
- filterUtils: フィルター処理
- sortUtils: ソート処理
```

#### 6.2 タグ関連ユーティリティ
```javascript
// utils/tags/
- tagNormalization: タグ正規化（日本語対応改善）
- tagStatistics: タグ統計計算
- tagAnalytics: タグ分析処理
```

## コンポーネント階層構造

```
TagSearchPage (pages/TagSearch.jsx)
├── TabPanel (検索タブ)
│   ├── AdvancedSearchForm
│   │   ├── TextSearchField
│   │   ├── StatusFilterTabs
│   │   ├── DateRangeSelector
│   │   ├── TagSearchField
│   │   ├── MemoContentSearchField
│   │   └── SortOptionsSelector
│   ├── SearchConditionManager
│   │   ├── SearchConditionChips
│   │   └── SearchHistoryList
│   └── SearchResults
│       ├── SearchResultStats
│       ├── SearchResultBookCard
│       ├── SearchResultMemoCard
│       └── SearchResultEmpty
└── TabPanel (タグ管理タブ)
    ├── TagStatistics
    │   ├── TagUsageChart
    │   └── TagCloud
    ├── TagList
    │   └── TagListItem
    │       └── TagChip
    └── TagManagementPanel
        ├── TagEditor
        ├── TagDeleteConfirm
        └── TagBulkActions
```

## データ構造設計

### 1. 検索条件
```typescript
interface SearchConditions {
  text: string;                    // テキスト検索
  status: 'all' | 'reading' | 'finished';
  dateRange: DateRange;            // 日時範囲
  memoContent: string;             // メモ内容検索
  selectedTags: string[];          // 選択されたタグ
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'author';
  sortOrder: 'asc' | 'desc';
}

interface DateRange {
  type: 'none' | 'year' | 'month' | 'quarter' | 'custom';
  year?: number;
  month?: number;
  quarter?: number;
  startDate?: Date;
  endDate?: Date;
}
```

### 2. タグ統計データ
```typescript
interface TagStatistics {
  tag: string;
  bookCount: number;    // そのタグを持つ本の数
  memoCount: number;    // そのタグを持つメモの数
  lastUsed: Date;       // 最後に使用された日時
  type: 'book' | 'memo' | 'both'; // タグの種類
}
```

### 3. 検索結果
```typescript
interface SearchResult {
  type: 'book' | 'memo';
  id: string;
  title: string;
  content?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // 本特有のフィールド
  author?: string;
  status?: string;
  finishedAt?: Date;
  // メモ特有のフィールド
  bookId?: string;
  bookTitle?: string;
  page?: number;
}
```

## 実装優先度

### Phase 1: 基本構造 ✅
1. **TagSearchPage** - メインページ ✅
2. **TabPanel** - タブ切り替え ✅
3. **TagList** + **TagListItem** - タグ一覧表示 ✅
4. **AdvancedSearchForm** - 基本検索フォーム ✅

### Phase 2: 検索機能 ✅
1. **DateRangeSelector** - 日時検索 ✅
2. **TagSearchField** - タグ検索 ✅
3. **MemoContentSearchField** - メモ検索 ✅
4. **SearchResults** - 検索結果表示 ✅

### Phase 3: 高度な機能（実装予定）
1. **TagManagementPanel** - タグ管理
   - タグ編集・削除ダイアログ
   - タグ正規化・統合機能
   - 一括操作機能
2. **SearchConditionManager** - 検索条件管理
   - 検索条件の保存・復元
   - 検索履歴の管理
   - クイック検索機能
3. **SortOptionsSelector** - ソート機能
   - 複数条件でのソート
   - ソート条件の保存

### Phase 4: 高度なUI/UX機能（将来実装）
1. **TagCloud** - タグクラウド表示
2. **TagUsageChart** - 使用頻度チャート
3. **TagBulkActions** - 一括操作
4. **SearchHistoryList** - 検索履歴一覧

## 技術的考慮事項

### 1. コンポーネント設計原則
- **単一責任**: 各コンポーネントは一つの機能に集中
- **再利用性**: 汎用的なコンポーネントとして設計
- **テスト容易性**: 独立してテスト可能な構造
- **型安全性**: TypeScript対応を考慮

### 2. パフォーマンス考慮
- **メモ化**: React.memo、useMemo、useCallbackの活用
- **遅延読み込み**: 必要に応じてコンポーネントの遅延読み込み
- **仮想化**: 大量データの場合は仮想化リスト

### 3. 状態管理
- **ローカル状態**: コンポーネント固有の状態
- **共有状態**: 検索条件等はContextまたはカスタムフック
- **永続化**: URLパラメータでの検索条件保存

### 4. データ整合性
- **タグ正規化**: 日本語対応の改善
- **統計データ**: タグ使用時に統計を自動更新
- **検索結果**: リアルタイムでの結果更新

### 5. タグ一覧管理機能の実装方針（2025-08-11追加）
- **データ構造設計**
  - tagStatsコレクション: タグ統計データの事前計算
  - searchHistoryコレクション: 検索履歴の保存
  - tagAliasesコレクション: タグの別名・正規化マッピング
- **パフォーマンス最適化**
  - タグ統計の事前計算とキャッシュ
  - 遅延読み込みによる初期表示高速化
  - 仮想化リストによる大量データ対応
- **UI/UX設計**
  - ドラッグ&ドロップでのタグ並び替え
  - フィルタリング・ソート機能
  - レスポンシブデザイン対応
  - アクセシビリティ対応（ARIA属性、キーボードナビ）
- **エラーハンドリング**
  - ネットワークエラー時のフォールバック
  - データ不整合時の自動修復
  - ユーザーフレンドリーなエラーメッセージ

## 統合のメリット

1. **機能の整理**: 検索とタグ関連の機能を一箇所に集約
2. **実装効率**: 段階的な実装でリスクを最小化
3. **ユーザビリティ**: 検索とタグ管理が自然に連携
4. **保守性**: 関連機能の統合管理

## 現在の状況

### 実装済み機能 ✅
- 本一覧ページでの基本検索（タイトル・著者・タグ） ✅
- タグ履歴管理（useTagHistoryフック） ✅
- タグ編集機能（BookTagEditorコンポーネント） ✅
- **高度な検索機能** ✅
  - DateRangeSelector（日時範囲選択） ✅
  - TagSearchField（タグ検索） ✅
  - MemoContentSearchField（メモ内容検索） ✅
- **検索・タグページの統合UI** ✅
  - TagSearchPage（メインページ） ✅
  - TabPanel（タブ切り替え） ✅
  - AdvancedSearchForm（高度な検索フォーム） ✅
- **検索結果表示機能** ✅
  - SearchResultsコンポーネントの実装 ✅
  - useSearchフックの実装（Firestore検索ロジック） ✅
  - タグ検索エラーの修正（ネスト配列エラー対応） ✅
  - クライアントサイドフィルタリングの強化 ✅
  - 自動フォールバック処理の実装 ✅
- **タグ管理機能** ✅
  - useTagStatsフックの実装（タグ統計データ取得・処理） ✅
  - TagStatsコンポーネントの実装（タグ使用頻度表示） ✅
  - タグクリック検索機能の実装（検索タブ連携） ✅
  - 状態管理の最適化（親コンポーネントへのリフト） ✅
- **テスト修正・改善** ✅
  - AdvancedSearchForm.test.jsxの修正 ✅
  - TagSearchField.jsxのReact key警告修正 ✅
  - SearchResults.jsxのMUI Grid v2警告修正 ✅
  - DateRangeSelector.jsxのMUI Grid v2警告修正 ✅
  - data-testidの追加（Gridコンポーネント） ✅
  - useSearch.test.jsの作成（14個のテストケース） ✅
  - useTagStats.test.jsの作成（8個のテストケース） ✅
  - TagStats.test.jsxの作成（6個のテストケース） ✅
  - TagSearch.test.jsxの作成（8個のテストケース） ✅

### 未実装機能
- タグ管理機能（編集・削除・正規化）
- 検索条件の保存・履歴機能
- ソート機能（SortOptionsSelector）
- 日本語タグ正規化の改善（連続スペースの正規化等）

## 次のステップ

### 短期目標（優先度順）
1. **タグ管理機能の拡張**
   - タグ編集・削除ダイアログの実装
   - タグ正規化・統合機能の実装
   - タグ一括操作機能の実装

2. **スキップされたテストの修正**
   - AdvancedSearchFormのテキストフィルダーテスト
   - BarcodeScannerのテスト

3. **ソート機能の実装**
   - SortOptionsSelectorコンポーネントの実装
   - 複数条件でのソート機能

### 中期目標
1. **検索条件管理機能**
   - 検索条件の保存・復元機能
   - 検索履歴の管理機能
   - クイック検索機能

2. **共通フックの完成**
   - useBook.js、useMemo.jsの実装
   - 重複コードの解消

3. **UI/UX改善**
   - アクセシビリティの向上
   - アニメーション効果の追加
   - レスポンシブデザインの改善

### 長期目標
1. **高度なUI/UX機能**
   - タグクラウド表示
   - 使用頻度チャート
   - ドラッグ&ドロップでのタグ並び替え

2. **パフォーマンス最適化**
   - 仮想化リストの実装
   - キャッシュ機能の強化
   - 遅延読み込みの最適化

---

**作成日**: 2024-08-03  
**更新日**: 2024-12-19  
**最終更新**: 2025-08-11（タグ一覧管理機能実装方針追加、次のステップ追加）  
**作成者**: AI Assistant 