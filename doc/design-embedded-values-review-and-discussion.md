# デザイン埋め込み値の再調査と一元化・テーマ化の議論

**作成日**: 2025年1月31日  
**前提**: Phase 0〜4 完了後（fallbacks, cardStyles, bookAccent/memoAccent, chartColors はテーマ参照済み）  
**目的**: 依然として個別要素に残る大きさ・スタイル設定の調査、その理由の分析、一元化・テーマコントロールの方法の議論

---

## 1. 調査結果サマリ

### 1.1 テーマ参照済み（Phase 0〜4 で対応済み）

| 種別 | 参照元 | 対象コンポーネント |
|------|--------|-------------------|
| アクセント色 | palette.decorative, fallbacks | BookCard, MemoCard, SearchResults, BookDetail, BookInfo |
| ガラス効果 | theme.custom.glassEffect | 同上（cardStyles 経由） |
| カード影 | theme.custom.cardShadow, cardShadowHover | 同上 |
| 装飾フラグ | theme.custom.bookDecorations, memoDecorations | 同上 |
| チャート色 | theme.custom.chartColors | Stats |
| PageHeader | theme.custom.pageHeader | PageHeader |

### 1.2 依然として埋め込み（要検討）

以下の種別で、多数の値がコンポーネント内に直接記述されている。

---

## 2. 埋め込み値の詳細調査

### 2.1 fontSize（約 40 箇所以上）

| コンポーネント | 箇所 | 値例 | 用途 |
|----------------|------|------|------|
| **BookCard** | 8 | 0.9rem, 0.75rem, 0.65rem, 0.7rem | タイトル、著者、Chip、caption |
| **ExternalBookSearch** | 20+ | 0.9rem, 0.7rem, 0.75rem, 0.8rem, 1rem, 1.25rem | 各入力・表示要素 |
| **BookForm** | 6 | 0.8rem, 0.9rem, 0.75rem | ボタン、Select、書影プレビュー |
| **SearchResults** | 3 | 0.75rem | Chip |
| **PageHeader** | 2 | 1.5rem, 2rem, 2.5rem / 0.9rem, 1rem | タイトル、サブタイトル |
| **MemoCard** | 0 | - | variant 主体（良好） |
| **PWAInstallPrompt** | 2 | 0.75rem | Chip |
| **CameraPasteOCR / CameraOCR** | 2 | 0.8rem, 0.9rem | ボタン |
| **その他** | 複数 | - | FormControl, Typography 等 |

**テーマの typography**: createThemeFromPreset で h1〜h6, body1, body2, caption を定義済み。しかし各コンポーネントが `sx={{ fontSize: '0.9rem' }}` 等で上書きしているため、テーマ変更が反映されない。

---

### 2.2 サイズ（width, height, minWidth, maxWidth, minHeight, maxHeight）

| コンポーネント | 値 | 用途 |
|----------------|-----|------|
| **BookCard** | minHeight 140/160px, width 50/60, height 70/80, minHeight 32/36, height 18/20/22 | カード高さ、表紙画像、タグエリア、Chip |
| **BookInfo** | maxHeight 250px, height 250, width 167 | 書影画像、プレースホルダー |
| **ExternalBookSearch** | width 60, height 80, minWidth 120, minWidth 100 | 表紙サムネイル、FormControl |
| **MemoCard** | minHeight 48, maxHeight 80, minHeight 48/64, maxHeight 72/88 | テキストエリア、アクションボタンエリア |
| **BookForm** | height 40/56, maxHeight 120, height 24/28 | 書影プレビュー、ボタン |
| **PageHeader** | height 2 | 中央線 |
| **DecorativeCorner** | width/height: size（props） | 角装飾 |
| **LoadingIndicator** | minHeight 50vh, dotSize 8/10/12, width/height dotSize | コンテナ、ドット |
| **BookEditDialog** | maxHeight 180 | 書影プレビュー |
| **StatusHistoryTimeline** | width 32, height 32 | Avatar |
| **BookScanner** | width 90%, maxWidth 400 | スキャンエリア |
| **BarcodeScanner** | width 100%, height auto | ビデオ |
| **CameraOCR** | ideal 1920x1080, height 40/48, maxWidth 400 | カメラ、ボタン |
| **PWAInstallPrompt** | maxWidth 600 | Snackbar 内 Card |

---

### 2.3 スペーシング（p, m, gap, padding, margin）

| 種別 | 状況 |
|------|------|
| **カード内余白** | BookCard: p 1.5/2、MemoCard: 各所で p, mb がバラバラ |
| **コンテナ** | maxWidth 600, 800, 1200、pb 72/80 等がページ・コンポーネントごとに分散 |
| **gap** | 1, 1.5, 2 等が文脈で使い分けられているが定義なし |

MUI の spacing(1) = 4px はテーマで定義済み。しかし「カード内の余白」のようなセマンティックなトークンはない。

---

### 2.4 トランジション・アニメーション

| 箇所 | 値 | 用途 |
|------|-----|------|
| **Stats** | transition 0.2s, translateY(-2px) | 5 カードで重複（下記「Stats の motion」参照） |
| **cardStyles.js** | transition 0.3s cubic-bezier, translateY(-4px/-3px) | 書籍・メモカード |
| **MemoCard** | translateX(-100px), translateY(-2px/-4px) | スワイプ、ホバー |
| **BookInfo** | opacity 0.8（hover） | 4 箇所 |
| **LoadingIndicator** | opacity 0.5/1, keyframes | バウンスアニメーション |
| **DecorativeCorner** | opacity 0.4 | 角装飾 |
| **PageHeader** | opacity 0.92 | テキスト |
| **BookList** | opacity 0.3 | 空状態アイコン |

**Stats の motion の詳細**: 統計ページ（`Stats.jsx`）上部の 5 つの数値カード（総冊数・積読冊数・読書中冊数・再読中冊数・読了冊数）に、ホバー時の浮き上がりアニメーションが同一コードで 5 回重複している。`transition: 'transform 0.2s ease-in-out'` と `'&:hover': { transform: 'translateY(-2px)' }`。グラフ・著者・出版社トップ等のカードには未適用。

---

### 2.5 その他のスタイル

| 種別 | 例 | 箇所 |
|------|-----|------|
| **borderRadius** | 1, 2, 3, 4, 8px, 50% | 各所 |
| **boxShadow** | 3, rgba(25,118,210,0.35) | PWAInstallPrompt, LoadingIndicator |
| **opacity** | 0.3, 0.4, 0.8, 0.92 | 上記 |
| **色** | grey.50, primary.50, grey.200 | SearchResults, ExternalBookSearch 等 |

---

### 2.6 border（線スタイル・太さ・色）

| コンポーネント | 値 | 用途 |
|----------------|-----|------|
| **BookInfo** | `1px dashed` + accent | 書影プレースホルダー（テーマ参照済み） |
| **cardStyles.js** | `2px solid`, `1px solid` | カード外枠・内枠（テーマ参照済み） |
| **PageHeader** | `3px solid` | 外枠 |
| **SearchResults** | `1px solid` | Chip 枠 |
| **MemoMoveDialog** | `1px solid` + divider | 選択リスト区切り |
| **createThemeFromPreset** | `1px solid rgba(...)` | MuiCard, MuiPaper デフォルト |
| **CameraOCR** | `2px solid #ccc` | プレビュー枠 |
| **BookScanner** | `2px solid #000` | スキャンエリア枠 |
| **BarcodeScanner** | `1px solid gray` | ビデオ枠 |

**問題**: solid/dashed の使い分け、太さ（1px/2px/3px）、色（#ccc, #000, grey）が各所に散在。カード系は cardStyles で統一されているが、その他は個別指定。

---

### 2.7 textAlign

| コンポーネント | 値 | 用途 |
|----------------|-----|------|
| **Stats** | center | CardContent |
| **ExternalBookSearch** | center / right | 空状態、ボタン配置 |
| **BookInfo** | left | 書影セクション |
| **BookDetail** | left | メモ一覧前 |
| **BookForm** | center | 書影プレビュー |
| **PageHeader** | center | タイトル |
| **TagSearch** | center | Paper |
| **TagStats** | center | 3 箇所 |
| **StatusHistoryTimeline** | center | 空状態 |
| **BookList** | center | 空状態 |
| **BookEditDialog** | center | 書影プレビュー |
| **CameraOCR** | center | プレビュー下 |

**状況**: center / left / right が文脈で使い分けられているが、テーマやレイアウトトークンとしては定義されていない。多くは「中央揃えのブロック」というセマンティクスだが、現状は各コンポーネントが直接指定。

---

## 3. そのようになっている理由の分析

### 3.1 歴史的経緯

- **段階的追加**: 機能追加時に「とりあえず動く」スタイルをその場で指定
- **レスポンシブ対応**: xs/sm/md 等のブレークポイントごとに値を個別調整した
- **コンポーネント単位の最適化**: 各コンポーネントが独立して見た目を調整

### 3.2 技術的制約・判断

- **MUI の variant の限界**: Typography の body1, body2 等はあるが、カード内の「コンパクトなタイトル」や「補助テキスト」にぴったりの variant がなく、個別指定になった
- **レイアウトとデザインの境界**: 余白・サイズは「レイアウト」とも解釈され、テーマの対象外とされた
- **コンポーネントの責務**: BookCard は「書籍カード」というドメイン固有のレイアウトを持ち、汎用テーマでは表現しきれないとの判断

### 3.3 テーマ設計の段階性

- Phase 0〜4 では「色・影・装飾・グラフ」を優先し、フォント・サイズ・余白は後回しにした
- まず「書籍とメモの視覚的区別」を実現することを優先

---

## 4. 一元化・テーマコントロールのための方針

### 4.1 デザイントークンの体系化

**方針**: サイズ・スタイルを「トークン」として theme に定義し、コンポーネントはトークンを参照する。

```
theme.custom の拡張案:
├── sizes          // 寸法トークン
│   ├── bookCoverCard    { width, height }      // 一覧の表紙
│   ├── bookCoverDetail  { maxHeight, width }   // 詳細の書影
│   ├── chip             { height, fontSize }
│   └── iconButton       { size }
├── spacing        // 余白トークン（既存 spacing の拡張）
│   ├── cardPadding     { xs, sm }
│   └── cardGap         { xs, sm }
├── typographyOverrides // カード内等のフォント
│   ├── cardTitle       { fontSize }
│   ├── cardSubtext     { fontSize }
│   └── chipLabel       { fontSize }
├── borders        // 枠線トークン（線スタイル・太さ）
│   ├── cardOutline     { width, style }        // カード外枠（cardStyles で使用）
│   ├── cardInner       { width, style }        // 内枠
│   ├── placeholder     { width, style }        // プレースホルダー（dashed 等）
│   └── scanner         { width, style, color } // スキャナ系（#ccc, #000 等の置換）
├── layout         // レイアウト・配置
│   ├── contentBlockAlign   // center | left | right（説明・空状態ブロック等）
│   └── imageBlockAlign     // 画像ブロックの揃え
└── motion         // アニメーション
    ├── cardTransition
    ├── cardHoverTransform
    └── cardHoverDuration
```

### 4.2 段階的アプローチ

**Phase A（短期）**: 重複の大きいものから  
1. Stats の transition/hover（6 箇所）→ `theme.custom.motion.infoCardHover` 等  
2. fontSize の頻出パターン（0.75rem, 0.8rem, 0.9rem）→ typography 拡張またはトークン  

**Phase B（中期）**: セマンティックトークン  
3. 書籍カバーサイズ → `theme.custom.sizes.bookCoverCard`  
4. カード内余白 → `theme.custom.spacing.card`  
5. Chip の高さ・フォント → `theme.custom.sizes.chip`  

**Phase C（長期）**: 完全トークン化  
6. 全 fontSize 上書きを variant またはトークン参照に置換  
7. 全 width/height を sizes トークンまたはレイアウト定数に集約  

### 4.3 実装方法の候補

| 方法 | メリット | デメリット |
|------|----------|------------|
| **theme.custom 拡張** | 既存の theme 構造に乗る。プリセットで差をつけやすい | custom が肥大化する |
| **専用 theme/sizes.js** | 関心の分離が明確 | テーマと別体系になり、プリセット差をつけにくい |
| **cardStyles の拡張** | 既存の getBookCardSx と一貫 | カード以外（BookInfo, ExternalBookSearch）に広げにくい |
| **useDesignTokens() フック** | コンポーネントからシンプルに参照 | 新規抽象の導入 |

**推奨**: theme.custom を拡張し、`sizes`, `typographyOverrides`, `motion` 等のオブジェクトをプリセットで定義。コンポーネントは `theme.custom.sizes.bookCoverCard` 等を参照。

### 4.4 プリセットでの差別化

- **library-classic**: やや大きめの余白、落ち着いたトランジション
- **minimal-light**: コンパクトな余白、控えめなアニメーション

プリセットごとに sizes, motion を変えることで、テーマ切り替え時に「雰囲気」も変わるようにする。

---

## 5. 推奨タスク（次の最優先）

### 5.1 調査・設計フェーズ

1. **埋め込み値の完全棚卸し**  
   - 上記 2 節をベースに、ファイル・行番号付きで一覧化  
   - 種別ごと（fontSize, size, spacing, motion, border, textAlign）にグルーピング  

2. **トークン設計**  
   - theme.custom に追加するトークン一覧を確定  
   - プリセットごとの値（library-classic / minimal-light）を定義  

3. **移行方針**  
   - どのコンポーネントから着手するか  
   - 後方互換性の考え方  

### 5.2 実装フェーズ（Phase A）

1. **themePresets に motion トークン追加**  
   - infoCardHover: { transition, transform }  
   - Stats の 6 カードで参照に置換  

2. **typography 拡張**  
   - cardTitle, cardSubtext, chipSmall 等を theme.typography に追加  
   - もしくは theme.custom.typographyOverrides に追加  
   - BookCard, ExternalBookSearch の主要な fontSize から置換  

3. **テスト**  
   - トークン変更時に期待どおり変わることの確認  
   - 既存テストの維持  

---

## 6. 修正方針・計画の議論

調査結果とレビューに基づき、修正の方針や計画について検討すべき論点を整理する。

### 6.1 対象範囲の境界

**論点**: すべての埋め込み値をテーマ化するのか、一部を「レイアウト定数」として残すのか。

| 区分 | 候補 | 理由 |
|------|------|------|
| **テーマ化する** | 書籍・メモカードの fontSize、サイズ、余白、motion | プリセット差別化の効果が大きい。ユーザーが「雰囲気」を選ぶ対象 |
| **テーマ化する** | Stats の motion、説明カード系のトーン | 一貫性と重複解消 |
| **テーマ化を保留** | textAlign | 多くは center。プリセットで変える必要性が低い。レイアウトのセマンティクス |
| **テーマ化を保留** | スキャナ系（CameraOCR, BookScanner, BarcodeScanner）の border | アプリの核機能外。色（#ccc, #000）は divider や grey への置換で十分な場合も |
| **共有定数で十分** | コンテナ maxWidth（600, 800, 1200） | レイアウト用途。プリセット差は不要と判断するなら theme 外の定数でよい |

**案**: まず「書籍・メモ・PageHeader・Stats」に集中し、スキャナ・PWA・Camera 系は後回し。textAlign はトークン化の優先度を下げる。

---

### 6.2 優先順位の考え方

**重複解消 vs テーマ差別化**

- **重複解消**: 同じ値が複数箇所にある → 1箇所に集約すれば修正コスト削減。テーマ化しなくてもメリットあり
- **テーマ差別化**: プリセットごとに値を変えたい → theme に載せる必要あり

| 種別 | 重複 | テーマ差別化の価値 | 推奨 |
|------|------|-------------------|------|
| Stats の motion | 6箇所 | 中（落ち着いた vs 控えめ） | まず重複解消。motion トークンで集約し、プリセット値は後付け可 |
| fontSize | 40箇所以上 | 中〜高 | 重複解消と typography 拡張を並行。差別化は Phase B 以降 |
| 書籍カバーサイズ | 数箇所 | 中 | sizes トークン化。library-classic はやや大、minimal はコンパクト等 |
| border | 散在 | 低〜中 | カード系は cardStyles 済み。スキャナ系は divider 等への置換で十分か |
| textAlign | 多数 | 低 | 現状維持 or 共有定数。テーマ化は見送り候補 |

---

### 6.3 Phase の順序と依存

**現行案**: Phase A（motion, fontSize）→ Phase B（sizes, spacing, chip）→ Phase C（完全トークン化）

**依存関係**:
- Phase B の sizes は、BookCard / BookInfo / ExternalBookSearch をまとめて触る必要がある
- fontSize は typography 拡張とコンポーネント修正がセット。BookCard から着手するのが影響範囲を抑えやすい

**リスク**:
- ExternalBookSearch は fontSize 箇所が 20+ と多い。一度に触るとテスト・レビュー負荷が大きい
- **軽減**: BookCard → SearchResults → BookForm → ExternalBookSearch の順で段階的に置換

---

### 6.4 border・textAlign の扱い

**border**:
- cardStyles / BookInfo はテーマ参照済み
- PageHeader の `3px solid` は pageHeader プリセットに含められる（現状は色のみ、線スタイル未定義）
- スキャナ系の `#ccc`, `#000`, `gray` は `palette.divider` や `grey.500` への置換で一貫性向上。トークン化は必須ではない

**textAlign**:
- 多くは「中央揃えブロック」「左揃えブロック」という文脈依存
- プリセットで「minimal は左揃え多め」等に変える設計にはなるが、UX 上の効果は限定的
- **案**: layout.contentBlockAlign は「将来用」としてトークン設計に含めるが、実装優先度は低くする

---

### 6.5 プリセット差別化の粒度

**問い**: library-classic と minimal-light で、どこまで見た目を変えるか。

| 粒度 | 例 | 工数 | 効果 |
|------|-----|------|------|
| 色・装飾のみ（現状） | 背景、アクセント、角・中央線の有無 | 済 | テーマの区別は可能 |
| サイズ・余白 | カード内 p、表紙サイズ、fontSize | 中 | 「ゆったり」vs「コンパクト」の印象 |
| motion | トランジション時間、hover の浮き上がり量 | 小 | 細かいが雰囲気に効く |
| border・textAlign | 線の太さ、揃え | 小 | 差は分かりにくい |

**案**: Phase A では「重複解消」を主目的にし、プリセット差は Phase B で sizes / spacing を差し分けたときにまとめて効かせる。

---

### 6.6 判断が必要な点（要決定）

1. **textAlign のトークン化**  
   実装するか、見送るか。見送る場合、layout トークンからは外す。

2. **スキャナ・PWA 系のスコープ**  
   今回の対象に含めるか、別タスクとするか。

3. **ExternalBookSearch の着手タイミング**  
   使用頻度は高くなく、デザインも雑に作った状態。fontSize の種類が多いのは意図的ではなく、まず fontSize の数を減らしてユーザー確認してから対応する方法を採用。→ **必要タスク**: ExternalBookSearch の fontSize 統合（下記 6.7 参照）

4. **テスト方針**  
   トークン変更時にスナップショットで見た目を検証するか、現状どおりロジック・構造のテストに留めるか。

---

### 6.7 必要タスク（決定済み）

| タスク | 内容 | 状態 |
|--------|------|------|
| **Stats の motion** | 5 つの数値カードのホバーアニメーション（transition, translateY）を theme.custom.motion 等に集約 | ✅ 完了（themePresets, createThemeFromPreset, Stats.jsx） |
| **ExternalBookSearch fontSize 統合** | fontSize の種類を減らす（例: body2, caption 等の variant に寄せて 2〜3 種に）。ユーザー確認後、必要ならトークン化 | ✅ 完了（variant に寄せて fontSize 上書きを削除）。ユーザー確認待ち |

---

## 7. 関連ドキュメント

- `doc/design-embedding-review.md` - 初回レビュー（Phase 0 以前の状態も含む）
- `doc/design-implementation-plan.md` - Phase 0〜4 の実装計画
- `doc/design-element-classification-and-policy.md` - 要素分類とテーマ方針
- `doc/design-system-overview.md` - デザインシステム概要
