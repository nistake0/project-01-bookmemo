# メモカード表示の統一化の議論

**作成日**: 2025年1月31日  
**目的**: 検索結果のメモカードと書籍詳細のメモカードが異なるレイアウトになっている問題を確認し、統一の可否と方針を議論する

---

## 1. 現状確認：両者の差異

### 1.1 使用箇所とコンポーネント

| 箇所 | コンポーネント | データ取得 |
|------|----------------|------------|
| 書籍詳細 | MemoCard（MemoList 経由） | useMemo(bookId) |
| 検索結果 | SearchResults 内の renderMemoResult | 検索結果オブジェクト |

### 1.2 レイアウト・構造の比較

| 要素 | 書籍詳細（MemoCard） | 検索結果（renderMemoResult） |
|------|----------------------|------------------------------|
| **カード枠** | getMemoCardSx ✓ | getMemoCardSx ✓ |
| **構造** | Card > CardContent + CardActions | Card > CardContent のみ |
| **ヘッダー** | なし | 「📝 書籍名 - ページX」（Typography h6） |
| **テキスト表示** | Typography body1、2行省略、ellipsis | LinkifiedText、枠付き Box、120文字、italic |
| **コメント** | Typography body2、1行省略、ellipsis | LinkifiedText、枠付き Box、💭 付き、100文字 |
| **ランク** | Rating 表示あり | 表示なし |
| **ページ・日付** | CardActions 内（p.X、yyyy/M/d） | コンテンツ下部（「作成日: ...」） |
| **タグ** | CardActions 内、Chip | コンテンツ内、Chip |
| **編集・削除** | あり（PC: IconButton、モバイル: スワイプ） | なし |
| **クリック動作** | MemoEditor ダイアログを開く | 書籍詳細へ遷移 |

### 1.3 結論：**異なるレイアウト・別実装である**

- 検索結果は **SearchResults 内で独自の renderMemoResult** を定義
- 書籍詳細は **MemoCard** コンポーネントを使用
- 見た目・構造・情報の並びがすべて異なり、別種のカードに見える

---

## 2. 統一の可否

### 2.1 統一可能か：**はい、可能**

共通点：
- どちらも「メモ」を表示するカード
- 表示したい情報はほぼ同じ（テキスト、コメント、ページ、タグ、日付、ランク）
- カード枠（getMemoCardSx）はすでに共有

相違点は主に**コンテキスト**による：
- 書籍詳細：書籍が既知なので書籍名不要、編集・削除が必要
- 検索結果：書籍が未知の可能性があるので書籍名が必要、クリックで遷移

これらは props で切り替え可能。

### 2.2 統一のアプローチ案

#### 案A: MemoCard を拡張して検索結果でも使う（推奨）

MemoCard に props を追加し、検索コンテキストをサポートする。

```jsx
// 追加 props 例
<MemoCard
  memo={memo}
  variant="search"           // 'detail' | 'search'
  bookTitle={memo.bookTitle} // 検索時のみ
  onNavigate={() => handleResultClick('memo', memo.bookId, memo.id)}
  showActions={false}        // 検索時は編集・削除なし
/>
```

- メリット: 1コンポーネントで両方に対応、デザインが完全に統一
- デメリット: MemoCard の props と条件分岐が増える

#### 案B: 共通の MemoCardContent を切り出す

CardContent 部分を共通コンポーネント化し、MemoCard と SearchResults の両方で使う。

- メリット: 表示部分の責務分離がしやすい
- デメリット: コンポーネント数が増え、レイアウトの細かい差異を吸収する必要あり

#### 案C: SearchResults で MemoCard をそのまま利用

SearchResults から renderMemoResult を廃止し、MemoCard を直接レンダリング。  
検索結果用の memo オブジェクトに `bookTitle` を付与し、MemoCard で表示する。

- メリット: 実装変更が少ない
- デメリット: MemoCard が bookTitle を扱う前提になり、検索専用の表示（テキスト量など）の調整が必要

---

## 3. 検討事項

### 3.1 検索結果で必要な追加情報

- **書籍名（bookTitle）**: どの本のメモか識別するため必須
- **テキスト量**: 検索では「ヒットした部分」を見せたいため、120文字程度の表示は妥当。一方 MemoCard は 2 行程度のサマリ。統一する場合、`textMaxLines` や `textMaxLength` を props で切り替える必要がある。

### 3.2 クリック動作の違い

| コンテキスト | クリック時 |
|--------------|------------|
| 書籍詳細 | MemoEditor ダイアログを開く |
| 検索結果 | 書籍詳細ページへ遷移（`/book/:id?memo=:memoId`） |

→ `onClick` を渡す形にすれば、コンテキストごとに別のハンドラを指定できる。

### 3.3 編集・削除の有無

- 書籍詳細: 編集・削除ボタン／スワイプが必要
- 検索結果: クリックで遷移するため、カード上の編集・削除は不要

→ `showActions={false}` のような props で非表示にできる。

### 3.4 モバイルのスワイプUI

MemoCard はモバイルでスワイプによる編集・削除を持つ。検索結果で MemoCard を使う場合、`showActions={false}` ならスワイプも無効にするか、あるいは遷移先の書籍詳細で編集できる旨を示すなど、仕様を決める必要がある。

---

## 4. 推奨方針

**案A（MemoCard の拡張）** を推奨する。

1. **共通化による一貫性**: 同じメモカードとして見える
2. **維持コストの削減**: 表示ロジックが MemoCard に集約される
3. **テーマ・デザインの一元化**: getMemoCardSx 以外のスタイルも MemoCard に集約できる

### 実装ステップ案

1. **Phase 1**: MemoCard に `variant`, `bookTitle`, `showActions`, `onNavigate` などを追加
2. **Phase 2**: 検索結果用の `textMaxLength` や `textMaxLines` を props で制御
3. **Phase 3**: SearchResults の renderMemoResult を MemoCard の利用に置き換え
4. **Phase 4**: 旧 renderMemoResult のコード削除とテスト修正

---

## 5. まとめ

- **現状**: 検索結果と書籍詳細で、メモカードのレイアウト・実装が完全に分かれている
- **統一可能性**: props による切り替えで、同じ MemoCard にまとめられる
- **推奨**: MemoCard を拡張し、SearchResults でも MemoCard を使用する方針で統一する

---

## 6. 実装完了（2025-01-31）

- MemoCard に `showActions`, `bookTitle`, `data-testid` props を追加
- SearchResults の renderMemoResult を廃止し、MemoCard を直接使用
- 検索結果のメモ表示が書籍詳細と同じカードデザインに統一
