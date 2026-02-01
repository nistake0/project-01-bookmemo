# 「スリム」テーマ追加の可否検討

**作成日**: 2025年1月31日  
**目的**: フォント・余白・一覧性を重視した「スリム」テーマの実現可能性と、チェックボックスUI・レイアウト変更の可否を検討する

---

## 1. 要件整理

| 項目 | 内容 |
|------|------|
| フォント | 一回り小さめ、全体的に少し小さめ |
| 一覧性 | 一覧での表示効率を高める |
| 余白 | カード・配置の余白を狭く、画面を大きく占有しない |
| タイトル | あまり大きくしない |
| タグ検索・統計 | 小さい矩形でスマホでも横に並び一覧性を良くする |
| チェックボックス選択 | UI 改善を考慮 |
| スタイル変更による配置変更 | 可能か検討 |

---

## 2. 現状のテーマ・コンポーネント構造

### 2.1 テーマで既に制御可能な項目

| プロパティ | 現状 | スリム対応 |
|------------|------|------------|
| typographyOverrides | cardTitle, cardSubtext, chipLabel, formText 等 | ✅ プリセットで縮小値を定義可能 |
| pageHeader | titleFontSize, subtitleFontSize | ✅ 縮小可能 |
| sizes | bookCoverCard, bookCard, memoCard, formButton | ✅ 縮小可能 |
| spacing.cardPadding | { xs: 1.5, sm: 2 } | ✅ 縮小可能（例: { xs: 1, sm: 1.5 }） |
| MUI typography (h1-h6, body1, body2) | createThemeFromPreset で固定 | ⚠️ プリセットごとの上書きが必要 |

### 2.2 現状ハードコードされている項目

| 箇所 | 内容 | テーマ化の要否 |
|------|------|----------------|
| createThemeFromPreset | typography の fontSize | スリム用にプリセットから上書きする必要あり |
| Stats | gridTemplateColumns: 'repeat(3, 1fr)', gap | スリムでは列数・gap の変更を検討 |
| TagStats | gridTemplateColumns: 'repeat(3, 1fr)', tag-stats-grid | 同上 |
| BookList | gridTemplateColumns: xs 1fr, sm 2, md 3, lg 4 | スリムでは md 4, lg 5 等の検討 |
| SearchResults | gridTemplateColumns, gap | 同上 |
| TagSearchField, AdvancedSearchForm | Paper の p: 2 | spacing で統一可能 |
| MuiTextField, MuiButton | fontSize, padding | プリセット由来の上書きが必要 |

---

## 3. 実現可能性

### 3.1 結論：**実現可能。ただし拡張範囲により工数が変わる**

- **Phase 1（最小限）**: 既存の theme.custom のみ拡張  
  → typographyOverrides, sizes, spacing, pageHeader をスリム用に縮小。多くのコンポーネントは既にこれらを参照しているため、**工数は小〜中**。
- **Phase 2（レイアウト含む）**: theme.custom.layout を新設し、grid 系をテーマ制御  
  → 配置・列数・gap をテーマで切り替え。**工数は中〜大**。

---

## 4. 必要な拡張

### 4.1 createThemeFromPreset の拡張

現状、MUI の typography（h1〜h6, body1, body2, caption）はプリセット非依存で固定。スリムでは全体を約 85〜90% に縮小する必要がある。

**案A**: プリセットに `typographyScale?: number` を追加し、createThemeFromPreset で全 fontSize に乗算  
**案B**: プリセットに `typography?: Partial<TypographyOptions>` を追加し、マージ  
**案C**: プリセットに `density?: 'comfortable' | 'compact' | 'slim'` を追加し、それに応じて typography を切り替え  

→ **案A** がシンプルで拡張しやすい。

### 4.2 theme.custom への layout 追加（Phase 2）

```js
layout: {
  bookListGrid: {
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
    gap: { xs: 1.5, sm: 2 },
  },
  statsSummaryGrid: {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: { xs: 1, sm: 2 },
  },
  tagStatsGrid: {
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
    gap: { xs: 1, sm: 1.5 },
  },
  searchResultsGrid: { ... },
}
```

スリムでは `gridTemplateColumns` の列数を増やし、`gap` を小さくする。

### 4.3 コンポーネント側の対応

- **既に theme.custom を参照しているコンポーネント**: 追加対応ほぼ不要。
- **ハードコードしているコンポーネント**: `useTheme()` で `theme.custom.layout` を参照するよう変更。

---

## 5. チェックボックス・選択 UI の改善

### 5.1 現状の選択 UI

| 箇所 | 現在の UI | 役割 |
|------|-----------|------|
| Settings（テーマ選択） | RadioGroup + FormControlLabel | テーマ選択 |
| MemoContentSearchField | FormControlLabel + Checkbox | メモ内容検索の有効/無効 |
| （将来）タグ一括選択等 | - | 複数選択 |

### 5.2 スリム向けの UI 改善案

1. **テーマ選択**
   - 現状: RadioGroup で縦に並ぶカード形式
   - スリム案:
     - コンパクトな Chip または ToggleButtonGroup で横並び
     - またはカードを小さくし 2〜3 列で表示

2. **メモ内容検索チェックボックス**
   - 現状: FormControlLabel + Checkbox
   - スリム案:
     - Switch に変更して横スペースを削減
     - または FormControlLabel の label を短く（「メモも検索」等）

3. **共通方針**
   - theme.custom に `formControlLabel`, `checkbox`, `switch` のサイズ・余白を追加
   - スリムでは `size="small"` や `sx` で compact 化

### 5.3 実装の難易度

- テーマ選択のレイアウト変更: **小**（Settings のみ）
- Checkbox → Switch 等の部品変更: **小**（該当コンポーネントのみ）
- テーマに応じた切り替え: **中**（theme.custom に項目追加し、条件分岐）

---

## 6. スタイル変更に伴う配置変更の可否

### 6.1 結論：**可能**

- レイアウト（grid の列数・gap）を `theme.custom.layout` に持たせ、コンポーネントが `useTheme()` で参照する形にすれば、**テーマ切り替えで配置も変わる**。
- 既存テーマ（library-classic, minimal-light）には `layout` を追加しない、またはデフォルト値を定義して互換を保つ。

### 6.2 注意点

- レイアウト変更は画面の印象を大きく変えるため、十分なテストと実機確認が必要。
- 極端に列数を増やすと、タッチターゲットが小さくなりすぎる可能性がある。

---

## 7. 推奨実装フェーズ

### Phase 1（スリムテーマ・基本）

1. themePresets に `slim-compact`（または `slim`）を追加
2. typographyOverrides, sizes, spacing, pageHeader をスリム用に縮小
3. createThemeFromPreset で `typographyScale` または `typography` をプリセットから適用
4. THEME_PRESET_IDS に追加、Settings で選択可能に

### Phase 2（レイアウト・一覧性強化）

5. theme.custom.layout を定義
6. BookList, Stats, TagStats, SearchResults 等で layout を参照するように変更
7. スリム用に列数増・gap 減を設定

### Phase 3（選択 UI 改善）

8. テーマ選択を Chip / ToggleButtonGroup 等でコンパクト化
9. MemoContentSearchField の Checkbox を Switch 化（オプション）
10. スリムテーマ時にフォーム系を compact にする条件分岐

---

## 8. まとめ

| 項目 | 可否 | 備考 |
|------|------|------|
| スリムテーマの追加 | ✅ 可能 | 既存テーマ構造の拡張で対応可能 |
| フォント・余白の縮小 | ✅ 可能 | typographyOverrides, sizes, spacing の拡張 |
| タグ検索・統計の小さい矩形と横並び | ✅ 可能 | layout のテーマ化とスリム用 grid 設定 |
| チェックボックス等の UI 改善 | ✅ 可能 | 部品の差し替えと compact オプション |
| スタイル変更に伴う配置変更 | ✅ 可能 | theme.custom.layout の導入で実現 |

**推奨**: Phase 1 から着手し、スリムテーマの効果を確認してから Phase 2・3 に進める。
