# コンポーネント設計ガイドライン

## 目的

このガイドラインは、BookMemoプロジェクトにおけるコンポーネント設計のベストプラクティスと、過去の問題から学んだ教訓をまとめたものです。

**作成背景**: 全文検索タブ実装時に発生した「検索結果クリック動作不具合」を教訓として作成（2025-10-18）

---

## 必須propsの扱い

### 原則

1. **機能的に必須のpropsは、PropTypesで明示する**
2. **デフォルト動作を提供できる場合は、専用フックで提供する**
3. **開発環境で適切な警告を表示する**

### 例: SearchResults

#### ❌ 悪い例: 暗黙の依存

```jsx
// onResultClickが実際には必須なのに、オプショナルに見える
SearchResults.propTypes = {
  onResultClick: PropTypes.func  // オプショナルに見える
};

function SearchResults({ onResultClick }) {
  // オプショナルチェーン（?.）でエラーを隠蔽
  return (
    <Card onClick={() => onResultClick?.('book', bookId)}>
      {/* サイレントに失敗する */}
    </Card>
  );
}
```

**問題点**:
- onResultClickが未定義でもエラーが出ない
- クリックしても何も起こらない（ユーザー体験が悪い）
- デバッグが困難（なぜ動かないのかわからない）

---

#### ✅ 良い例: 明示的な必須 + デフォルト動作

```jsx
// PropTypesで必須を明示
SearchResults.propTypes = {
  onResultClick: PropTypes.func.isRequired
};

// デフォルト動作を提供
function SearchResults({ onResultClick }) {
  const navigate = useNavigate();
  
  const defaultHandler = (type, bookId, memoId) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SearchResults] Using default behavior');
    }
    
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else {
      navigate(`/book/${bookId}?memo=${memoId}`);
    }
  };
  
  const handler = onResultClick || defaultHandler;
  
  return (
    <Card onClick={() => handler('book', bookId)}>
      {/* 必ず何らかの動作をする */}
    </Card>
  );
}
```

---

#### ✅ 最良の例: 専用フックで標準動作を提供

```jsx
// SearchResults.jsx
SearchResults.propTypes = {
  onResultClick: PropTypes.func.isRequired  // 厳しく - 必須
};

// useSearchResultHandler.jsx（専用フック）
export function useSearchResultHandler(results) {
  const navigate = useNavigate();
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  
  const handleResultClick = useCallback((type, bookId, memoId) => {
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else {
      // メモダイアログを開く
      setMemoDialogOpen(true);
      // ...
    }
  }, [navigate, results]);
  
  const MemoDialog = useCallback(() => (
    <MemoEditor open={memoDialogOpen} ... />
  ), [memoDialogOpen, ...]);
  
  return { handleResultClick, MemoDialog };
}

// 使用例（たった2行！）
function MySearchPage() {
  const { results } = useSearch();
  const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
  
  return (
    <>
      <SearchResults results={results} onResultClick={handleResultClick} />
      <MemoDialog />
    </>
  );
}
```

**メリット**:
- ✅ PropTypesは厳しく（必須）→ 渡し忘れを防ぐ
- ✅ フックで標準動作を簡単に提供→ ボイラープレート最小
- ✅ カスタマイズ可能→ フックを使わないこともできる
- ✅ テストしやすい→ SearchResultsとフックを独立してテスト
- ✅ React的な設計→ フックの活用

---

## コンポーネントの責任

### 単一責任の原則

各コンポーネントは1つの明確な責任を持つべきです。

#### ❌ 悪い例: 責任が大きすぎる

```jsx
function SearchResults({ results }) {
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  
  return (
    <>
      <Box>
        {/* 検索結果表示 */}
      </Box>
      <MemoEditor open={memoDialogOpen} ... />
    </>
  );
}
```

**問題点**:
- SearchResultsが「表示」と「状態管理」と「ダイアログ」の3つの責任を持つ
- テストが複雑（MemoEditorをモック）
- 再利用性が低い

---

#### ✅ 良い例: 責任を分離

```jsx
// SearchResults.jsx（表示のみ）
function SearchResults({ results, onResultClick }) {
  return (
    <Box>
      <Card onClick={() => onResultClick('book', bookId)}>
        {/* 表示だけ */}
      </Card>
    </Box>
  );
}

// useSearchResultHandler.jsx（ロジックと状態管理）
export function useSearchResultHandler(results) {
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  
  const handleResultClick = (type, bookId, memoId) => {
    // ロジックと状態管理
  };
  
  const MemoDialog = () => <MemoEditor ... />;
  
  return { handleResultClick, MemoDialog };
}
```

**メリット**:
- ✅ 各部分が1つの責任のみ
- ✅ テストしやすい
- ✅ 再利用性が高い

---

## 状態管理の場所

### 原則: 自己完結を基本とする

可能な限り、コンポーネントは自己完結させ、親コンポーネントへの依存を最小化します。

#### ❌ 悪い例: 親が全ての状態を管理

```jsx
// TagSearch.jsx（親）
function TagSearch() {
  const [fullTextSearchOpen, setFullTextSearchOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [memoDialogOpen1, setMemoDialogOpen1] = useState(false);
  const [memoDialogOpen2, setMemoDialogOpen2] = useState(false);
  // ... 状態が爆発
  
  return (
    <>
      <FullTextSearch isOpen={fullTextSearchOpen} ... />
      <AdvancedSearch isOpen={advancedSearchOpen} ... />
      <MemoDialog1 open={memoDialogOpen1} ... />
      <MemoDialog2 open={memoDialogOpen2} ... />
    </>
  );
}
```

**問題点**:
- 親コンポーネントが複雑化
- 状態管理が煩雑
- バグの温床

---

#### ✅ 良い例: 各コンポーネントが自己完結

```jsx
// TagSearch.jsx（親）
function TagSearch() {
  return (
    <>
      <FullTextSearch />  {/* 自己完結 */}
      <AdvancedSearch />  {/* 自己完結 */}
      <TagManagement />   {/* 自己完結 */}
    </>
  );
}

// FullTextSearch.jsx（子）
function FullTextSearch() {
  const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
  
  return (
    <>
      <SearchResults onResultClick={handleResultClick} />
      <MemoDialog />
    </>
  );
}
```

**メリット**:
- ✅ 親がシンプル
- ✅ 各コンポーネントが独立
- ✅ テストしやすい

---

## インターフェースの一貫性

### 原則: 共通の型定義を使う

同じ目的のpropsは、プロジェクト全体で統一したインターフェースを使います。

#### ❌ 悪い例: インターフェースの不一致

```jsx
// ComponentA
<SearchResults onResultClick={(type, bookId, memoId) => {}} />

// ComponentB
<SearchResults 
  onBookClick={(bookId) => {}}
  onMemoClick={(bookId, memoId) => {}}
/>
```

**問題点**:
- 変換が必要で複雑
- 使う側が混乱する

---

#### ✅ 良い例: 統一されたインターフェース

```jsx
// 共通の型定義（JSDocまたはTypeScript）
/**
 * @typedef {Function} ResultClickHandler
 * @param {'book' | 'memo'} type - 結果の種類
 * @param {string} bookId - 書籍ID
 * @param {string} [memoId] - メモID（typeが'memo'の場合は必須）
 */

// すべてのコンポーネントで統一
<SearchResults onResultClick={handler} />
<FullTextSearch onResultClick={handler} />
<AdvancedSearch onResultClick={handler} />
```

**メリット**:
- ✅ 一貫性がある
- ✅ 理解しやすい
- ✅ 再利用しやすい

---

## オプショナルチェーンの使用

### 原則: 必須の処理には使わない

オプショナルチェーン（`?.`）は便利ですが、必須の処理には使うべきではありません。

#### ❌ 悪い例: 必須処理にオプショナルチェーン

```jsx
<Card onClick={() => onResultClick?.('book', bookId)}>
  {/* onResultClickがundefinedの場合、何も起こらない */}
  {/* エラーも出ないので、デバッグが困難 */}
</Card>
```

**問題点**:
- サイレントに失敗する
- ユーザーには「クリックしても何も起こらない」ように見える
- エラーログにも記録されない

---

#### ✅ 良い例: デフォルト動作またはエラーハンドリング

```jsx
// パターン1: デフォルト動作を提供
const handler = onResultClick || defaultHandler;
<Card onClick={() => handler('book', bookId)}>
  {/* 必ず何らかの動作をする */}
</Card>

// パターン2: 明示的なチェック
<Card onClick={() => {
  if (!onResultClick) {
    console.error('[SearchResults] onResultClick is required but not provided');
    return;
  }
  onResultClick('book', bookId);
}}>
  {/* エラーログを出力 */}
</Card>
```

**メリット**:
- ✅ 問題が明確になる
- ✅ デバッグしやすい
- ✅ ユーザー体験が良い

---

## カスタムフックの活用

### 原則: 共通ロジックはフックに切り出す

複数のコンポーネントで使う共通ロジックは、カスタムフックとして切り出します。

#### useSearchResultHandlerの設計パターン

```jsx
// hooks/useSearchResultHandler.jsx
export function useSearchResultHandler(results) {
  const navigate = useNavigate();
  const [state, setState] = useState(...);
  
  const handler = useCallback((...) => {
    // 共通ロジック
  }, [dependencies]);
  
  const Component = useCallback(() => (
    <JSXComponent />
  ), [dependencies]);
  
  return {
    handler,
    state,
    Component
  };
}
```

**メリット**:
- ✅ ロジックの再利用
- ✅ テストしやすい（フックとコンポーネントを独立してテスト）
- ✅ ボイラープレートの削減
- ✅ 一貫性のある実装

---

## テスト戦略

### 必須のテストケース

すべてのコンポーネントとフックは、以下のテストケースを含むべきです：

1. **正常系**: 期待通りの動作をするか
2. **異常系**: propsが未定義でもエラーが出ないか
3. **エッジケース**: 空配列、null、undefinedなど
4. **デフォルト動作**: デフォルト値が正しく適用されるか

### 例: SearchResults

```jsx
describe('SearchResults', () => {
  // 1. 正常系
  it('結果を正しく表示する', () => {});
  it('クリック時にonResultClickを呼ぶ', () => {});
  
  // 2. 異常系
  it('onResultClickが未定義でもエラーが出ない', () => {});
  it('resultsがnullでもエラーが出ない', () => {});
  
  // 3. エッジケース
  it('resultsが空配列の場合、メッセージを表示', () => {});
  it('resultsが混在している場合、両方を表示', () => {});
  
  // 4. デフォルト動作
  it('onResultClickが未定義の場合、デフォルト動作を実行', () => {});
});
```

---

## PropTypesの使用方法

### 基本的な型定義

```jsx
import PropTypes from 'prop-types';

ComponentName.propTypes = {
  // 必須のprops
  requiredProp: PropTypes.string.isRequired,
  
  // オプショナルのprops
  optionalProp: PropTypes.string,
  
  // 複雑な型
  complexProp: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['type1', 'type2']).isRequired
  }),
  
  // 配列
  arrayProp: PropTypes.arrayOf(PropTypes.string),
  
  // 関数
  callbackProp: PropTypes.func.isRequired,
  
  // ユニオン型
  unionProp: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
};

ComponentName.defaultProps = {
  optionalProp: 'default value',
  arrayProp: []
  // 必須propsはdefaultPropsに含めない
};
```

---

### Firebase Timestampの扱い

Firebase Timestampは、シリアライズ後に異なる型になる可能性があります。

```jsx
PropTypes.oneOfType([
  PropTypes.object,             // Firebase Timestamp（.toDate()あり）
  PropTypes.string,             // LocalStorageから復元後（JSON文字列）
  PropTypes.instanceOf(Date)    // 通常のDateオブジェクト
])
```

コンポーネント内での安全な処理：

```jsx
// 安全な日付レンダリング
{timestamp 
  ? (typeof timestamp.toDate === 'function' 
      ? new Date(timestamp.toDate()).toLocaleDateString('ja-JP')
      : new Date(timestamp).toLocaleDateString('ja-JP'))
  : '不明'}
```

---

## コンポーネント設計パターン

### パターン1: プレゼンテーションコンポーネント

状態を持たず、propsのみで動作するコンポーネント。

```jsx
function SearchResults({ results, loading, onResultClick }) {
  // 状態なし（useState なし）
  // ロジックなし（複雑な計算なし）
  // 表示のみ
  
  return <Box>{/* 表示 */}</Box>;
}
```

**用途**: 再利用性の高い、テストしやすいコンポーネント

---

### パターン2: コンテナコンポーネント

状態とロジックを持つコンポーネント。

```jsx
function FullTextSearch() {
  const { results, loading } = useFullTextSearch();  // ロジック
  const { handleResultClick, MemoDialog } = useSearchResultHandler(results);  // 状態管理
  
  return (
    <>
      <SearchResults results={results} onResultClick={handleResultClick} />
      <MemoDialog />
    </>
  );
}
```

**用途**: プレゼンテーションコンポーネントを組み合わせて機能を提供

---

### パターン3: カスタムフック

共通ロジックを提供するフック。

```jsx
export function useCustomLogic(data) {
  const [state, setState] = useState(...);
  
  const handler = useCallback((...) => {
    // ロジック
  }, [dependencies]);
  
  return { handler, state };
}
```

**用途**: ロジックの再利用、状態管理のカプセル化

---

## ドキュメンテーション

### JSDocの記述

すべてのコンポーネントとフックには、詳細なJSDocを記述します。

```jsx
/**
 * ComponentName - コンポーネントの説明
 * 
 * 詳細な説明。使用方法、注意点など。
 * 
 * @param {Object} props
 * @param {string} props.requiredProp - 必須プロパティの説明（必須）
 * @param {string} [props.optionalProp] - オプショナルプロパティの説明
 * @param {Function} props.callback - コールバックの説明（必須）
 *   - 型: (arg1: string, arg2: number) => void
 *   - 詳細な説明
 * 
 * @example
 * // 基本的な使用方法
 * <ComponentName 
 *   requiredProp="value"
 *   callback={(arg1, arg2) => {}}
 * />
 * 
 * @example
 * // 高度な使用方法
 * <ComponentName 
 *   requiredProp="value"
 *   optionalProp="custom"
 *   callback={customHandler}
 * />
 */
```

---

## チェックリスト

新しいコンポーネントを作成する際は、以下をチェックしてください：

### 設計
- [ ] 単一責任の原則を守っているか？
- [ ] 状態管理は適切な場所にあるか？
- [ ] 既存のコンポーネントと一貫性があるか？

### Props
- [ ] 必須のpropsはPropTypes.isRequiredで明示されているか？
- [ ] デフォルト動作は提供されているか（または専用フックがあるか）？
- [ ] propsの命名は他のコンポーネントと統一されているか？

### エラーハンドリング
- [ ] オプショナルチェーン（?.）を必須処理に使っていないか？
- [ ] 開発環境で適切な警告が表示されるか？
- [ ] エラー時の動作は明確か？

### テスト
- [ ] 正常系のテストがあるか？
- [ ] 異常系（props未定義）のテストがあるか？
- [ ] エッジケース（空配列、nullなど）のテストがあるか？
- [ ] デフォルト動作のテストがあるか？

### ドキュメント
- [ ] JSDocが記述されているか？
- [ ] 使用例（@example）が記述されているか？
- [ ] 必須propsと型が明記されているか？

---

## 参考資料

### 関連ドキュメント
- `doc/analysis-search-result-click-issue.md` - 問題の原因分析
- `doc/implementation-plan-search-result-safety.md` - 実施計画
- `doc/discussion-proptypes-default-behavior.md` - 技術的検討

### 参考実装
- `src/components/search/SearchResults.jsx` - プレゼンテーションコンポーネントの例
- `src/hooks/useSearchResultHandler.jsx` - カスタムフックの例
- `src/components/search/FullTextSearch.jsx` - コンテナコンポーネントの例

---

**作成日**: 2025年10月18日  
**作成者**: AI開発アシスタント (Cursor)  
**目的**: 検索結果クリック動作不具合を教訓とした設計ガイドライン策定

