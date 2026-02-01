# スリムテーマ 実装計画・設計

**作成日**: 2025年1月31日  
**目的**: スリムテーマの具体的な設計と実装方針を定める  
**前提**: `doc/design-slim-theme-feasibility-review.md` の可否検討を確認済み

---

## 1. プリセット定義

### 1.1 基本方針

- **プリセットID**: `slim-compact`
- **名称**: スリム（コンパクト）
- **説明**: フォント・余白を抑え、一覧性を重視。スマホでも多くの情報を横に並べて表示
- **ベース**: minimal-light をベースに、フォント・サイズ・レイアウトを縮小

### 1.2 スリム専用の縮小率

| 項目 | 通常 | スリム | 備考 |
|------|------|--------|------|
| typographyScale | 1.0 | 0.88 | MUI typography 全体に乗算 |
| 余白・gap | 1x | 0.75x | spacing 単位換算 |
| カード minHeight | 基準値 | -15〜20% | sizes で指定 |

---

## 2. Phase 1: 基本テーマ実装

### 2.1 createThemeFromPreset の拡張

**追加**: プリセットに `typographyScale?: number` を定義

```js
// 適用ロジック
const scale = preset.typographyScale ?? 1;
const baseTypography = {
  h1: { fontSize: `${1.8 * scale}rem`, ... },
  h2: { fontSize: `${1.5 * scale}rem`, ... },
  // ... 全 variant に scale を乗算
};
```

**実装要点**:
- `typographyScale` が未定義のプリセットは 1.0（現状維持）
- `@media (min-width:600px)` 等のレスポンシブ値も scale を乗算

### 2.2 themePresets.js スリムプリセット

```js
'slim-compact': {
  id: 'slim-compact',
  name: 'スリム（コンパクト）',
  description: 'フォント・余白を抑え、一覧性を重視。多くの情報を画面に表示',
  typographyScale: 0.88,
  // minimal-light をベース
  background: { image: 'none', pattern: 'none' },
  overlay: { top: 'transparent', mid: 'transparent', bottom: 'transparent' },
  backgroundColor: '#f5f5f5',
  bookAccent: 'neutral',
  memoAccent: 'neutral',
  cardAccent: 'neutral',
  bookDecorations: { corners: false, innerBorder: false, centerLine: false },
  memoDecorations: { corners: false, innerBorder: false, centerLine: false },
  cardDecorations: { corners: false, innerBorder: false, centerLine: false },
  glassEffect: { opacity: 0.92, blur: '10px', saturate: '130%' },
  pageHeader: {
    backgroundImage: 'none',
    goldOverlay: false,
    centerLine: false,
    borderRadius: 0,
    accentKey: 'neutral',
    titleFontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
    subtitleFontSize: { xs: '0.75rem', sm: '0.85rem' },
  },
  typographyOverrides: {
    cardTitle: { fontSize: { xs: '0.8rem', sm: '0.88rem', md: '0.95rem' } },
    cardSubtext: { fontSize: { xs: '0.68rem', sm: '0.72rem', md: '0.8rem' } },
    cardCaption: { fontSize: { xs: '0.62rem', sm: '0.66rem', md: '0.72rem' } },
    chipLabel: { fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.66rem' }, height: { xs: 16, sm: 18, md: 20 } },
    formText: { fontSize: { xs: '0.72rem', sm: '0.8rem' } },
    chipSmall: { fontSize: '0.66rem' },
    formChip: { fontSize: { xs: '0.66rem', sm: '0.72rem' }, height: { xs: 20, sm: 24 } },
  },
  sizes: {
    bookCoverCard: { width: { xs: 44, sm: 52 }, height: { xs: 62, sm: 70 } },
    bookCoverDetail: { maxHeight: 200, width: 140 },
    bookCoverFormPreview: { maxHeight: 100 },
    bookCoverDialogPreview: { maxHeight: 150 },
    bookCard: { minHeight: { xs: 120, sm: 135 }, tagAreaMinHeight: { xs: 26, sm: 30 } },
    memoCard: {
      textArea: { minHeight: 40, maxHeight: 68 },
      actionArea: { minHeight: { xs: 40, sm: 54 }, maxHeight: { xs: 60, sm: 76 } },
    },
    formButton: { height: { xs: 34, sm: 46 } },
  },
  spacing: {
    cardPadding: { xs: 1, sm: 1.5 },
  },
  // layout は Phase 2 で追加
},
```

### 2.3 MuiTextField / MuiButton のプリセット対応

現状、createThemeFromPreset 内で MuiTextField / MuiButton の fontSize は固定。  
`typographyScale` または `preset.typographyOverrides` に基づき、コンポーネントの styleOverrides も scale を適用する。

### 2.4 変更ファイル（Phase 1）

| ファイル | 変更内容 |
|----------|----------|
| themePresets.js | slim-compact プリセット追加、THEME_PRESET_IDS に追加 |
| createThemeFromPreset.js | typographyScale の読み取りと typography への適用、MuiTextField/MuiButton の scale 適用 |
| constants/userSettings.js | DEFAULT_THEME_PRESET_ID は変更しない（既存ユーザー維持） |

---

## 3. Phase 2: レイアウトのテーマ化

### 3.1 theme.custom.layout の設計

既存テーマには `layout` を追加しない（undefined のときはコンポーネントの現行ハードコードを使用）。  
スリムのみ `layout` を定義し、参照するコンポーネントは `theme.custom?.layout?.[key] ?? 現行値` でフォールバック。

### 3.2 layout キーとデフォルト値

| キー | 用途 | デフォルト（layout 未定義時） | スリム |
|------|------|------------------------------|--------|
| bookListGrid | BookList 書籍一覧 | xs:1, sm:2, md:3, lg:4, gap: 1.5-2 | xs:1, sm:2, md:4, lg:5, gap: 1-1.5 |
| searchResultsGrid | SearchResults | xs:1, sm:2, md:3, gap: 2 | xs:1, sm:2, md:4, gap: 1.5 |
| statsSummaryGrid | Stats 数値カード5枚 | 3列, gap: 1-2 | 3列維持 or 5列（1行）, gap: 0.75-1.5 |
| statsChartGrid | Stats 月別グラフ2枚 | xs:1, md:2, gap: 2 | xs:1, md:2, gap: 1.5 |
| statsTagGrid | Stats タグ統計10件 | xs:1, sm:2, gap: 2 | xs:2, sm:3, md:4, gap: 1-1.5 |
| tagStatsSummaryGrid | TagStats サマリー3項目 | 3列, gap: 2 | 3列, gap: 1.5 |
| tagStatsGrid | TagStats タグカード一覧 | 現状 block（要確認） | xs:2, sm:3, md:4, gap: 1-1.5 |
| dateRangeGrid | DateRangeSelector | 1fr 1fr, gap: 2 | 1fr 1fr, gap: 1.5 |

### 3.3 スリム用 layout 定義

```js
layout: {
  bookListGrid: {
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
    gap: { xs: 1, sm: 1.5 },
  },
  searchResultsGrid: {
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
    gap: 1.5,
  },
  statsSummaryGrid: {
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
    gap: { xs: 0.75, sm: 1.5 },
  },
  statsChartGrid: {
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: 1.5,
  },
  statsTagGrid: {
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
    gap: { xs: 1, sm: 1.5 },
  },
  tagStatsSummaryGrid: {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 1.5,
  },
  tagStatsGrid: {
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
    gap: { xs: 1, sm: 1.5 },
  },
  dateRangeGrid: {
    gridTemplateColumns: '1fr 1fr',
    gap: 1.5,
  },
},
```

### 3.4 コンポーネント変更一覧（Phase 2）

| コンポーネント | 変更内容 |
|----------------|----------|
| BookList.jsx | sx の grid を `theme.custom?.layout?.bookListGrid` から取得、フォールバックは現行値 |
| SearchResults.jsx | 同上 searchResultsGrid |
| Stats.jsx | statsSummaryGrid, statsChartGrid, statsTagGrid を参照 |
| TagStats.jsx | tagStatsSummaryGrid, tagStatsGrid を参照、tag-stats-grid に grid を適用 |
| DateRangeSelector.jsx | dateRangeGrid を参照 |
| createThemeFromPreset.js | layout を theme.custom にマージ |

### 3.5 Stats 数値カードの列数について

現状5枚（総冊数、積読、読書中、再読中、読了）が `repeat(3, 1fr)` で折り返し表示。  
スリムでは `repeat(5, 1fr)` で1行に並べるか、`repeat(3, 1fr)` のまま gap のみ縮小するか検討。

- **案A**: 5列で1行（横長画面で有効、スマホでは2-3列に折り返し）
- **案B**: 3列維持、gap のみ縮小（変更少、タッチターゲット確保）

→ 初期は **案B** を推奨。スマホでは列数増は `repeat(2, 1fr)` 等で対応可能。

---

## 4. Phase 3: 選択 UI 改善

### 4.1 テーマ選択 UI

**現状**: RadioGroup + FormControlLabel で縦並び

**改善案**:
- **案A**: ToggleButtonGroup で横並び Chip 風（1行に収まる）
- **案B**: カードを小さくし、Grid で 2〜3 列表示
- **案C**: テーマに依らず共通で、Select ドロップダウンに変更（最もコンパクト）

**推奨**: **案A**。テーマ数が3〜4のとき ToggleButtonGroup で横並びにすると一覧性が高い。

```jsx
<ToggleButtonGroup
  value={settings.preferences?.themePresetId || 'library-classic'}
  exclusive
  onChange={(e, value) => value && updatePreferences({ themePresetId: value })}
  fullWidth
  size="small"
>
  {Object.values(themePresets).map((preset) => (
    <ToggleButton key={preset.id} value={preset.id}>
      <Box sx={{ textAlign: 'center', py: 0.5 }}>
        <Typography variant="body2">{preset.name}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {preset.description}
        </Typography>
      </Box>
    </ToggleButton>
  ))}
</ToggleButtonGroup>
```

- テーマが増えると横に長くなるため、`flexWrap: 'wrap'` または `variant="outlined"` で折り返しを考慮。

### 4.2 MemoContentSearchField の Checkbox

**現状**: FormControlLabel + Checkbox「メモ内容も検索対象に含める」

**改善案**:
- **案A**: Switch に変更（横スペース削減、ON/OFF が明確）
- **案B**: ラベル短縮「メモも検索」のまま Checkbox 継続
- **案C**: テーマに依らず Switch に統一（全テーマでコンパクト化）

**推奨**: **案C**。Switch の方がコンパクトで、検索オプションの ON/OFF に適している。

### 4.3 theme.custom へのフォーム拡張（オプション）

スリム時に FormControlLabel / Checkbox / Switch を compact 化する場合:

```js
formControls: {
  checkboxSize: 'small',
  switchSize: 'small',
  formControlLabelMargin: 0,
},
```

- 現状は MUI の `size="small"` で十分な場合は、追加項目は最小限とする。

---

## 5. 実装順序と依存関係

```
Phase 1
├── createThemeFromPreset: typographyScale 対応
├── themePresets: slim-compact 追加
├── THEME_PRESET_IDS 追加
└── 動作確認・テスト

Phase 2
├── createThemeFromPreset: layout を theme.custom にマージ
├── themePresets: slim-compact に layout 追加
├── BookList, SearchResults, Stats, TagStats, DateRangeSelector を layout 参照に変更
└── 動作確認・テスト

Phase 3
├── Settings: テーマ選択を ToggleButtonGroup 化（または Chip 選択）
├── MemoContentSearchField: Checkbox → Switch
└── 動作確認・テスト
```

---

## 6. 注意事項・リスク

| 項目 | 対策 |
|------|------|
| タッチターゲット | 44px 以上推奨。スリムで小さくなりすぎないよう、sizes の下限を設定 |
| 既存テーマへの影響 | layout はスリムのみ定義。既存テーマは layout 未使用で現状維持 |
| テスト | 各 Phase ごとにスリム選択時の表示確認、既存テーマのリグレッション確認 |
| アクセシビリティ | フォント縮小時に視認性が下がらないか実機で確認 |

---

## 7. 実装状況

### Phase 1 完了（2025-01-31）

- createThemeFromPreset: typographyScale 対応、scaleFontSize / scaleTypographyObj ヘルパー追加
- themePresets: slim-compact プリセット追加
- THEME_PRESET_IDS に slim-compact 追加
- Settings のテーマ選択 UI は getThemePresets から自動取得するため、追加対応不要

### Phase 2 完了（2025-02-01）

- createThemeFromPreset: layout を theme.custom にマージ
- themePresets: slim-compact に layout 定義追加
- BookList, SearchResults, Stats, TagStats, DateRangeSelector を theme.custom.layout 参照に変更
- TagStats の tag-stats-grid に grid レイアウトを追加（従来は block）

### Phase 3 完了（2025-02-01）

- Settings: RadioGroup → ToggleButtonGroup に変更、テーマを横並びで選択
- MemoContentSearchField: Checkbox → Switch に変更（コンパクト化）

---

## 8. まとめ

- **Phase 1**: typographyScale + スリム用 typographyOverrides / sizes / spacing で基本スリム化
- **Phase 2**: layout のテーマ化でグリッド列数・gap をスリム向けに変更
- **Phase 3**: テーマ選択を ToggleButtonGroup 化、MemoContentSearchField を Switch 化

各 Phase は独立して着手可能。Phase 1 完了後に効果を確認してから Phase 2・3 に進めることを推奨する。
