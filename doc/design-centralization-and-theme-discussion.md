# アート的デザインの一元管理とテーマ化に関する議論

**作成日**: 2025年1月31日  
**目的**: デザインを一元管理し、テーマとして変更可能にするために何をすべきか整理・議論する

---

## 実装完了状況（2025-01-31 更新）

以下の項目はすべて実装済み。

| 項目 | 状態 |
|------|------|
| パレット拡張（decorative: brown, gold, memo, neutral） | ✅ |
| コンポーネントのパレット参照化 | ✅ |
| プリセットごとの cardAccent, cardDecorations, glassEffect | ✅ |
| PageHeader プリセット制御（pageHeader） | ✅ |
| DecorativeCorner 条件表示（corners: false） | ✅ |
| MuiCard/MuiPaper ガラス効果のプリセット連携 | ✅ |
| SearchResults メモカード boxShadow テーマ参照 | ✅ |
| appTheme.js 廃止、index.css 整理 | ✅ |

**概要**: `doc/design-system-overview.md` を参照

---

## 1. 現状の整理（議論当時の問題定義）

### 1.1 すでにテーマ対応済み（Task B で実装）

| 要素 | 実装箇所 | テーマ切り替え時の挙動 |
|------|----------|------------------------|
| 背景画像・パターン | themePresets.js → createThemeFromPreset | ✅ library-classic / minimal-light で切り替わる |
| 背景色 | themePresets.backgroundColor | ✅ 切り替わる |
| オーバーレイ（グラデーション） | themePresets.overlay | ✅ 切り替わる |
| MuiCard/Paper の基本スタイル | createThemeFromPreset の components | ⚠️ 全プリセット共通（色は固定） |
| テーマ選択・保存 | useUserSettings, Settings | ✅ ユーザーごとに記憶 |

### 1.2 テーマに追従していない（ハードコード散在）

| コンポーネント | ハードコード箇所 | 影響 |
|----------------|-----------------|------|
| **BookCard.jsx** | 茶系 `rgba(139,69,19,0.2)` 等 6箇所 | minimal-light にしても茶色のまま |
| **MemoCard.jsx** | 茶系 同上 12箇所 | 同上 |
| **SearchResults.jsx** | 茶系 5箇所 + 紫系 `rgba(123,104,238,...)` 5箇所 | 同上 |
| **PageHeader.jsx** | 茶系・金系 6箇所 | 同上 |
| **DecorativeCorner.jsx** | SVG 内の茶系・金系 3箇所 | 同上 |
| **BookDetail.jsx** | 茶系 3箇所 | 同上 |

**問題の本質**: テーマを切り替えても、これらのコンポーネントの見た目は**一切変わらない**。色がコンポーネントに埋め込まれている。

### 1.3 カードの装飾要素の詳細（色以外）

カードには**色だけでなく、形・構造・透過**による装飾が含まれる。本レビューでは以下を対象とする。

| 種別 | 実装 | 内容 | テーマ化の観点 |
|------|------|------|----------------|
| **角の装飾** | DecorativeCorner | L字型の金具風SVG（fill/stroke で金・茶色） | 色の変更、表示の有無 |
| **外枠** | `border: 2px solid` | カード外周の枠線 | 色、太さ |
| **内枠** | `::before` | 8px inset の角丸二重枠（1px の薄い線） | 色、表示の有無 |
| **中央縦線** | `::after` | 幅1px・高さ100%の縦線、グラデーション（透明→色→透明） | 色、表示の有無 |
| **ガラス効果** | `backgroundColor` + `backdropFilter` | `rgba(255,255,255,0.75)` + `blur(20px) saturate(180%)` | 透明度、blur量 |
| **影・ハイライト** | `boxShadow` | 外側の影 + `inset` の白ハイライト | 色・強さ、minimal では控えめに |

**透過**は次のように使われている:
- カード背景: `rgba(255,255,255,0.75)` で背景が透けて見える
- 枠線・装飾色: すべて `rgba(..., 0.1〜0.3)` の透明度付き
- `backdropFilter` によるぼかしでガラス感を付与

**minimal-light などでは想定される扱い**:
- 角の装飾・内枠・中央縦線を**非表示**にする選択肢
- ガラス効果を弱める（透明度を上げる、blur を減らす）
- 影を控えめにする

---

## 2. 設計・実装上の問題

### 2.1 デザイン値の二重管理

- **createThemeFromPreset**: `custom.pageHeader.brown` を定義しているが、**PageHeader は参照していない**
- **BookCard, MemoCard**: テーマの `palette` を一切使わず、独自の色を直書き
- 結果: テーマで色を変えても、コンポーネントは応じない

### 2.2 パレットの不足

- **現状の theme.palette.custom**: `pageHeader.brown` のみ
- **不足しているトークン**:
  - カード装飾用の茶系（border, light, lighter 等の透明度バリエーション）
  - メモ用の紫系（SearchResults で使用）
  - 金系アクセント（PageHeader, DecorativeCorner）
  - ガラス風スタイルの共通定義（backgroundColor, backdropFilter 等）
  - **装飾の有無**: 角・内枠・中央縦線をプリセットごとにオン/オフするフラグ

### 2.3 テーマプリセットとコンポーネントの断絶

```
themePresets.js  →  createThemeFromPreset  →  ThemeProvider
                         ↓
                  palette.background, overlay 等は設定される
                         ↓
                  しかし BookCard, MemoCard 等は
                  theme を参照せず独自の色を使う
                         ↓
                  テーマ切り替えが効かない
```

### 2.4 DecorativeCorner の特殊性

- SVG の `fill` / `stroke` に色を直接指定
- `useTheme()` で取得して動的に渡す必要がある
- あるいは `color` / `colorSecondary` を props で受け取る設計に変更

---

## 3. テーマとして「変更可能」にしたい範囲

### 3.1 必須（テーマ差別化の本質）

| 要素 | 現状 | 目標 |
|------|------|------|
| 背景（画像・パターン・色） | ✅ 対応済 | そのまま |
| オーバーレイ | ✅ 対応済 | そのまま |
| カードのアクセント色 | ❌ ハードコード | 茶系⇔紫系⇔ニュートラル 等をプリセットで切替 |
| 装飾（角・枠線・グラデーション） | ❌ ハードコード | プリセットごとに有無・色を制御 |

### 3.2 推奨（一貫性のため）

| 要素 | 現状 | 目標 |
|------|------|------|
| ガラス風スタイル（透明度・blur） | 重複あり | テーマで一元定義 |
| PageHeader の装飾 | ✅ プリセットで全面制御（2025-01-31実装） | themePresets.pageHeader |
| 書籍 vs メモの区別色 | コンポーネントで固定 | テーマで「書籍用」「メモ用」のアクセントを定義 |

### 3.3 任意（将来検討）

| 要素 | 備考 |
|------|------|
| フォントサイズ | 既にテーマにあるが、コンポーネントの上書きが多い |
| レイアウト（グリッド列数等） | テーマで変える必要性は低い |
| 装飾の有無（DecorativeCorner の表示可否） | プリセットで `decorativeCorners: false` 等 |

---

## 4. 解決のための実装アプローチ

### 4.1 パレット拡張（Phase 1）

**目的**: 茶系・紫系・金系をテーマの `palette` に定義し、コンポーネントが参照できるようにする

```javascript
// createThemeFromPreset.js の palette に追加
palette: {
  // 既存...
  decorative: {
    brown: {
      main: 'rgba(139, 69, 19, 1)',
      light: 'rgba(139, 69, 19, 0.2)',
      lighter: 'rgba(139, 69, 19, 0.1)',
      border: 'rgba(139, 69, 19, 0.25)',
    },
    gold: {
      accent: 'rgba(184, 134, 11, 0.15)',
      stroke: 'rgba(184, 134, 11, 0.4)',
    },
    memo: {
      main: 'rgba(123, 104, 238, 1)',
      light: 'rgba(123, 104, 238, 0.25)',
      lighter: 'rgba(123, 104, 238, 0.12)',
    },
    // minimal-light 用: ニュートラル
    neutral: {
      light: 'rgba(100, 100, 100, 0.15)',
      border: 'rgba(100, 100, 100, 0.2)',
    },
  },
},
```

**プリセットごとの差**: library-classic は brown/gold、minimal-light は neutral を「カード用アクセント」として使う。

### 4.2 コンポーネントの置換（Phase 2）

各コンポーネントで `theme.palette.decorative.xxx` を参照するように変更:

| コンポーネント | 置換内容 |
|----------------|----------|
| BookCard | `rgba(139,69,19,0.2)` → `theme.palette.decorative.brown.light` |
| MemoCard | 同上（書籍表示時）、SearchResults 経由のメモ表示時は memo |
| SearchResults | 書籍＝brown、メモ＝memo をテーマから取得 |
| PageHeader | brown, gold をテーマ参照 |
| DecorativeCorner | `useTheme()` で色を取得、または props で渡す |
| BookDetail | brown をテーマ参照 |

**フォールバック**: テーマに `decorative` が無い場合のフォールバック値を用意（後方互換）。

### 4.3 プリセットごとのアクセント・装飾指定（Phase 3）

テーマプリセットに「カードのアクセント」と「装飾の有無」を追加:

```javascript
// themePresets.js
'library-classic': {
  // 既存...
  cardAccent: 'brown',       // decorative.brown, decorative.gold を使用
  cardDecorations: {         // 装飾の有無（角・内枠・中央縦線）
    corners: true,
    innerBorder: true,
    centerLine: true,
  },
  glassEffect: { opacity: 0.75, blur: '20px', saturate: '180%' },
},
'minimal-light': {
  // 既存...
  cardAccent: 'neutral',
  cardDecorations: { corners: false, innerBorder: false, centerLine: false },
  glassEffect: { opacity: 0.9, blur: '12px', saturate: '140%' },  // 控えめ
},
```

コンポーネントは `theme.custom?.cardDecorations` を参照し、`::before` / `::after` / `DecorativeCorner` の表示を制御。ガラス効果も `theme.custom?.glassEffect` から取得。

### 4.4 ガラス風スタイルの共通化（Phase 4・任意）

`theme.components.MuiCard` と各コンポーネントの `sx` で重複している値を、テーマの `stylePresets.glassCard` に集約。テーマプリセットごとに `glassOpacity` や `blur` を変えられるようにする。

---

## 5. 実装順序と依存関係

```
Phase 1: パレット拡張
   └─ createThemeFromPreset に decorative を追加
   └─ 各プリセットで cardAccent を定義（brown / neutral）

Phase 2: コンポーネントのパレット参照化
   └─ BookCard, MemoCard, SearchResults, PageHeader, DecorativeCorner, BookDetail
   └─ ハードコードを theme.palette.decorative 参照に置換

Phase 3: プリセット間の見た目差別化
   └─ minimal-light で neutral を使用していることを確認
   └─ 必要なら装飾の有無（DecorativeCorner の条件表示）を追加

Phase 4（任意）: ガラス風スタイルの共通化
   └─ 重複する backgroundColor, backdropFilter をテーマに集約
```

**Phase 1 と 2 が完了すれば**、テーマ切り替え時にカード・PageHeader・装飾の色がプリセットに追従する。

---

## 6. 論点・検討事項

### 6.1 既存の見た目の維持

**方針**: 重要ではない。設計として正しい状態にしたい。現状維持のためのフォールバックや互換コードを残し、今後の修正の障害にするのは避ける。

### 6.2 minimal-light の「ミニマル」の程度

- 特に問題ない
- `cardAccent: 'neutral'` と `decorativeCorners: false` をプリセットに持たせる方針で進める

### 6.3 appTheme.js の扱い

**結論の方向性**: 正しい設計上不要なら廃止してよい。以下、機能の詳細と必要性を整理する。

#### appTheme.js の機能一覧

| セクション | 内容 | 備考 |
|------------|------|------|
| **palette** | background, primary, secondary, success, warning, info, error, text, custom.pageHeader | createThemeFromPreset と同等 |
| **typography** | fontFamily, h1〜caption の fontSize（レスポンシブ） | 同上 |
| **components.MuiCssBaseline** | #app-scroll-container の背景・オーバーレイ | 同上（createThemeFromPreset がプリセット別に設定） |
| **components.MuiTextField** | marginBottom, fontSize, backgroundColor | 同上 |
| **components.MuiButton** | fontSize, padding | 同上 |
| **components.MuiCard** | height, marginBottom, borderRadius, border, backgroundColor, backdropFilter, boxShadow | 同上 |
| **components.MuiCardContent** | padding | 同上 |
| **components.MuiPaper** | padding, borderRadius, border, backgroundColor, backdropFilter | 同上 |
| **components.MuiMenu** | paper の borderRadius, border, backgroundColor, boxShadow | 同上 |
| **components.MuiPopover** | 同上 | 同上 |
| **components.MuiAutocomplete** | marginBottom | 同上 |
| **components.MuiChip** | fontSize, height | 同上 |
| **components.MuiDialog** | paper の margin, width, borderRadius, border, backgroundColor, boxShadow | 同上 |
| **components.MuiBottomNavigation** | height | 同上 |
| **components.MuiBottomNavigationAction** | fontSize | 同上 |
| **components.MuiAlert** | backgroundColor, backdropFilter | 同上 |
| **breakpoints** | xs, sm, md, lg, xl | 同上 |
| **spacing** | 4px * factor | 同上 |

#### 使用箇所

| 箇所 | 用途 |
|------|------|
| **本番アプリ** | 使用していない（ThemeProviderWithUserSettings → createThemeFromPreset を使用） |
| **Settings.test.jsx** | ThemeProvider に appTheme を渡す |
| **LoadingIndicator.test.jsx** | 同上 |
| **test-utils.js** | renderWithProviders の ThemeProvider に appTheme を渡す |

#### 結論

- **appTheme.js は本番で未使用**。createThemeFromPreset が唯一のテーマ生成手段。
- **内容は createThemeFromPreset と完全重複**。静的スナップショットであり、プリセット切り替えに対応していない。
- **テスト**では固定テーマが必要なため appTheme を使っているが、`createThemeFromPreset('library-classic', buildPath)` で代替可能。
- **設計上**: テーマは createThemeFromPreset に一本化するのが正しい。appTheme.js は**廃止してよい**。テストは `createThemeFromPreset` を使うよう変更する。

### 6.4 index.css の扱い

**結論の方向性**: 存在自体が設計・実装上紛らわしいだけなら廃止の方向。以下、内容と必要性を整理する。

#### index.css の内容

| セクション | 内容 | 問題・備考 |
|------------|------|------------|
| **:root** | font-family, color-scheme: light dark, color, background-color: #242424 | ダーク系デフォルト。次の html,body と矛盾 |
| **a** | font-weight, color: #646cff, hover | リンク色。MUI の Typography component="a" はテーマを参照する場合あり |
| **html, body, #root** | background: #f5f7fa !important, color: #222 | ライト固定。`#eef2ff`（テーマ）と不一致。`!important` で上書き |
| **html** | scroll-behavior: smooth | 有用（スクロールの挙動） |
| *** (user-select)** | 要素を選択不可、input/textarea は選択可 | モバイル向けに有用 |
| **h1** | font-size: 3.2em | アプリは MUI Typography を主に使用。影響範囲は限定的 |
| **button** | 汎用 button のスタイル | MUI Button を使うため、ほぼ未使用の可能性 |
| **button:focus 等** | outline | MUI コンポーネントと競合しうる |
| **@media (max-width: 768px)** | フォーカス outline, タッチターゲット min 44px | 有用（アクセシビリティ） |
| **prefers-color-scheme: light** | :root を上書き | さらに混乱。実質ライト固定なのに :root がダーク |
| ** scrollbar** | モバイルで非表示 | 有用 |
| **[data-testid^="chart-"]** | Stats 用マージン | アプリ固有。必要なら別管理も可 |

#### 問題点

1. **:root と html,body の二重定義**: ダーク→ライトと上書きが重なり、何が最終的に適用されるか分かりにくい
2. **色の不一致**: #f5f7fa vs テーマの #eef2ff。テーマを変えても index.css は変わらない
3. **背景の二重管理**: html,body の background と #app-scroll-container の背景が競合。ローディング時やアプリ外の隙間には index.css の背景が出る
4. **button, a のスタイル**: MUI がほとんどの UI を提供するため、影響が小さい。ただしフォーカス等は競合しうる

#### 有用な部分（残す価値あり）

- `scroll-behavior: smooth`
- `user-select` の制御（モバイル）
- タッチターゲット min 44px
- モバイルのスクロールバー非表示
- `-webkit-font-smoothing` 等（フォントレンダリング）
- Stats chart の margin（`[data-testid^="chart-"]`）

#### 廃止の方向で進める場合

1. **index.css を極小化**する: 紛らわしい `:root` / `html,body` の色・背景を削除し、`transparent` や削除でテーマに委ねる
2. 有用な部分のみ残す: user-select, scrollbar, touch targets, font-smoothing, scroll-behavior, chart margin
3. **完全廃止**は、上記を MUI の `CssBaseline` や `createThemeFromPreset` の `styleOverrides`、あるいは専用の小さい CSS モジュールに移す必要がある

**推奨**: 紛らわしい部分（:root の色、html/body の background/color、button の詳細スタイル）を削除し、必要最小限のスタイルだけ残す「整理」を先に実施。完全廃止は、移行先が明確になった段階で検討する。

---

## 7. まとめ：何をしなければならないか

### 必須

1. **パレット拡張**: `theme.palette.decorative` に brown, gold, memo, neutral を定義
2. **コンポーネントの置換**: BookCard, MemoCard, SearchResults, PageHeader, DecorativeCorner, BookDetail のハードコードをテーマ参照に変更
3. **プリセットごとのアクセント指定**: 各プリセットで `cardAccent` を持たせ、minimal-light は neutral を使用

### 推奨

4. **DecorativeCorner の条件表示**: プリセットで `decorativeCorners: false` の場合は非表示
5. **ガラス風スタイルの共通化**: 重複値のテーマへの集約

### 見積もり（目安）

- Phase 1: 1〜2時間
- Phase 2: 2〜3時間
- Phase 3: 1時間
- Phase 4: 2〜3時間（任意）

---

**関連ドキュメント**:
- `doc/design-system-overview.md` - デザインシステム概要（実装完了後の参照用）
- `doc/design-review-and-centralization-20260131.md` - 現状レビュー・一元化ロードマップ
- `doc/theme-selectable-review-20260131.md` - テーマ選択実装の障壁分析（一部は Task B で解消済み）
