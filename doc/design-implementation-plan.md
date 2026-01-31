# デザイン要素分離・統一 実装計画

**作成日**: 2025年1月31日  
**方針**: `doc/design-element-classification-and-policy.md` に基づく  
**説明カード**: 案C（MUIデフォルト相当、装飾なし）  
**テスト方針**: 新規実装ごとにテストを追加し、カバレッジ漏れを防ぐ

---

## 1. 全体スケジュール

| Phase | 内容 | 新規テスト | 既存テスト更新 |
|-------|------|------------|----------------|
| 0 | フォールバック共通化・boxShadow テーマ化（土台） | あり | 最小限 |
| 1 | プリセット分離（bookAccent / memoAccent） | あり | あり |
| 2 | 書籍系スタイル統一（useBookCardStyles） | あり | あり |
| 3 | メモ系分離（MemoCard → memoAccent） | なし | あり |
| 4 | 説明カード（案C）・統計グラフ色 | なし | 最小限 |

※ Phase 0 は `design-embedding-review.md` の短期推奨を先行して実施し、後続 Phase の重複を減らす。

---

## 2. Phase 0: 土台の整備

### 2.1 目的

- FALLBACK_ACCENT の共通化
- boxShadow のテーマ化
- 以降の Phase で重複を書かないための基盤

### 2.2 変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/theme/fallbacks.js` | **新規** 共通フォールバック値の定義 |
| `src/theme/createThemeFromPreset.js` | `cardShadow`, `cardShadowHover` をプリセットから取得し `theme.custom` に追加 |
| `src/theme/themePresets.js` | 各プリセットに `cardShadow`, `cardShadowHover` を追加 |
| `src/components/BookCard.jsx` | FALLBACK 削除、fallbacks を import。boxShadow を theme 参照に |
| `src/components/MemoCard.jsx` | 同上 |
| `src/components/search/SearchResults.jsx` | 同上 |
| `src/pages/BookDetail.jsx` | 同上 |

### 2.3 テスト

| テストファイル | 内容 |
|----------------|------|
| `src/theme/fallbacks.test.js` | **新規** fallbacks の export と値の存在確認 |
| `src/theme/createThemeFromPreset.test.js` | **新規** theme.custom に cardShadow, cardShadowHover が含まれること、preset 未定義時のフォールバック |
| 既存 | BookCard, MemoCard, SearchResults, BookDetail の既存テストが通ること |

### 2.4 実装順序

1. `fallbacks.js` 作成 → `fallbacks.test.js` 作成
2. `themePresets.js` に cardShadow / cardShadowHover 追加
3. `createThemeFromPreset.js` 修正 → `createThemeFromPreset.test.js` 作成
4. BookCard, MemoCard, SearchResults, BookDetail を順次修正
5. 全テスト実行・カバレッジ確認

---

## 3. Phase 1: プリセット分離

### 3.1 目的

- `bookAccent` と `memoAccent` をプリセットで別々に定義
- `cardAccent` は `bookAccent` のエイリアスとして後方互換維持
- `bookDecorations`, `memoDecorations` を追加（必要に応じて）

### 3.2 変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/theme/themePresets.js` | `bookAccent`, `memoAccent`, `bookDecorations`, `memoDecorations` 追加。`cardAccent` は `bookAccent` のエイリアスとして残す |
| `src/theme/createThemeFromPreset.js` | `theme.custom` に bookAccent, memoAccent, bookDecorations, memoDecorations を追加。cardAccent = bookAccent（互換） |

### 3.3 テスト

| テストファイル | 内容 |
|----------------|------|
| `src/theme/themePresets.test.js` | **新規** getThemePresets の戻り値に bookAccent, memoAccent が含まれること、library-classic / minimal-light で値が異なること |
| `src/theme/createThemeFromPreset.test.js` | theme.custom に bookAccent, memoAccent, bookDecorations, memoDecorations があること、未定義プリセット時のフォールバック |
| 既存 | Settings のテーマ選択テスト、他 theme 参照コンポーネントのテストが通ること |

### 3.4 実装順序

1. themePresets.js 修正
2. themePresets.test.js 作成
3. createThemeFromPreset.js 修正
4. createThemeFromPreset.test.js に Phase 1 ケース追加
5. 全テスト実行

---

## 4. Phase 2: 書籍系スタイル統一

### 4.1 目的

- `useBookCardStyles(theme)` または `getBookCardSx(theme)` を用意
- BookCard, BookDetail, SearchResults(book), BookForm, BookInfo, ExternalBookSearch, BookEditDialog で共有
- 同じ border, glass, decorations, boxShadow を参照

### 4.2 変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/theme/cardStyles.js` | **新規** `getBookCardSx(theme)`, `getMemoCardSx(theme)` をエクスポート。boxShadow, borderRadius, transition 等を theme から生成 |
| `src/components/BookCard.jsx` | cardSx を getBookCardSx(theme) の結果をベースに、コンポーネント固有の拡張のみ残す |
| `src/pages/BookDetail.jsx` | detailCardSx を getBookCardSx(theme) ベースに |
| `src/components/search/SearchResults.jsx` | renderBookResult の card sx を getBookCardSx ベースに |
| `src/components/BookForm.jsx` | フォームを包む Paper/Card があれば getBookCardSx 参照。現状 Paper で包んでいない場合は、必要に応じて適用 |
| `src/components/BookInfo.jsx` | 書影枠・プレースホルダーを theme 参照に。getBookCardSx はカード全体には使わないが、accent 色は bookAccent から取得 |
| `src/components/ExternalBookSearch.jsx` | 候補カードの sx を getBookCardSx ベースに（書籍データなので書籍系） |
| `src/components/BookEditDialog.jsx` | ダイアログ内コンテンツがカード風なら getBookCardSx の accent 等を参照 |

※ BookForm: 現状構造を確認し、Card/Paper で包む部分があれば適用。なければ Phase 2 ではスキップ可。

### 4.3 テスト

| テストファイル | 内容 |
|----------------|------|
| `src/theme/cardStyles.test.js` | **新規** getBookCardSx, getMemoCardSx が theme を渡すと sx オブジェクトを返すこと、theme.custom 未定義時のフォールバック、bookAccent / memoAccent で色が変わること |
| BookCard.test.jsx | theme に bookAccent を含む testTheme でレンダリングし、スタイルが適用されることをスナップショット or 存在確認（任意）。既存の表示・クリックテストは維持 |
| BookDetail.test.jsx | 同上 |
| SearchResults.test.jsx | 同上 |
| BookInfo.test.jsx | bookAccent 参照に変更後、既存テストが通ること |
| ExternalBookSearch.test.jsx | getBookCardSx 使用後、既存テストが通ること |
| BookForm.test.jsx | 変更があれば既存テストが通ること |
| BookEditDialog.test.jsx | 同上 |

### 4.4 実装順序

1. cardStyles.js 作成（getBookCardSx, getMemoCardSx）→ cardStyles.test.js 作成
2. BookCard から cardStyles を利用する形にリファクタ
3. BookDetail, SearchResults(book) を順次適用
4. BookInfo の accent 参照化
5. ExternalBookSearch, BookForm, BookEditDialog を必要に応じて適用
6. 各コンポーネントの既存テスト実行・必要なら ThemeProvider に testTheme を渡すよう統一

### 4.5 テストの ThemeProvider 統一

現状、BookCard.test.jsx は `createTheme()` を使用。theme.custom を持たないため、getBookCardSx はフォールバックで動作する。  
**推奨**: testTheme（createThemeFromPreset ベース）を使うよう BookCard.test.jsx 等を更新し、theme.custom が存在する環境でテストする。test-utils の renderWithProviders を利用するか、各テストで ThemeProvider theme={testTheme} を明示する。

---

## 5. Phase 3: メモ系分離

### 5.1 目的

- MemoCard の参照を `cardAccent` → `memoAccent` に変更
- SearchResults のメモカードはすでに memoAccent 使用のため整合確認
- getMemoCardSx を MemoCard, SearchResults(memo) で使用

### 5.2 変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/components/MemoCard.jsx` | accentKey を theme.custom.memoAccent に変更。cardSx を getMemoCardSx(theme) ベースに |
| `src/components/search/SearchResults.jsx` | renderMemoResult の card sx を getMemoCardSx ベースに（既に memoAccent 使用中のため、主に重複削減） |
| `src/components/MemoEditor.jsx` | カード部分があれば getMemoCardSx 参照（要確認） |
| `src/components/MemoAdd.jsx` | メモ表示部分があれば同様（要確認） |
| `src/components/MemoMoveDialog.jsx` | 既に theme 参照あり。memoAccent の一貫性確認 |

### 5.3 テスト

| テストファイル | 内容 |
|----------------|------|
| MemoCard.test.jsx | theme に memoAccent を含む testTheme でレンダリング。既存の表示・編集・削除テストは維持。memoAccent が brown と異なる色になることを確認するテストを追加（任意） |
| SearchResults.test.jsx | メモ結果カードの表示テストが通ること |

### 5.4 実装順序

1. MemoCard を memoAccent + getMemoCardSx に変更
2. SearchResults renderMemoResult を getMemoCardSx ベースに
3. MemoEditor, MemoAdd, MemoMoveDialog を必要に応じて修正
4. 全テスト実行

---

## 6. Phase 4: 説明カード（案C）・統計グラフ

### 6.1 目的

- **説明カード（案C）**: MUI の Card/Paper デフォルトに近づける。特別な theme 拡張はしない。既存の Card/Paper が装飾過多なら、それを削除する程度。
- **統計グラフ**: チャート色（#42a5f5, #9c27b0 等）を theme.custom.chartColors でテーマ化

### 6.2 説明カード（案C）の扱い

- Settings の Card、Stats の Card、検索フォームの Paper、LatestStatusHistory、StatusHistoryTimeline 等は、すでに MUI の Card/Paper を使用
- 現状、テーマの MuiCard styleOverrides で glass 効果等が全体に効いている可能性あり
- **案C**: 説明カード専用のオーバーライドは行わない。MUI デフォルトに近い = 既存の MuiCard のデフォルトスタイルをそのまま使う。もし書籍・メモカード以外の Card に装飾が当たっている場合は、コンポーネント側で sx を上書きして装飾をオフにする、程度の対応。
- **実装**: 調査の結果、説明カードに不要な装飾が当たっていなければ、Phase 4 では変更なし。当たっていれば、`variant="outlined"` や `elevation={0}` 等で控えめにする。

### 6.3 統計グラフ色のテーマ化

| ファイル | 変更内容 |
|----------|----------|
| `src/theme/themePresets.js` | 各プリセットに `chartColors: { bar: '#42a5f5', memo: '#9c27b0', ... }` を追加 |
| `src/theme/createThemeFromPreset.js` | theme.custom.chartColors を追加 |
| `src/pages/Stats.jsx` | BarChart の series[].color を theme.custom.chartColors から参照 |

### 6.4 テスト

| テストファイル | 内容 |
|----------------|------|
| themePresets.test.js | chartColors の存在確認（Phase 1 で作成済みなら追加） |
| createThemeFromPreset.test.js | chartColors の存在確認 |
| Stats | 現状 Stats の単体テストがない場合、追加は任意。E2E や手動確認で十分ならスキップ |

### 6.5 実装順序

1. 説明カードの現状確認（MuiCard がどう効いているか）
2. 必要なら説明カード用の軽い調整
3. themePresets + createThemeFromPreset に chartColors 追加
4. Stats の BarChart を theme 参照に
5. テスト更新・実行

---

## 7. テスト戦略のまとめ

### 7.1 新規作成するテストファイル

| ファイル | Phase | 主なテストケース |
|----------|-------|------------------|
| `src/theme/fallbacks.test.js` | 0 | export 存在、各キーの値が string(rgba) であること |
| `src/theme/createThemeFromPreset.test.js` | 0, 1, 4 | theme.custom に cardShadow, bookAccent, memoAccent, chartColors 等が含まれること、未知 presetId 時のフォールバック |
| `src/theme/themePresets.test.js` | 1, 4 | getThemePresets の戻り値、bookAccent/memoAccent/chartColors の値 |
| `src/theme/cardStyles.test.js` | 2 | getBookCardSx, getMemoCardSx の戻り値、theme 未定義時、accent 切り替え時の差異 |

### 7.2 既存テストの更新方針

| コンポーネント | 更新内容 |
|----------------|----------|
| BookCard, MemoCard, BookDetail, SearchResults | ThemeProvider に testTheme を使う（theme.custom が必要なため）。表示・インタラクションの既存テストは維持 |
| BookInfo, BookForm, ExternalBookSearch, BookEditDialog | 変更後も既存テストが通ること。必要なら testTheme を渡す |
| Settings | テーマ選択のテストは既にあり。bookAccent/memoAccent の追加で壊れないこと |

### 7.3 カバレッジ維持

- 新規ファイル（fallbacks.js, cardStyles.js）は必ず対応する .test.js を作成
- createThemeFromPreset, themePresets はテストがないため、Phase 0/1 でテストを追加
- 各 Phase 完了後に `npm run test:unit -- --coverage` を実行し、カバレッジが落ちていないことを確認
- 新規関数（getBookCardSx, getMemoCardSx）は正常系・異常系（theme 未定義、preset 未定義）をカバー

---

## 8. 依存関係と実施順序

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
   │          │         │         │         │
   ├─ fallbacks.js
   ├─ cardShadow テーマ化
   │
   ├─ bookAccent / memoAccent
   │
   ├─ cardStyles.js (getBookCardSx, getMemoCardSx)
   ├─ 書籍系コンポーネント統一
   │
   ├─ MemoCard → memoAccent
   │
   └─ 説明カード確認、chartColors
```

Phase 0 と 1 は密接。Phase 0 で theme.custom に cardShadow を追加するため、Phase 1 の theme.custom 拡張と一緒に createThemeFromPreset をいじる。実務上は Phase 0 と 1 をまとめて「土台 + プリセット分離」として実施してもよい。

---

## 9. チェックリスト（各 Phase 完了時）

- [ ] 該当する新規テストファイルを作成した
- [ ] 既存テストがすべて通る
- [ ] `npm run test:unit -- --coverage` でカバレッジを確認した
- [ ] 新規・変更ファイルにリンターエラーがない
- [ ] 手動で画面確認した（該当 Phase で見た目が変わる場合）
- [ ] doc/bug-feature-memo.md に進捗を記録した
