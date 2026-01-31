# アート的デザインの埋め込み状況レビュー

**作成日**: 2025年1月31日  
**更新**: アプリケーション全体の要素を対象に拡張。Phase 0〜4 完了後、boxShadow・FALLBACK・cardStyles は対応済み。  
**目的**: ロジックとデザインの分離性・デザインの統一管理の観点から、表示されるすべての要素を調査・評価する  
**次回**: 残存する fontSize・サイズ・スペーシング等の詳細調査・議論は `doc/design-embedded-values-review-and-discussion.md` を参照。

---

## 1. 評価の観点

| 観点 | 内容 |
|------|------|
| **分離性** | アート系スタイルがロジック（ビジネスロジック・UI構造）と分離されているか |
| **一元管理** | デザイン値がテーマ等で一元定義され、変更が容易か |
| **重複** | 同一のデザイン値が複数箇所に散在していないか |

---

## 2. 現状サマリ

### 2.1 テーマ参照済み（良好）

以下の要素は `theme.palette.decorative` または `theme.custom` を参照している。

| 要素 | コンポーネント | 参照元 |
|------|----------------|--------|
| カードのアクセント色（枠線・内枠・中央線） | BookCard, MemoCard, SearchResults, BookDetail | decorative[cardAccent] |
| ガラス効果（透明度・blur・saturate） | 同上 | glassEffect |
| 装飾の有無（角・内枠・中央縦線） | 同上 | cardDecorations |
| メモカードの影色 | SearchResults | decorative.memo.shadow |
| PageHeader のスタイル | PageHeader | pageHeader, decorative |

### 2.2 依然として埋め込み（問題あり）

#### A. boxShadow の重複

同一の boxShadow が **5箇所** にコピペされている。

```
0 8px 32px rgba(0, 0, 0, 0.12),
0 2px 8px rgba(0, 0, 0, 0.08),
inset 0 1px 0 rgba(255, 255, 255, 0.5)
```

**対象**: BookCard, MemoCard, SearchResults（書籍・メモ）, BookDetail

hover 時の値も同様に重複:

```
0 12px 40px rgba(0, 0, 0, 0.16),
0 4px 12px rgba(0, 0, 0, 0.12),
inset 0 1px 0 rgba(255, 255, 255, 0.6)
```

**影響**: 影の強さ・色を変えたい場合、5箇所を個別に修正する必要がある。テーマ切り替え時に影をプリセットで変えられない。

---

#### B. 数値・マジックナンバーの埋め込み

| 値 | 箇所 | 用途 |
|----|------|------|
| `borderRadius: 3` | BookCard, MemoCard, BookDetail | カード外枠 |
| `borderRadius: 2` | 同上（::before） | 内枠 |
| `top: 8, left: 8, right: 8, bottom: 8` | 同上 | 内枠の inset |
| `transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'` | BookCard, MemoCard | ホバーアニメーション |
| `translateY(-4px)` | BookCard, MemoCard, SearchResults | ホバー時の浮き上がり |

これらはカードの「形・動き」に関するデザインだが、テーマで制御されていない。

---

#### C. fontSize の個別上書き（多発）

| コンポーネント | 上書き箇所数 | 例 |
|----------------|-------------|-----|
| BookCard | 8箇所 | Typography 0.9rem/1rem, Chip 0.65rem, caption 0.65rem 等 |
| MemoCard | 少なめ（variant 主体） | - |
| BookInfo | なし（variant 使用） | - |
| ExternalBookSearch | 15箇所以上 | TextField, Typography, Button 等 |

**問題**: テーマの typography を変更しても、`sx={{ fontSize: '0.9rem' }}` で上書きされている箇所は反映されない。フォントサイズの一元変更ができない。

---

#### D. FALLBACK_ACCENT の重複

同一のフォールバック値が **4ファイル** に定義されている。

```javascript
const FALLBACK_ACCENT = {
  light: 'rgba(139, 69, 19, 0.2)',
  lighter: 'rgba(139, 69, 19, 0.1)',
  borderHover: 'rgba(139, 69, 19, 0.3)',
};
```

**対象**: BookCard, MemoCard, BookDetail, SearchResults（FALLBACK_BROWN / FALLBACK_MEMO）

**影響**: フォールバック仕様を変える場合、4箇所を修正する必要がある。

---

#### E. BookInfo のスタイル埋め込み

BookInfo はテーマを参照していない。

| 箇所 | 埋め込み内容 |
|------|--------------|
| 書影 placeholder | `border: '1px dashed grey'`, `height: 250`, `width: 167` |
| 画像 | `style={{ maxHeight: '250px', width: 'auto' }}` |
| ホバー | `'&:hover': { opacity: 0.8 }` が複数 |
| ISBN リンク | `textDecoration: 'underline'`, `textUnderlineOffset: 2` |

書籍詳細の「書影エリア」のデザインがテーマと無関係に固定されている。

---

#### F. レイアウト・スペーシングの埋め込み

| 要素 | 例 | 問題 |
|------|-----|------|
| カード内余白 | `p: { xs: 1.5, sm: 2 }` | コンポーネントごとに微妙に異なる |
| 最小高さ | `minHeight: { xs: '140px', sm: '160px' }` | BookCard 固有 |
| 画像サイズ | `width: { xs: 50, sm: 60 }`, `height: { xs: 70, sm: 80 }` | カバー画像の寸法 |
| gap, mb, mt | 多数 | 一貫性の担保が難しい |

これらは「レイアウト」寄りだが、アート的トーン（余白のゆったりさ等）に影響する。

---

## 3. ロジックとデザインの分離状況

### 3.1 分離できている部分

- **カードの色・枠線・ガラス効果**: `cardSx` として sx に集約され、テーマから値を取得
- **装飾の有無**: `decorations.corners` 等で条件分岐し、構造とスタイルが整理されている

### 3.2 分離が不十分な部分

- **boxShadow, transition, borderRadius**: ロジックとは無関係だが、コンポーネント内にハードコード
- **fontSize**: 表示ロジック（タイトル・著者・ステータス）と密結合。variant で足りる箇所でも個別指定
- **BookInfo**: 表示内容のロジックと見た目が同じ JSX 内に混在

### 3.3 デザイン値の所在

| 種別 | 一元化の程度 | 所在 |
|------|--------------|------|
| アクセント色 | ✅ 高 | theme.palette.decorative |
| ガラス効果 | ✅ 高 | theme.custom.glassEffect |
| 装飾フラグ | ✅ 高 | theme.custom.cardDecorations |
| 影・ハイライト | ❌ 低 | 各コンポーネントの sx に重複 |
| フォントサイズ | ⚠️ 中 | テーマありつつ上書き多数 |
| 角丸・余白・トランジション | ❌ 低 | 各コンポーネントに散在 |

---

## 4. 推奨対応の方向性

### 4.1 短期（影響大・工数小）

1. **boxShadow のテーマ化**
   - `theme.custom.cardShadow`, `cardShadowHover` をプリセットで定義
   - BookCard, MemoCard, SearchResults, BookDetail で参照に置換

2. **FALLBACK_ACCENT の共通化**
   - `src/theme/fallbacks.js` 等に集約し、各コンポーネントで import

### 4.2 中期（一貫性向上）

3. **カード用スタイルプリセットの導入**
   - `theme.custom.cardStyle` に `borderRadius`, `transition`, `hoverTransform` 等を追加
   - または `useCardStyles()` フックで cardSx を生成し、BookCard/MemoCard/BookDetail で共有

4. **fontSize 上書きの削減**
   - Typography の `variant` を適切に使用
   - 必要な箇所のみテーマの `typography` を拡張して対応

### 4.3 長期（設計改善）

5. **BookInfo のテーマ参照化**
   - 書影 placeholder の枠線・サイズをテーマまたは共通スタイルで定義
   - ホバー効果などをスタイルオブジェクトに分離

6. **デザイントークンの体系化**
   - spacing, borderRadius, transition, shadow をテーマの `custom` に整理
   - design-system-overview.md にトークン一覧を追記

---

## 5. まとめ

| 項目 | 評価 |
|------|------|
| **テーマ連携** | 色・ガラス・装飾の有無はテーマ参照済みで良好 |
| **重複** | boxShadow, FALLBACK, 一部 transition で重複あり |
| **分離性** | カード類は cardSx で整理されているが、BookInfo はロジックとスタイルが未分離 |
| **一元管理** | 影・角丸・フォントは未テーマ化で、変更時の修正箇所が増える |

**結論**: アクセント色やガラス効果はテーマ化が進んでいるが、影・角丸・フォント・フォールバックなどは依然として埋め込みが多く、ロジックとデザインの分離および一元管理の観点で改善余地がある。

---

## 6. 全要素の一覧（コンポーネント・ページ別）

### 6.1 ページ

| ページ | テーマ参照 | 埋め込み・問題 |
|--------|------------|----------------|
| **BookList** | なし | fontSize 3箇所、backgroundColor 'background.paper'、opacity 0.3、minHeight 40/48 |
| **BookAdd** | なし | maxWidth 500、pb 72/80、px 1.5/2/0 |
| **BookDetail** | ✅ accent, glass, decorations | detailCardSx 内 boxShadow 重複、FALLBACK |
| **TagSearch** | PageHeader 経由 | borderBottom, position sticky, backgroundColor |
| **Stats** | PageHeader 経由 | transition/hover translateY(-2px) 6回重複、chart color #42a5f5/#9c27b0、height 220/260、grid gap |
| **Settings** | PageHeader 経由 | maxWidth 600、mb 10、Avatar 56x56。Card は MUI デフォルト |

### 6.2 カード系コンポーネント

| コンポーネント | テーマ参照 | 埋め込み・問題 |
|----------------|------------|----------------|
| **BookCard** | ✅ accent, glass, decorations | boxShadow 重複、fontSize 8箇所、FALLBACK、borderRadius 3/2、minHeight 140/160、画像 50/60x70/80 |
| **MemoCard** | ✅ 同上 | boxShadow 重複、FALLBACK、borderRadius、minHeight/maxHeight 48/80/72/88、IconButton bgcolor |
| **SearchResults** | ✅ bookAccent, memoAccent, glass | boxShadow 重複、backgroundColor grey.50/primary.50、fontSize 2箇所、FALLBACK |
| **BookDetail Paper** | ✅ 同上 | boxShadow 重複、FALLBACK |

### 6.3 書籍・メモ関連

| コンポーネント | テーマ参照 | 埋め込み・問題 |
|----------------|------------|----------------|
| **BookInfo** | なし | border dashed grey、height 250 width 167、maxHeight 250px、hover opacity 0.8×4、textDecoration underline |
| **BookForm** | なし | fontSize 6箇所、maxHeight 120、borderRadius 4 |
| **BookEditDialog** | なし | MUI デフォルト（テーマの MuiDialog を継承） |
| **MemoAdd** | なし | 主に MUI デフォルト、variant 使用 |
| **MemoEditor** | なし | mb, mt, variant 主体。色・フォントの直接指定は少ない |
| **MemoList** | なし | 子の MemoCard に依存 |
| **MemoMoveDialog** | あり | border theme.palette.divider、backgroundColor action.hover |

### 6.4 検索・タグ関連

| コンポーネント | テーマ参照 | 埋め込み・問題 |
|----------------|------------|----------------|
| **ExternalBookSearch** | なし | fontSize 15箇所以上、border primary.main、bgcolor primary.50、maxWidth 100% |
| **FullTextSearch** | なし | fontSize small（アイコンのみ） |
| **AdvancedSearchForm** | なし | Paper p:2 mb:2、variant 主体 |
| **DateRangeSelector** | なし | Paper p:2、variant 主体 |
| **TagSearchField** | なし | Paper p:2、variant 主体 |
| **TagList** | なし | action.hover、variant 主体 |
| **TagStats** | なし | p:2/p:3、Alert、Card |
| **TagEditDialog** | なし | 要確認 |
| **BulkDeleteTagsDialog** | なし | 要確認 |
| **BulkMergeTagsDialog** | なし | 要確認 |

### 6.5 共通・レイアウト

| コンポーネント | テーマ参照 | 埋め込み・問題 |
|----------------|------------|----------------|
| **PageHeader** | ✅ pageHeader, accent, gold | boxShadow、fontSize 2箇所、color rgba(15,23,42,0.92)、FALLBACK |
| **DecorativeCorner** | ✅ gold, accent | FALLBACK、opacity 0.4 |
| **LoadingIndicator** | 一部 | opacity 0.5/1、minHeight 50vh、borderRadius 50%、boxShadow rgba(25,118,210,0.35)、dotSize 8/10/12 |
| **TabPanel** | なし | 表示制御が主。スタイルは最小限 |
| **CommonErrorDialog** | なし | color error.main、fontWeight bold、mb 2、pb 2 |
| **PWAInstallPrompt** | 一部 | backgroundColor primary.main、fontSize 0.75rem、boxShadow 3、maxWidth 600、mb 8 |

### 6.6 その他

| コンポーネント | テーマ参照 | 埋め込み・問題 |
|----------------|------------|----------------|
| **BookStatusChanger** | なし | レイアウトのみ（gap 1）。Chip は getBookStatusColor |
| **BookTagEditor** | なし | 要確認 |
| **StatusHistoryTimeline** | なし | mb 3、Paper/List/Chip |
| **LatestStatusHistory** | なし | p 2 mb 2、Paper |
| **ManualHistoryAddDialog** | なし | 要確認 |
| **CameraOCR / CameraPasteOCR** | なし | 要確認 |
| **BarcodeScanner / BookScanner** | なし | 要確認 |

### 6.7 認証

| コンポーネント | テーマ参照 | 埋め込み・問題 |
|----------------|------------|----------------|
| **Login** | なし | maxWidth 400、mt 8、variant 主体 |
| **Signup** | なし | 同上の想定 |

### 6.8 App・グローバル

| 箇所 | 埋め込み・問題 |
|------|----------------|
| **App.jsx** | BottomNavigation height 64/72、fontSize 0.7/0.8rem、icon 1.5/1.75rem、backgroundColor background.paper |
| **index.css** | outline #1976d2 |

### 6.9 createThemeFromPreset（テーマ定義自体）

| 箇所 | 内容 |
|------|------|
| MuiCard/Paper | boxShadow '0 10px 28px...'、border '1px solid rgba(15,23,42,0.08)'、borderRadius 16 |
| MuiMenu/Popover | borderRadius 12、border、backgroundColor 0.98、boxShadow |
| MuiDialog | borderRadius 16、boxShadow |
| MuiAlert | backgroundColor 0.85、backdropFilter |
| MuiChip | fontSize、height |

※ これらはテーマ内の一元定義なので「埋め込み」とは異なる。ただし値は固定でプリセット差がない。

---

## 7. 重複・散在の整理

### 7.1 同一値の重複箇所

| 値パターン | 重複箇所数 | 対象 |
|------------|------------|------|
| カード boxShadow | 5 | BookCard, MemoCard, SearchResults×2, BookDetail |
| FALLBACK_ACCENT | 4 | BookCard, MemoCard, BookDetail, SearchResults |
| translateY(-2px) / (-4px) hover | 8+ | Stats 6、BookCard, MemoCard, SearchResults |
| transition transform | 6+ | Stats 各 Card |
| rgba(15,23,42,0.08) 等 | テーマ + 各所 | createThemeFromPreset、複数 |

### 7.2 コンポーネント数とテーマ参照率

- **テーマ参照あり**: BookCard, MemoCard, SearchResults, PageHeader, DecorativeCorner, BookDetail, MemoMoveDialog（一部）
- **テーマ参照なし**: 上記以外のほぼすべて（約35コンポーネント以上）

---

## 8. 推奨対応の優先度（全体版）

| 優先度 | 対応内容 | 影響範囲 |
|--------|----------|----------|
| 高 | boxShadow テーマ化、FALLBACK 共通化 | 5コンポーネント |
| 高 | カード用 useCardStyles または stylePresets | 4コンポーネント |
| 中 | fontSize 上書き削減（BookCard, ExternalBookSearch, BookForm） | 3コンポーネント、20箇所以上 |
| 中 | Stats の transition/hover 共通化 | 1ページ |
| 中 | チャート色（#42a5f5, #9c27b0）のテーマ化 | Stats |
| 低 | BookInfo の書影・ホバースタイル | 1コンポーネント |
| 低 | LoadingIndicator の boxShadow・色 | 1コンポーネント |
| 低 | PWAInstallPrompt のスタイル | 1コンポーネント |
