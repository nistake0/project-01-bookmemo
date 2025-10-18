# PropTypes厳密化とデフォルト動作の技術的検討

## 議論の背景

**ユーザーの要望**:
- PropTypesは厳しい対応（`onResultClick: PropTypes.func.isRequired`）
- しかし、デフォルト動作も提供したい
  - 書籍カード → 書籍詳細ページ
  - メモカード → メモ詳細ダイアログ

**検討課題**:
- この2つの要求は技術的に両立可能か？
- モジュール化や依存関係で問題はないか？

---

## 技術的な課題分析

### 課題1: メモダイアログの状態管理

メモ詳細ダイアログを開くには、以下の状態が必要：

```jsx
const [memoDialogOpen, setMemoDialogOpen] = useState(false);
const [selectedMemo, setSelectedMemo] = useState(null);
const [selectedMemoBookId, setSelectedMemoBookId] = useState(null);
```

**問題**: この状態を`SearchResults`コンポーネントが持つべきか？

---

### 課題2: MemoEditorコンポーネントの配置

デフォルト動作でダイアログを開くには、`SearchResults`が`MemoEditor`を含む必要がある：

```jsx
// SearchResults.jsx
function SearchResults({ results, loading, searchQuery, onResultClick }) {
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  
  const defaultHandler = (type, bookId, memoId) => {
    if (type === 'memo') {
      const memo = results.find(r => r.type === 'memo' && r.id === memoId);
      setSelectedMemo(memo);
      setMemoDialogOpen(true);  // ダイアログを開く
    }
  };
  
  return (
    <Box>
      {/* 検索結果表示 */}
      
      {/* デフォルト動作のためのダイアログ */}
      <MemoEditor 
        open={memoDialogOpen}
        memo={selectedMemo}
        onClose={() => setMemoDialogOpen(false)}
      />
    </Box>
  );
}
```

**設計上の問題**:
1. **責任の範囲**: `SearchResults`は「結果を表示する」コンポーネント。ダイアログの管理まで含むべきか？
2. **状態管理**: プレゼンテーション層のコンポーネントが状態を持つべきか？
3. **依存関係**: `SearchResults`が`MemoEditor`に依存する。単体テストが複雑になる。

---

### 課題3: 依存関係の増加

デフォルト動作を実装すると、`SearchResults`の依存関係が増加：

```
SearchResults.jsx
├── react-router-dom (useNavigate)
├── MemoEditor コンポーネント
├── useState フック（状態管理）
└── 検索結果データ
```

**問題**:
- テストが複雑になる（MemoEditorをモックする必要）
- コンポーネントの責任が曖昧になる
- 再利用性が低下

---

## 解決策の検討

### 案1: SearchResults内部で完結させる（非推奨）❌

#### 実装例
```jsx
// SearchResults.jsx
function SearchResults({ results, loading, searchQuery }) {
  const navigate = useNavigate();
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  
  const handleResultClick = (type, bookId, memoId) => {
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else {
      const memo = results.find(r => r.type === 'memo' && r.id === memoId);
      setSelectedMemo(memo);
      setMemoDialogOpen(true);
    }
  };
  
  return (
    <>
      <Box>
        {/* 結果表示 */}
        <Card onClick={() => handleResultClick('book', bookId)}>
          {/* ... */}
        </Card>
      </Box>
      
      <MemoEditor 
        open={memoDialogOpen}
        memo={selectedMemo}
        onClose={() => setMemoDialogOpen(false)}
      />
    </>
  );
}

// onResultClickは不要（内部で処理）
SearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  searchQuery: PropTypes.string
  // onResultClick: なし
};
```

#### メリット
- ✅ 使う側は`<SearchResults results={results} />`だけで完結
- ✅ ボイラープレートコードが不要

#### デメリット
- ❌ `SearchResults`の責任が大きすぎる（表示 + 状態管理 + ダイアログ）
- ❌ カスタマイズができない（メモクリック時の挙動を変えられない）
- ❌ テストが複雑（MemoEditorをモック、navigateをモック）
- ❌ 単一責任の原則に違反
- ❌ 今後の拡張性が低い

**判定**: 設計的に問題が多く、非推奨。

---

### 案2: SearchResultsWrapperコンポーネントを作る

#### 実装例
```jsx
// SearchResultsWrapper.jsx
/**
 * SearchResultsにデフォルト動作を提供するラッパーコンポーネント
 */
export default function SearchResultsWrapper({ results, loading, searchQuery }) {
  const navigate = useNavigate();
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  
  const handleResultClick = (type, bookId, memoId) => {
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else {
      const memo = results.find(r => r.type === 'memo' && r.id === memoId);
      setSelectedMemo(memo);
      setMemoDialogOpen(true);
    }
  };
  
  return (
    <>
      <SearchResults 
        results={results}
        loading={loading}
        searchQuery={searchQuery}
        onResultClick={handleResultClick}
      />
      <MemoEditor 
        open={memoDialogOpen}
        memo={selectedMemo}
        onClose={() => setMemoDialogOpen(false)}
      />
    </>
  );
}

// SearchResults.jsx は変更なし
SearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  searchQuery: PropTypes.string,
  onResultClick: PropTypes.func.isRequired  // 必須
};
```

#### 使用例
```jsx
// シンプルに使いたい場合
<SearchResultsWrapper results={results} />

// カスタマイズしたい場合
<SearchResults 
  results={results} 
  onResultClick={customHandler}
/>
```

#### メリット
- ✅ `SearchResults`はシンプル（表示のみ）
- ✅ ラッパーで状態管理とダイアログを担当（責任分離）
- ✅ カスタマイズ可能（SearchResultsを直接使える）
- ✅ テストしやすい（それぞれ独立）

#### デメリット
- ⚠️ コンポーネントが2つになる（学習コスト）
- ⚠️ 「デフォルト動作」というより「便利なラッパー」

**判定**: 設計的には良いが、2つのコンポーネントを使い分ける必要がある。

---

### 案3: カスタムフック `useSearchResultHandler` を提供（推奨）✅

#### 実装例
```jsx
// hooks/useSearchResultHandler.js
/**
 * 検索結果のクリックハンドラーとメモダイアログ管理を提供するフック
 * 
 * @param {Array} results - 検索結果配列
 * @returns {Object} ハンドラーと状態
 * 
 * @example
 * function MyPage() {
 *   const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
 *   
 *   return (
 *     <>
 *       <SearchResults results={results} onResultClick={handleResultClick} />
 *       <MemoDialog />
 *     </>
 *   );
 * }
 */
export function useSearchResultHandler(results) {
  const navigate = useNavigate();
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedMemoBookId, setSelectedMemoBookId] = useState(null);
  
  const handleResultClick = useCallback((type, bookId, memoId) => {
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else if (type === 'memo') {
      const memo = results.find(r => r.type === 'memo' && r.id === memoId);
      if (memo) {
        setSelectedMemo(memo);
        setSelectedMemoBookId(bookId);
        setMemoDialogOpen(true);
      } else {
        // フォールバック: メモが見つからない場合は書籍詳細へ
        navigate(`/book/${bookId}?memo=${memoId}`);
      }
    }
  }, [navigate, results]);
  
  const closeMemoDialog = useCallback(() => {
    setMemoDialogOpen(false);
    setSelectedMemo(null);
    setSelectedMemoBookId(null);
  }, []);
  
  // MemoDialogコンポーネントを返す（JSXではなく、関数コンポーネント）
  const MemoDialog = useCallback(() => (
    <MemoEditor 
      open={memoDialogOpen}
      memo={selectedMemo}
      bookId={selectedMemoBookId}
      onClose={closeMemoDialog}
      onUpdate={closeMemoDialog}
      onDelete={closeMemoDialog}
    />
  ), [memoDialogOpen, selectedMemo, selectedMemoBookId, closeMemoDialog]);
  
  return {
    handleResultClick,
    memoDialogOpen,
    selectedMemo,
    selectedMemoBookId,
    closeMemoDialog,
    MemoDialog
  };
}
```

#### SearchResults.jsx
```jsx
// SearchResults.jsx（変更なし）
SearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  searchQuery: PropTypes.string,
  onResultClick: PropTypes.func.isRequired  // 必須
};
```

#### 使用例
```jsx
// 例1: FullTextSearch.jsx
function FullTextSearch() {
  const { results, loading, ... } = useFullTextSearch();
  const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
  
  return (
    <Box>
      <SearchResults 
        results={results}
        loading={loading}
        onResultClick={handleResultClick}
      />
      <MemoDialog />
    </Box>
  );
}

// 例2: TagSearch.jsx（詳細検索タブ）
function TagSearch() {
  const { results, loading, ... } = useSearch();
  const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
  
  return (
    <Box>
      <SearchResults 
        results={results}
        loading={loading}
        onResultClick={handleResultClick}
      />
      <MemoDialog />
    </Box>
  );
}

// 例3: カスタムハンドラーを使いたい場合
function CustomSearch() {
  const { results } = useSearch();
  
  const customHandler = (type, bookId, memoId) => {
    // カスタム処理
    console.log('Custom click handler');
  };
  
  return (
    <SearchResults 
      results={results}
      onResultClick={customHandler}
    />
  );
}
```

#### メリット
- ✅ `SearchResults`はシンプル（表示のみ、状態なし）
- ✅ フックで標準的な動作を提供（ボイラープレート削減）
- ✅ カスタマイズ可能（フックを使わなくても良い）
- ✅ テストしやすい（SearchResultsとフックを独立してテスト）
- ✅ 単一責任の原則を維持
- ✅ 再利用性が高い
- ✅ React的な設計（フックの活用）

#### デメリット
- ⚠️ フックの存在を知る必要がある（ドキュメント必須）
- ⚠️ 若干のボイラープレート（`const { handleResultClick, MemoDialog } = useSearchResultHandler(results);`）

**判定**: 設計的にクリーンで、柔軟性も高い。推奨。

---

## 案の比較表

| 観点 | 案1: SearchResults内部 | 案2: Wrapper | 案3: カスタムフック |
|------|----------------------|--------------|-------------------|
| **SearchResultsのシンプルさ** | ❌ 複雑（状態+ダイアログ） | ✅ シンプル | ✅ シンプル |
| **責任の分離** | ❌ 違反 | ✅ 明確 | ✅ 明確 |
| **カスタマイズ性** | ❌ 低い | ✅ 高い | ✅ 高い |
| **テストのしやすさ** | ❌ 複雑 | ✅ 容易 | ✅ 容易 |
| **使いやすさ** | ✅ 最も簡単 | ⚠️ 2つのコンポーネント | ⚠️ フックの知識必要 |
| **ボイラープレート** | ✅ 最小 | ⚠️ 中程度 | ⚠️ 中程度 |
| **React的な設計** | ❌ 古い設計 | ✅ 良い | ✅ 最も良い |
| **拡張性** | ❌ 低い | ✅ 高い | ✅ 高い |
| **依存関係** | ❌ 多い | ✅ 少ない | ✅ 少ない |

---

## 推奨案: 案3（カスタムフック）+ PropTypes.func.isRequired

### 実装方針

#### 1. SearchResults.jsx
```jsx
SearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  searchQuery: PropTypes.string,
  onResultClick: PropTypes.func.isRequired  // 厳しい: 必須
};

// デフォルトpropsは設定しない（必須なので）
```

#### 2. useSearchResultHandler.js（新規）
標準的なクリックハンドラーとメモダイアログ管理を提供。

#### 3. 既存コンポーネントの修正
```jsx
// FullTextSearch.jsx
// Before
const handleResultClick = (type, bookId, memoId) => { ... };
const [memoDialogOpen, setMemoDialogOpen] = useState(false);
// ...

// After
const { handleResultClick, MemoDialog } = useSearchResultHandler(results);

return (
  <>
    <SearchResults results={results} onResultClick={handleResultClick} />
    <MemoDialog />
  </>
);
```

#### 4. ドキュメント
- `useSearchResultHandler`の使用方法を明記
- JSDocで詳細な説明
- 設計ガイドラインに記載

---

## モジュール化・依存関係の評価

### ✅ 良い点

#### 1. 依存関係がクリーン
```
SearchResults.jsx
└── onResultClick prop のみ依存（関数）

useSearchResultHandler.js
├── react-router-dom (useNavigate)
├── react (useState, useCallback)
└── MemoEditor コンポーネント

→ SearchResults は MemoEditor に依存しない
```

#### 2. テスト戦略が明確
```jsx
// SearchResults.test.jsx
it('onResultClickが呼ばれる', () => {
  const mockOnResultClick = jest.fn();
  render(<SearchResults results={[...]} onResultClick={mockOnResultClick} />);
  // ... テスト
});

// useSearchResultHandler.test.js
it('書籍クリック時にnavigateを呼ぶ', () => {
  const { result } = renderHook(() => useSearchResultHandler([...]));
  act(() => result.current.handleResultClick('book', 'book1'));
  expect(mockNavigate).toHaveBeenCalledWith('/book/book1');
});
```

#### 3. 再利用性
- `SearchResults`は他のページでも使える
- `useSearchResultHandler`も他の場所で使える
- 2つを組み合わせても、独立して使っても良い

---

### ⚠️ 注意点

#### 1. フックの学習コスト
開発者は`useSearchResultHandler`の存在を知る必要がある。

**対策**: ドキュメント化、JSDoc、設計ガイドライン

#### 2. ボイラープレート
各ページで以下を書く必要がある：
```jsx
const { handleResultClick, MemoDialog } = useSearchResultHandler(results);
```

**評価**: 2行程度なので許容範囲。逆に、この明示性が理解しやすさにつながる。

#### 3. PropTypes.func.isRequired の厳しさ
`onResultClick`を渡し忘れると、即座にエラー。

**評価**: これは意図通り。フックを使えば簡単に対応できる。

---

## 代替案の再検討: 「緩い」PropTypes + デフォルト動作（navigate）

もし「メモダイアログ」が技術的に難しいなら、以下の妥協案もあります：

### 妥協案: デフォルト動作は navigate のみ

```jsx
// SearchResults.jsx
function SearchResults({ results, loading, searchQuery, onResultClick }) {
  const navigate = useNavigate();
  
  const defaultOnResultClick = (type, bookId, memoId) => {
    console.warn('[SearchResults] onResultClick not provided, using default navigation');
    
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else {
      // メモの場合は、書籍詳細 + クエリパラメータ
      navigate(`/book/${bookId}?memo=${memoId}`);
    }
  };
  
  const handleResultClick = onResultClick || defaultOnResultClick;
  
  // ...
}

SearchResults.propTypes = {
  onResultClick: PropTypes.func  // オプショナル
};
```

#### この場合
- ✅ SearchResultsはシンプルなまま
- ✅ デフォルト動作あり（ただしダイアログは開かない）
- ⚠️ メモクリック時の挙動が統一されない

**評価**: 
- デフォルト動作は提供できるが、ダイアログは開けない
- 「どの画面でも同じ動作」という要求は満たせない

---

## 最終推奨

### 推奨: 案3（カスタムフック）+ PropTypes.func.isRequired

#### 理由
1. ✅ **設計がクリーン**: SearchResultsは表示のみ、フックがロジックを担当
2. ✅ **テストしやすい**: 各部分を独立してテスト可能
3. ✅ **カスタマイズ可能**: フックを使わないこともできる
4. ✅ **React的**: フックの活用はReactのベストプラクティス
5. ✅ **拡張性**: 将来の変更に強い
6. ✅ **一貫性**: どのページでも同じパターンで実装できる

#### トレードオフ
- ⚠️ ボイラープレートが若干増える（2行程度）
- ⚠️ フックの存在を知る必要がある（ドキュメントで解決）

#### 実装スケジュール（Phase 3に追加）
```
Phase 3-A: デフォルト動作実装（navigate）       - 30分
Phase 3-B: useSearchResultHandlerの実装         - 30分
Phase 3-C: 既存コンポーネントへの適用          - 20分
Phase 3-D: フックのテスト追加                  - 20分
```

合計: Phase 3が60分 → 100分に増加（全体で40分増）

---

## 決定事項（提案）

### PropTypesの方針
```jsx
SearchResults.propTypes = {
  results: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  searchQuery: PropTypes.string,
  onResultClick: PropTypes.func.isRequired  // 厳しい: 必須
};
```

### デフォルト動作の提供方法
- ❌ SearchResults内部で完結（設計的に問題）
- ❌ SearchResultsWrapper（複雑）
- ✅ **useSearchResultHandler フック**（推奨）

### 実装内容
1. `useSearchResultHandler.js` を作成
2. 書籍クリック → navigate
3. メモクリック → ダイアログ表示
4. PropTypesは厳しく（必須）
5. ドキュメント整備

---

**この方針で進めてよろしいでしょうか？**

