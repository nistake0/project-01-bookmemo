# デザイン要素の分類とテーマ方針

**作成日**: 2025年1月31日  
**目的**: 「書籍」と「メモ」を異なるテーマにする、書籍系は統一する、その他要素の分類と方針を整理する

---

## 1. 要素の分類（セマンティックグループ）

アプリケーション内の表示要素を、デザイン上の扱いでグループ分けする。

### 1.1 書籍系（Book）

| 要素 | コンポーネント | 役割 |
|------|----------------|------|
| 書籍カード | BookCard | 一覧での書籍サマリ |
| 書籍詳細カード | BookDetail の Paper | 詳細ページのメインコンテンツ |
| 書籍入力カード | BookForm の Paper / フォーム全体 | 本追加・編集フォーム |
| 書籍情報ブロック | BookInfo | 表紙・タイトル・著者・ISBN 等 |
| 書籍編集ダイアログ | BookEditDialog | 編集用モーダル |
| 検索結果の書籍カード | SearchResults の renderBookResult | 検索結果としての書籍表示 |
| 外部書籍検索結果 | ExternalBookSearch | ISBN検索の候補表示 |

**方針**: 同じボーダー・背景・アクセント色とする。本という実体を表す要素として一貫した見た目にしたい。

---

### 1.2 メモ系（Memo）

| 要素 | コンポーネント | 役割 |
|------|----------------|------|
| メモカード | MemoCard | 書籍詳細内のメモ一覧 |
| 検索結果のメモカード | SearchResults の renderMemoResult | 検索結果としてのメモ表示 |
| メモエディタ | MemoEditor | メモ編集UI |
| メモ追加ダイアログ | MemoAdd (Dialog) | メモ追加フォーム |
| メモ移動ダイアログ | MemoMoveDialog | メモの移動先選択 |

**方針**: 書籍とは異なるアクセント色・影・装飾とする。メモという別の実体として視覚的に区別したい。

---

### 1.3 ページタイトル系（PageHeader）

| 要素 | コンポーネント | 役割 |
|------|----------------|------|
| ページタイトル | PageHeader | 「本一覧」「書籍詳細」「検索」等のヘッダー |

**方針**: すでに `pageHeader` で独自設定。背景画像の有無・金系オーバーレイ・角丸などをプリセットで制御。書籍・メモとは独立した見た目（ページ全体のトーンを決める役割）。

---

### 1.4 説明・情報カード系（Info / Content Card）

| 要素 | コンポーネント | 役割 |
|------|----------------|------|
| 設定セクションカード | Settings の Card | アカウント・表示設定 |
| 検索条件パネル | AdvancedSearchForm の Paper | 検索フォーム |
| タブ内コンテンツ | DateRangeSelector, TagSearchField の Paper | 検索補助UI |
| 空データ表示 | Stats の「読書データがありません」Card | 説明・案内 |
| 統計サマリカード | Stats の数値カード（総冊数・積読・読書中 等） | 数値の表示 |
| タグ統計カード | TagStats / Stats の tag-stat | タグごとの数値 |
| 著者・出版社カード | Stats の author-top, publisher-top | ランキング表示 |
| 最新ステータス履歴 | LatestStatusHistory の Paper | ステータス変更履歴 |
| ステータス履歴タイムライン | StatusHistoryTimeline の Paper/List | 履歴一覧 |

**方針案**: 「補助的・説明的なコンテンツ」として、書籍・メモより控えめなスタイル。書籍と共通にするか、独自の「説明カード用」スタイルにするか選択の余地あり。

---

### 1.5 統計グラフ系（Chart）

| 要素 | コンポーネント | 役割 |
|------|----------------|------|
| 月別追加冊数グラフ | Stats の BarChart | 棒グラフ |
| 月別メモ数グラフ | Stats の BarChart | 棒グラフ |
| タグ使用頻度 | Stats の PieChart | 円グラフ |

**方針案**: グラフ色（#42a5f5, #9c27b0 等）をテーマ化。コンテナは説明カード系と統一するか、グラフ専用の軽いスタイルにするか。

---

### 1.6 ダイアログ・オーバーレイ系（Dialog）

| 要素 | コンポーネント | 役割 |
|------|----------------|------|
| 汎用エラー | CommonErrorDialog | エラー表示 |
| プロフィール編集 | Settings の Dialog | プロフィール編集 |
| 手動履歴追加 | ManualHistoryAddDialog | ステータス履歴追加 |
| タグ編集・一括削除・一括マージ | TagEditDialog, BulkDeleteTagsDialog, BulkMergeTagsDialog | タグ管理 |

**方針**: MUI の Dialog をベースに、テーマの MuiDialog で統一。中身のカード感は用途（書籍編集＝書籍系、メモ追加＝メモ系、設定＝説明系）に応じて分けてもよい。

---

### 1.7 その他（Utility / Global）

| 要素 | コンポーネント | 役割 |
|------|----------------|------|
| PWA インストールプロンプト | PWAInstallPrompt | インストール促進 |
| ローディング | LoadingIndicator | 読み込み表示 |
| 認証フォーム | Login, Signup | ログイン・新規登録 |
| 下層ナビ | App の BottomNavigation | ナビゲーション |

**方針**: アプリの基本UI。書籍・メモ・ページヘッダーほど装飾的でなく、MUI の基本パレット（primary, background）で十分。必要に応じて最小限のテーマ拡張。

---

## 2. テーマ設計の方針案

### 2.1 アクセントの分離

**現状**: `cardAccent` が 1 つで、BookCard と MemoCard の両方に使われている。実質同じ見た目。

**方針**: プリセットで **書籍用** と **メモ用** を別々に定義する。

```
themePresets:
  bookAccent: 'brown' | 'neutral'   // 書籍カード・書籍詳細・BookForm 等
  memoAccent: 'memo' | 'neutral'    // メモカード（memo は紫系の専用色）
  cardDecorations: { ... }          // 角・内枠・中央線（書籍とメモで共用 or 分離）
```

- **library-classic**: bookAccent=brown, memoAccent=memo（紫系）
- **minimal-light**: bookAccent=neutral, memoAccent=neutral（または memo の淡い版）

書籍とメモで色が異なり、かつ「書籍ならどこでも同じ」を満たせる。

---

### 2.2 書籍系の統一

以下をすべて `bookAccent` + `cardDecorations`（書籍用）で統一する:

- BookCard
- BookDetail の Paper
- BookForm の Paper（フォームを包むカードがあれば）
- BookInfo の書影エリア・枠線（書籍コンテキストなので bookAccent）
- SearchResults の書籍カード
- ExternalBookSearch の候補カード（書籍データなので bookAccent が自然）
- BookEditDialog 内のフォーム領域（書籍編集なので書籍系）

共通の「カードスタイル生成」ロジック（例: `useBookCardStyles()`）を用意し、これらが同じ sx を参照する形にする。

---

### 2.3 メモ系の統一

以下を `memoAccent` で統一する:

- MemoCard
- SearchResults のメモカード
- MemoEditor のカード部分（あれば）
- MemoAdd / MemoMoveDialog 内のメモ表示（あれば）

現状、SearchResults はすでに `memoAccent` を参照している。MemoCard は `cardAccent` を参照しているため、`memoAccent` に切り替える変更が必要。

---

### 2.4 説明・情報カード系の扱い

**案A（シンプル）**: 書籍と同じ `bookAccent` を使う  
- メリット: 実装が簡単  
- デメリット: 書籍と説明カードの区別がつきにくい  

**案B（推奨）**: 専用の「説明カード用」アクセントを用意  
- `infoCardAccent: 'neutral' | 'brown'` など  
- 書籍より控えめ（枠線を薄く、装飾なし等）  
- メリット: 書籍・メモ・説明の 3 段階で役割が分かる  

**案C**: 説明カードは MUI の Card デフォルトに近づける  
- `cardDecorations: false` 相当で、背景のみガラス効果  
- メリット: 実装が軽い  

段階的に進めるなら、まずは **案C**（装飾なしの控えめカード）で説明カードをそろえ、必要になったら案B に拡張するのが現実的。

---

### 2.5 ページタイトル

現状どおり `pageHeader` で独立制御。ページ全体の雰囲気を決めるので、書籍・メモとは別でよい。

---

### 2.6 統計グラフ

- グラフ色: `theme.custom.chartColors` や `palette.chart` を追加し、BarChart/PieChart の色を参照  
- コンテナ: 説明カード系（案C）と同様に扱う  

---

## 3. プリセット構造の拡張案

```javascript
// themePresets.js 拡張案
{
  'library-classic': {
    // 既存
    background: { ... },
    overlay: { ... },
    backgroundColor: '#eef2ff',
    glassEffect: { ... },
    pageHeader: { ... },

    // 分離: 書籍用とメモ用
    bookAccent: 'brown',
    memoAccent: 'memo',
    bookDecorations: { corners: true, innerBorder: true, centerLine: true },
    memoDecorations: { corners: true, innerBorder: true, centerLine: false },  // メモは中央線なし等

    // 説明カード用（案B採用時）
    infoCardAccent: 'neutral',
    infoCardDecorations: { corners: false, innerBorder: false, centerLine: false },

    // 共通（後方互換のため残す場合）
    // cardAccent: 'brown',  // → bookAccent のエイリアス
  },
  'minimal-light': {
    bookAccent: 'neutral',
    memoAccent: 'neutral',  // または 'memo' の淡い版
    bookDecorations: { corners: false, innerBorder: false, centerLine: false },
    memoDecorations: { corners: false, innerBorder: false, centerLine: false },
    infoCardDecorations: { ... },
  }
}
```

`cardAccent` は後方互換のため `bookAccent` のエイリアスとして残し、既存の参照を徐々に `bookAccent` / `memoAccent` に置き換える。

---

## 4. 実装の進め方

### Phase 1: プリセットの分離

1. `themePresets.js` に `bookAccent`, `memoAccent` を追加  
2. `createThemeFromPreset.js` の `theme.custom` にこれらを渡す  
3. `cardAccent` は当面 `bookAccent` と同一とする（互換維持）  

### Phase 2: 書籍系の統一

1. `useBookCardStyles()` または `getBookCardSx()` を用意  
2. BookCard, BookDetail, BookForm, BookInfo, SearchResults(book), ExternalBookSearch で利用  
3. 同じ border, glass, decorations を参照するようにする  

### Phase 3: メモ系の分離

1. MemoCard の参照を `cardAccent` → `memoAccent` に変更  
2. `memoDecorations` を必要に応じて追加  
3. SearchResults のメモカードはすでに memoAccent 使用のため、整合を確認  

### Phase 4: 説明カード・統計

1. 説明カード系に `infoCardAccent` / `infoCardDecorations` を適用（案B/C 採用時）  
2. Stats のチャート色を `theme.custom.chartColors` 等でテーマ化  

---

## 5. 分類まとめ（方針決定用）

| グループ | 要素例 | テーマ参照 | 他グループとの関係 |
|----------|--------|------------|--------------------|
| **書籍系** | BookCard, BookDetail, BookForm, BookInfo, SearchResults(book), ExternalBookSearch, BookEditDialog | bookAccent, bookDecorations, glassEffect | すべて同じスタイル |
| **メモ系** | MemoCard, SearchResults(memo), MemoEditor, MemoAdd, MemoMoveDialog | memoAccent, memoDecorations, glassEffect | 書籍とは別色・別装飾 |
| **ページタイトル** | PageHeader | pageHeader, accentKey, gold | 独立 |
| **説明・情報カード** | Settings Card, 検索フォーム Paper, Stats 数値カード, タグ統計, 著者・出版社, LatestStatusHistory, StatusHistoryTimeline | infoCardAccent または neutral（控えめ） | 書籍・メモより控えめ |
| **統計グラフ** | BarChart, PieChart | chartColors | コンテナは説明カード系 |
| **ダイアログ** | 各種 Dialog | MuiDialog + 中身のグループに応じて | 中身は書籍/メモ/説明のいずれか |
| **その他** | PWA, LoadingIndicator, Login, Signup, BottomNav | MUI 基本パレット | 最小限の装飾 |

---

## 6. 関連ドキュメント

- `doc/design-implementation-plan.md` - 具体的な修正計画・テスト戦略（説明カード案C採用）
- `doc/design-system-overview.md` - 現行デザインシステム
- `doc/design-embedding-review.md` - 埋め込み状況の詳細
- `doc/design-centralization-and-theme-discussion.md` - 設計経緯
