# 検索結果クリック動作 - 安全性向上の実施計画

## 目的

検索結果クリック動作の安全性と保守性を向上させる。
特に、暗黙の依存関係を排除し、エラーが早期に発見できる設計に改善する。

**原則**:
- ✅ テストファーストで進める
- ✅ 既存機能を壊さない
- ✅ 段階的に改善する（ビッグバンリファクタリングを避ける）
- ✅ 各ステップで動作確認とテスト実行

---

## Phase 0: 現状分析と準備（30分）

### 0-1. 影響範囲の特定 ✅

#### 対象コンポーネント
- `SearchResults.jsx` - 中核コンポーネント
- `FullTextSearch.jsx` - 全文検索タブ
- `TagSearch.jsx` - 詳細検索タブ
- それぞれのテストファイル

#### 依存関係マップ
```
SearchResults.jsx
├── 使用場所1: FullTextSearch.jsx
│   └── 呼び出し元: TagSearch.jsx (FullTextSearchTab)
└── 使用場所2: TagSearch.jsx (AdvancedSearchTab)
    └── 直接使用
```

### 0-2. テストの現状確認

```bash
# SearchResults関連のテスト実行
npm test -- SearchResults

# FullTextSearch関連のテスト実行
npm test -- FullTextSearch

# TagSearch関連のテスト実行
npm test -- TagSearch
```

**確認事項**:
- [ ] 既存テストがすべてパスするか
- [ ] onResultClick未定義のケースがテストされているか
- [ ] エッジケースのカバレッジ

---

## Phase 1: テストの拡充（優先度：最高）⏱️ 60分

**方針**: まず、現在の動作を保証するテストを書く。これにより、後の変更が既存機能を壊さないことを保証できる。

### 1-1. SearchResults.test.jsx の拡充

#### 追加すべきテストケース

```jsx
describe('SearchResults - props validation', () => {
  describe('onResultClick prop', () => {
    it('onResultClickが渡された場合、クリック時に実行される', () => {
      const mockOnResultClick = jest.fn();
      const mockResults = [
        { id: 'book1', type: 'book', title: 'テスト本' }
      ];
      
      render(
        <SearchResults 
          results={mockResults}
          onResultClick={mockOnResultClick}
        />
      );
      
      fireEvent.click(screen.getByTestId('book-result-book1'));
      expect(mockOnResultClick).toHaveBeenCalledWith('book', 'book1');
    });
    
    it('onResultClickが未定義の場合、エラーが出ない（現在の動作）', () => {
      const mockResults = [
        { id: 'book1', type: 'book', title: 'テスト本' }
      ];
      
      // エラーが出ないことを確認
      expect(() => {
        render(
          <SearchResults 
            results={mockResults}
            // onResultClickを渡さない
          />
        );
      }).not.toThrow();
      
      // クリックしてもエラーが出ない
      expect(() => {
        fireEvent.click(screen.getByTestId('book-result-book1'));
      }).not.toThrow();
    });
    
    it('メモクリック時、onResultClickが未定義でもエラーが出ない', () => {
      const mockResults = [
        { 
          id: 'memo1', 
          type: 'memo', 
          bookId: 'book1',
          text: 'テストメモ',
          createdAt: new Date()
        }
      ];
      
      render(
        <SearchResults 
          results={mockResults}
          // onResultClickを渡さない
        />
      );
      
      expect(() => {
        fireEvent.click(screen.getByTestId('memo-result-memo1'));
      }).not.toThrow();
    });
  });
  
  describe('results prop validation', () => {
    it('resultsが空配列の場合、メッセージを表示', () => {
      render(<SearchResults results={[]} onResultClick={jest.fn()} />);
      expect(screen.getByText(/検索条件を設定して/)).toBeInTheDocument();
    });
    
    it('resultsがundefinedの場合、エラーが出ない', () => {
      expect(() => {
        render(<SearchResults results={undefined} onResultClick={jest.fn()} />);
      }).not.toThrow();
    });
  });
});
```

#### 実施手順

```bash
# 1. テストファイルを開く
# src/components/search/SearchResults.test.jsx

# 2. 上記のテストケースを追加

# 3. テスト実行（失敗することを確認 - Red）
npm test -- SearchResults

# 4. 現状を記録
# - どのテストがパスするか
# - どのテストが失敗するか
```

**期待される結果**:
- ✅ 「onResultClickが渡された場合」のテストはパス
- ✅ 「onResultClickが未定義」のテストもパス（エラーが出ないことを確認）
- ❓ 今後、デフォルト動作を実装したら、挙動が変わることを想定

---

### 1-2. FullTextSearch.test.jsx の拡充

#### 追加すべきテストケース

```jsx
describe('FullTextSearch - result click integration', () => {
  it('書籍結果をクリックすると、書籍詳細ページに遷移する', async () => {
    // モック設定
    useFullTextSearch.mockReturnValue({
      results: [
        { id: 'book1', type: 'book', title: 'テスト本' }
      ],
      loading: false,
      // ... other props
    });
    
    render(
      <BrowserRouter>
        <FullTextSearch />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByTestId('book-result-book1'));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/book/book1');
    });
  });
  
  it('メモ結果をクリックすると、メモダイアログが開く', async () => {
    useFullTextSearch.mockReturnValue({
      results: [
        { 
          id: 'memo1', 
          type: 'memo', 
          bookId: 'book1',
          text: 'テストメモ',
          createdAt: new Date()
        }
      ],
      loading: false,
      // ... other props
    });
    
    render(
      <BrowserRouter>
        <FullTextSearch />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByTestId('memo-result-memo1'));
    
    await waitFor(() => {
      expect(screen.getByTestId('memo-editor-dialog')).toBeInTheDocument();
    });
    
    // 遷移していないことを確認
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
```

---

### 1-3. TagSearch.test.jsx の拡充

#### 追加すべきテストケース

```jsx
describe('TagSearch - Advanced Search Tab result clicks', () => {
  it('詳細検索タブでメモをクリックすると、ダイアログが開く', async () => {
    const mockResults = [
      { 
        id: 'memo1', 
        type: 'memo', 
        bookId: 'book1',
        text: 'テストメモ',
        createdAt: new Date()
      }
    ];
    
    useSearch.mockReturnValue({
      results: mockResults,
      loading: false,
      error: null,
      executeSearch: jest.fn(),
      clearResults: jest.fn()
    });
    
    render(<TagSearch />);
    
    // 詳細検索タブに切り替え
    fireEvent.click(screen.getByTestId('advanced-search-tab'));
    
    // メモをクリック
    fireEvent.click(screen.getByTestId('result-0'));
    
    await waitFor(() => {
      expect(screen.getByTestId('memo-editor-dialog')).toBeInTheDocument();
    });
  });
});
```

---

## Phase 2: PropTypesの導入（優先度：高）⏱️ 30分

**方針**: まず、現在の動作を変えずに、型検証だけを追加する。

### 2-1. PropTypesパッケージの確認

```bash
# package.jsonを確認
grep "prop-types" package.json

# なければインストール
npm install --save prop-types
```

### 2-2. SearchResults.jsx への PropTypes 追加

```jsx
// SearchResults.jsx
import PropTypes from 'prop-types';

// ... コンポーネント定義 ...

SearchResults.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['book', 'memo']).isRequired,
      // 書籍の場合
      title: PropTypes.string,
      author: PropTypes.string,
      status: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      updatedAt: PropTypes.oneOfType([
        PropTypes.object,  // Firebase Timestamp
        PropTypes.string,  // Serialized date
        PropTypes.instanceOf(Date)
      ]),
      // メモの場合
      bookId: PropTypes.string,
      bookTitle: PropTypes.string,
      text: PropTypes.string,
      comment: PropTypes.string,
      page: PropTypes.number,
      createdAt: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
        PropTypes.instanceOf(Date)
      ])
    })
  ),
  loading: PropTypes.bool,
  searchQuery: PropTypes.string,
  onResultClick: PropTypes.func  // ⚠️ 現時点では必須にしない
};

SearchResults.defaultProps = {
  results: [],
  loading: false,
  searchQuery: '',
  onResultClick: undefined  // デフォルトはundefined
};

export default SearchResults;
```

#### 実施手順

```bash
# 1. SearchResults.jsxにPropTypesを追加

# 2. テスト実行（warningを確認）
npm test -- SearchResults

# 3. 開発サーバーで確認
npm run dev
# ブラウザのコンソールでwarningを確認

# 4. warningが出ることを確認
# "Warning: Failed prop type: The prop `onResultClick` is marked as required..."
```

**期待される結果**:
- ✅ テストは全てパス（動作は変わらない）
- ⚠️ 開発環境でwarningが表示される（PropTypesのバリデーション）
- ✅ onResultClickが未定義の場合、コンソールにwarningが出る

---

### 2-3. FullTextSearch.jsx への PropTypes 追加

```jsx
// FullTextSearch.jsx
import PropTypes from 'prop-types';

// ... コンポーネント定義 ...

FullTextSearch.propTypes = {
  onBookClick: PropTypes.func,    // オプショナル
  onMemoClick: PropTypes.func     // オプショナル
};

FullTextSearch.defaultProps = {
  onBookClick: undefined,
  onMemoClick: undefined
};
```

---

## Phase 3: デフォルト動作の実装（優先度：高）⏱️ 60分

**方針**: onResultClickが未定義の場合、安全なデフォルト動作を提供する。

### 3-1. テストファースト: 期待される動作を定義

```jsx
// SearchResults.test.jsx
describe('SearchResults - default behavior', () => {
  it('onResultClickが未定義の場合、書籍クリックで書籍詳細に遷移する', () => {
    const mockResults = [
      { id: 'book1', type: 'book', title: 'テスト本' }
    ];
    
    render(
      <BrowserRouter>
        <SearchResults results={mockResults} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByTestId('book-result-book1'));
    
    // デフォルト動作: navigateが呼ばれる
    expect(mockNavigate).toHaveBeenCalledWith('/book/book1');
  });
  
  it('onResultClickが未定義の場合、メモクリックで書籍詳細+クエリパラメータに遷移する', () => {
    const mockResults = [
      { 
        id: 'memo1', 
        type: 'memo', 
        bookId: 'book1',
        text: 'テストメモ'
      }
    ];
    
    render(
      <BrowserRouter>
        <SearchResults results={mockResults} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByTestId('memo-result-memo1'));
    
    // デフォルト動作: 書籍詳細 + memoクエリパラメータ
    expect(mockNavigate).toHaveBeenCalledWith('/book/book1?memo=memo1');
  });
  
  it('onResultClickが定義されている場合、デフォルト動作は実行されない', () => {
    const mockOnResultClick = jest.fn();
    const mockResults = [
      { id: 'book1', type: 'book', title: 'テスト本' }
    ];
    
    render(
      <BrowserRouter>
        <SearchResults 
          results={mockResults} 
          onResultClick={mockOnResultClick}
        />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByTestId('book-result-book1'));
    
    // カスタムハンドラーが呼ばれる
    expect(mockOnResultClick).toHaveBeenCalledWith('book', 'book1');
    
    // デフォルト動作（navigate）は呼ばれない
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
```

#### 実施手順

```bash
# 1. 上記のテストを追加

# 2. テスト実行（失敗することを確認 - Red）
npm test -- SearchResults

# 3. 失敗を確認
# Expected: navigate to be called
# Actual: navigate was not called
```

---

### 3-2. SearchResults.jsx の実装

```jsx
// SearchResults.jsx
import { useNavigate } from 'react-router-dom';

function SearchResults({ results = [], loading = false, searchQuery = '', onResultClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // デフォルトのクリックハンドラー
  const defaultOnResultClick = (type, bookId, memoId) => {
    console.warn('[SearchResults] onResultClick not provided, using default behavior');
    
    if (type === 'book') {
      navigate(`/book/${bookId}`);
    } else if (type === 'memo') {
      navigate(`/book/${bookId}?memo=${memoId}`);
    }
  };
  
  // onResultClickが提供されていればそれを使い、なければデフォルトを使う
  const handleResultClick = onResultClick || defaultOnResultClick;
  
  // ... 残りのコード ...
  
  const renderMemoResult = (memo) => (
    <Card 
      onClick={() => handleResultClick('memo', memo.bookId, memo.id)}
      //                            ↑ オプショナルチェーン（?.）を削除
    >
      {/* ... */}
    </Card>
  );
  
  const renderBookResult = (book) => (
    <Card 
      onClick={() => handleResultClick('book', book.id)}
      //                            ↑ オプショナルチェーン（?.）を削除
    >
      {/* ... */}
    </Card>
  );
  
  // ...
}
```

#### 実施手順

```bash
# 1. 上記の実装を追加

# 2. テスト実行（成功することを確認 - Green）
npm test -- SearchResults

# 3. 全てのテストがパスすることを確認

# 4. ブラウザで動作確認
npm run dev
# - 全文検索タブでメモをクリック → ダイアログが開く（カスタムハンドラー）
# - 詳細検索タブでメモをクリック → ダイアログが開く（カスタムハンドラー）
```

---

### 3-3. PropTypesの更新（警告の追加）

```jsx
// SearchResults.jsx
SearchResults.propTypes = {
  // ...
  onResultClick: PropTypes.func  // まだ必須にはしない
};

// コンポーネント内で警告を追加
function SearchResults({ results, loading, searchQuery, onResultClick }) {
  // 開発環境でのみ警告を表示
  if (process.env.NODE_ENV === 'development' && !onResultClick) {
    console.warn(
      '[SearchResults] onResultClick prop is not provided. ' +
      'Using default navigation behavior. ' +
      'Consider providing a custom handler for better control.'
    );
  }
  
  // ...
}
```

---

## Phase 4: 既存コンポーネントの対応確認（優先度：中）⏱️ 30分

**方針**: FullTextSearchとTagSearchが正しくonResultClickを渡しているか確認。

### 4-1. FullTextSearch.jsx の確認

**現在の実装**:
```jsx
// FullTextSearch.jsx
const handleResultClick = (type, bookId, memoId) => {
  if (type === 'book') {
    navigate(`/book/${bookId}`);
  } else if (type === 'memo') {
    // ダイアログを開く
    setMemoDialogOpen(true);
    // ...
  }
};

return (
  <SearchResults 
    results={results}
    onResultClick={handleResultClick}  // ✅ 正しく渡している
  />
);
```

**確認事項**:
- ✅ onResultClickを渡している
- ✅ メモクリック時にダイアログを開く
- ✅ 書籍クリック時にnavigateを呼ぶ

**テスト実行**:
```bash
npm test -- FullTextSearch
```

---

### 4-2. TagSearch.jsx の確認（詳細検索タブ）

**現在の実装**:
```jsx
// TagSearch.jsx
const handleResultClick = (type, bookId, memoId) => {
  if (type === 'book') {
    navigate(`/book/${bookId}`);
  } else if (type === 'memo') {
    const memo = results.find(r => r.type === 'memo' && r.id === memoId);
    setMemoDialogOpen(true);
    // ...
  }
};

// AdvancedSearchTab
<SearchResults 
  results={results}
  onResultClick={handleResultClick}  // ✅ 正しく渡している
/>
```

**確認事項**:
- ✅ onResultClickを渡している
- ✅ 両方のタブで正しく動作

**テスト実行**:
```bash
npm test -- TagSearch
```

---

## Phase 5: 統合テストと動作確認（優先度：高）⏱️ 30分

### 5-1. 全テスト実行

```bash
# 全テスト実行
npm test

# カバレッジ確認
npm test -- --coverage --collectCoverageFrom='src/components/search/**'
```

**期待される結果**:
- ✅ Test Suites: すべてパス
- ✅ Tests: 既存テスト + 新規テスト すべてパス
- ✅ Coverage: SearchResults.jsx のカバレッジが向上

---

### 5-2. ブラウザでの動作確認

```bash
npm run dev
```

#### 確認シナリオ

##### シナリオ1: 全文検索タブ
1. 全文検索タブを開く
2. 検索を実行
3. **書籍結果をクリック** → 書籍詳細ページに遷移 ✅
4. **メモ結果をクリック** → メモダイアログが開く ✅
5. ダイアログを閉じる ✅

##### シナリオ2: 詳細検索タブ
1. 詳細検索タブを開く
2. 検索を実行
3. **書籍結果をクリック** → 書籍詳細ページに遷移 ✅
4. **メモ結果をクリック** → メモダイアログが開く ✅
5. ダイアログを閉じる ✅

##### シナリオ3: デフォルト動作（将来の拡張性確認）
- 新しいページで`<SearchResults />`を使う場合
- onResultClickを渡さなくても動作する
- コンソールに警告が表示される

---

### 5-3. コンソール警告の確認

ブラウザの開発者ツールを開き、以下を確認：
- ✅ PropTypesの警告が適切に表示されるか
- ✅ デフォルト動作の警告が表示されるか（該当する場合）

---

## Phase 6: ドキュメント化（優先度：中）⏱️ 20分

### 6-1. コンポーネントドキュメントの更新

```jsx
// SearchResults.jsx
/**
 * SearchResults - 検索結果表示コンポーネント
 * 
 * 書籍とメモの検索結果を統一的に表示します。
 * 
 * @param {Object} props
 * @param {Array} props.results - 検索結果の配列（必須）
 *   - 各要素は { id, type, ... } の形式
 *   - type は 'book' または 'memo'
 * @param {boolean} props.loading - 読み込み中かどうか（デフォルト: false）
 * @param {string} props.searchQuery - 検索クエリ文字列（デフォルト: ''）
 * @param {Function} props.onResultClick - 結果クリック時のコールバック
 *   - 型: (type: 'book' | 'memo', bookId: string, memoId?: string) => void
 *   - 提供されない場合、デフォルト動作（navigate）が実行される
 *   - 開発環境では警告が表示される
 * 
 * @example
 * // カスタムハンドラーを使用する場合（推奨）
 * <SearchResults 
 *   results={results}
 *   loading={false}
 *   onResultClick={(type, bookId, memoId) => {
 *     if (type === 'book') navigate(`/book/${bookId}`);
 *     else openMemoDialog(bookId, memoId);
 *   }}
 * />
 * 
 * @example
 * // デフォルト動作を使用する場合
 * <SearchResults 
 *   results={results}
 *   loading={false}
 *   // onResultClickを省略すると、自動的にnavigateが実行される
 * />
 */
```

---

### 6-2. 設計ガイドラインの作成

`doc/component-design-guidelines.md` を作成：

```markdown
# コンポーネント設計ガイドライン

## 必須propsの扱い

### 原則
1. **機能的に必須のpropsは、型で明示する**
2. **デフォルト動作を提供できる場合は、オプショナルにする**
3. **開発環境で適切な警告を表示する**

### 例: SearchResults

```jsx
// ❌ 悪い例: 必須だが、型で明示されていない
SearchResults.propTypes = {
  onResultClick: PropTypes.func  // オプショナルに見えるが、実際には必須
};

// ✅ 良い例: デフォルト動作を提供し、警告も表示
SearchResults.propTypes = {
  onResultClick: PropTypes.func  // オプショナル
};

function SearchResults({ onResultClick }) {
  const defaultHandler = (type, bookId, memoId) => {
    // デフォルト動作
  };
  
  if (!onResultClick && process.env.NODE_ENV === 'development') {
    console.warn('[SearchResults] onResultClick not provided');
  }
  
  const handler = onResultClick || defaultHandler;
}
```

## コンポーネントの責任

### 単一責任の原則
- 各コンポーネントは1つの明確な責任を持つ
- 状態管理は可能な限りコンポーネント内で完結させる
- 親コンポーネントへの依存を最小化する

### 例: FullTextSearch
```jsx
// ✅ 良い例: 自己完結
export default function FullTextSearch() {
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  
  const handleResultClick = (type, bookId, memoId) => {
    // 自分で処理
  };
  
  return (
    <>
      <SearchResults onResultClick={handleResultClick} />
      <MemoDialog open={memoDialogOpen} />
    </>
  );
}
```
```

---

## Phase 7: オプション - TypeScript移行の検討（優先度：低）⏱️ 議論のみ

### 将来の改善案

現在のJavaScript + PropTypesから、TypeScriptへの段階的な移行を検討。

#### メリット
- ✅ コンパイル時の型チェック
- ✅ IDEの補完強化
- ✅ リファクタリングの安全性向上

#### デメリット
- ❌ 学習コスト
- ❌ 既存コードの移行コスト
- ❌ ビルド設定の変更

#### 移行戦略（参考）
1. `.ts`/`.tsx`拡張子を受け入れるようビルド設定変更
2. 新規ファイルはTypeScriptで作成
3. 変更が必要なファイルから順次TypeScript化
4. 完全移行は長期目標

**現時点の判断**: PropTypesで十分。将来的に検討。

---

## 実施スケジュール

### 推奨スケジュール（総計: 約3.5時間）

| Phase | 内容 | 所要時間 | 優先度 |
|-------|------|---------|--------|
| Phase 0 | 現状分析と準備 | 30分 | 最高 |
| Phase 1 | テストの拡充 | 60分 | 最高 |
| Phase 2 | PropTypes導入 | 30分 | 高 |
| Phase 3 | デフォルト動作実装 | 60分 | 高 |
| Phase 4 | 既存コンポーネント確認 | 30分 | 中 |
| Phase 5 | 統合テスト・動作確認 | 30分 | 高 |
| Phase 6 | ドキュメント化 | 20分 | 中 |

### 最小限の実施（Phase 1-3のみ: 2.5時間）
もし時間が限られている場合は、Phase 1-3のみを実施：
- Phase 1: テストの拡充（60分）
- Phase 2: PropTypes導入（30分）
- Phase 3: デフォルト動作実装（60分）

Phase 4-6は後日実施可能。

---

## リスク管理

### リスク評価

| リスク | 発生確率 | 影響度 | 対策 |
|--------|---------|--------|------|
| 既存機能の破壊 | 低 | 高 | テストファーストで段階的に実施 |
| テストの書き直しが必要 | 中 | 中 | 既存テストを先に確認 |
| 予想外のバグ発見 | 中 | 中 | Phase 5で包括的な動作確認 |
| 時間超過 | 中 | 低 | 最小限の実施（Phase 1-3）に切り替え |

### ロールバック手順

各Phaseの後でコミットすることで、問題があれば前の状態に戻せる：

```bash
# Phase 1完了後
git add .
git commit -m "test: SearchResults関連のテスト拡充"

# Phase 2完了後
git add .
git commit -m "feat: SearchResultsにPropTypesを追加"

# Phase 3完了後
git add .
git commit -m "feat: SearchResultsにデフォルト動作を実装"

# 問題が発生した場合
git revert HEAD  # 直前のコミットを取り消し
```

---

## 成功基準

### 定量的指標
- ✅ 全テストがパス（522 tests → 532+ tests）
- ✅ SearchResults.jsx のテストカバレッジ: 90%以上
- ✅ リンターエラー: 0件
- ✅ ビルド成功

### 定性的指標
- ✅ onResultClickが未定義でも安全に動作する
- ✅ 開発環境で適切な警告が表示される
- ✅ 既存の全文検索・詳細検索タブが正常に動作する
- ✅ コードの可読性が向上している
- ✅ ドキュメントが整備されている

---

## まとめ

この実施計画は、以下の原則に基づいています：

1. **テストファースト**: まずテストを書き、それから実装
2. **段階的改善**: 一度にすべてを変えず、Phase単位で進める
3. **安全性重視**: 各Phaseでテストと動作確認を実施
4. **後方互換性**: 既存機能を壊さない
5. **ドキュメント**: 将来のために設計思想を記録

**次のステップ**: この計画について議論し、実施の可否や優先順位を決定してください。

---

**作成日**: 2025年10月18日  
**対象**: 検索結果クリック動作の安全性向上  
**関連**: `doc/analysis-search-result-click-issue.md`

