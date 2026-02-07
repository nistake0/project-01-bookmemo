# テーマごとのノーマル/ダークモード追加の可否検討

**作成日**: 2025年1月31日  
**目的**: 3種類のテーマ（library-classic, minimal-light, slim-compact）それぞれに「ノーマル」と「ダーク」の選択肢を追加する実現可能性と方針を検討する

---

## 1. 要件整理

| 項目 | 内容 |
|------|------|
| ノーマル | 現行デザインのまま（背景が明るく、文字が暗い） |
| ダーク | レイアウト・装飾は現行維持。背景を暗く、文字を明るくする |
| 対象テーマ | library-classic, minimal-light, slim-compact の3種類 |
| 選択の仕方 | 各テーマ × ノーマル/ダーク = 6パターン |

---

## 2. 現状のテーマ構造

### 2.1 テーマプリセット（themePresets.js）

各プリセットは以下を持つ：

- **background**: image, pattern
- **overlay**: top, mid, bottom（グラデーションオーバーレイ）
- **backgroundColor**: メイン背景色（例: `#eef2ff`, `#f5f5f5`）
- **decorative 参照**: bookAccent, memoAccent, cardAccent
- **glassEffect**: opacity, blur, saturate
- **pageHeader**: backgroundImage, goldOverlay, centerLine, accentKey 等
- **cardShadow, cardShadowHover**
- **loadingIndicator**: container の backgroundColor, border, boxShadow

### 2.2 MUI テーマ生成（createThemeFromPreset.js）

- `palette.mode`: 固定で `'light'`
- `palette.background.default`: preset.backgroundColor
- `palette.background.paper`: 固定 `#ffffff`
- `palette.text.primary`: 固定 `#222`
- `palette.decorative`: brown, gold, memo, neutral（すべてライト向け）
- `theme.custom`: pageHeader, bookAccent, cardShadow 等

### 2.3 ハードコードされている色の箇所

| 箇所 | 内容 | ダーク対応の要否 |
|------|------|------------------|
| createThemeFromPreset | MuiTextField backgroundColor: '#ffffff' | ✅ テーマ参照に変更 |
| createThemeFromPreset | MuiCard, MuiPaper: rgba(255,255,255,...), border | ✅ テーマ参照に変更 |
| createThemeFromPreset | MuiMenu, MuiPopover, MuiDialog | ✅ 同上 |
| createThemeFromPreset | overlay の linear-gradient | ✅ プリセットの overlay を dark 用に切替 |
| themePresets | overlay, backgroundColor, loadingIndicator.container | ✅ プリセットに dark 用を追加 |
| themePresets | cardShadow（inset で rgba(255,255,255,...)使用） | ✅ dark 用 shadow を追加 |
| cardStyles.js | getBookCardSx, getMemoCardSx: rgba(255,255,255,...) | ✅ theme から取得する形に変更 |
| cardStyles.js | DEFAULT_CARD_SHADOW（inset 白） | ✅ theme.custom から取得（既に一部対応済） |
| PageHeader.jsx | backgroundColor, boxShadow, border | ✅ theme 参照に統一 |
| fallbacks.js | decorative のデフォルト値 | ✅ ダーク用 fallback を用意 |

---

## 3. 実現可能性

### 3.1 結論：**実現可能。工数は中程度**

- MUI の `palette.mode: 'dark'` を利用できる
- 既存の `theme.custom` とプリセット構造を拡張すれば対応可能
- ハードコード色をテーマ参照に置き換える範囲が主な工数

### 3.2 MUI ダークモードの仕様

`palette.mode: 'dark'` を指定すると、MUI が自動で以下を切り替える：

- **background.default**: `#121212`
- **background.paper**: `#1e1e1e`
- **text.primary**: `#fff`
- **text.secondary**: `rgba(255, 255, 255, 0.7)`

本プロジェクトでは `background.default` をプリセットの `backgroundColor` で上書きしているため、ダーク時は `preset.dark.backgroundColor` 等で制御する必要がある。

---

## 4. 設計方針

### 4.1 プリセット構造：2軸方式を推奨

**案A: 2軸（themePresetId + themeMode）** ✅ 推奨

- ユーザー設定: `themePresetId` + `themeMode: 'normal' | 'dark'`
- プリセットに `dark?: { backgroundColor, overlay, loadingIndicator, cardShadow, ... }` をオプションで追加
- `createThemeFromPreset(presetId, buildPath, mode)` で mode に応じて適用

**メリット**:
- プリセット定義の重複が少ない
- ノーマル/ダークの切り替えが一括で扱いやすい
- Settings UI で「テーマ選択」+「ノーマル/ダーク切り替え」の2段構成にしやすい

**案B: 6プリセット方式**

- `library-classic`, `library-classic-dark`, `minimal-light`, `minimal-light-dark`, ...
- 各プリセットが完全に自己完結

**デメリット**: 重複が多く、6種類の維持コストが高い

→ **案A** を採用することを推奨。

### 4.2 ユーザー設定の拡張

```js
// userSettings.js / preferences
{
  themePresetId: 'library-classic',  // 既存
  themeMode: 'normal',               // 新規: 'normal' | 'dark'
}
```

- デフォルト: `themeMode: 'normal'`（後方互換のため）
- Firestore の既存ユーザーには `themeMode` が無い場合も `'normal'` として扱う

### 4.3 プリセットの dark 拡張例

```js
'library-classic': {
  id: 'library-classic',
  name: '図書館（クラシック）',
  // ... 既存の normal 用プロパティ ...

  dark: {
    backgroundColor: '#1a1a24',
    overlay: {
      top: 'rgba(30, 30, 45, 0.5)',
      mid: 'rgba(60, 50, 40, 0.3)',
      bottom: 'rgba(10, 10, 15, 0.6)',
    },
    loadingIndicator: {
      container: {
        backgroundColor: 'rgba(30, 30, 40, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
    },
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.5), ...',
  },
},
```

- `dark` が無い場合は、共通のデフォルト dark 値を使用するフォールバックを用意

### 4.4 palette.decorative のダーク用

ダークモードでは、brown / gold / memo / neutral を「暗い背景の上で見やすい色」に変更する必要がある。

- **brown**: main をやや明るめに（例: `#c4a574`）、light/lighter は opacity を調整
- **memo**: 同様に明るめの紫系
- **gold**: accent/subtle を暗背景用に調整
- **neutral**: グレーを明るめに

`createThemeFromPreset` 内で `mode === 'dark'` のとき、`palette.decorative` を dark 用の値で上書きする。

### 4.5 custom.pageHeader.text のダーク対応

現状 `custom.pageHeader.text` に `title: '#FFF8DC'`, `subtitle: '#F5F5DC'` があるが、これは paper 風背景上の色。  
ダークモードではページヘッダー背景も暗くなるため、title/subtitle は明るい色（例: `#f5f5dc`, `#e8e8e0`）のまま利用可能。背景色を dark 用に変更すればよい。

---

## 5. 実装タスク一覧

### Phase 1: 基盤

1. **userSettings / constants**
   - `themeMode: 'normal' | 'dark'` を追加
   - DEFAULT: `'normal'`
   - Firestore スキーマ・マイグレーションは不要（undefined → normal 扱い）

2. **createThemeFromPreset**
   - 第3引数 `mode` を追加
   - `palette.mode` を mode に応じて設定
   - `palette.background`, `palette.text` を mode に応じて設定
   - `palette.decorative` の dark 用セットを追加
   - preset.dark があれば overlay, cardShadow, loadingIndicator 等を適用

3. **ThemeProviderWithUserSettings**
   - `settings.preferences?.themeMode` を `createThemeFromPreset` に渡す

### Phase 2: ハードコード色の排除

4. **createThemeFromPreset の components**
   - MuiCard, MuiPaper, MuiMenu, MuiPopover, MuiDialog, MuiTextField の
   - `backgroundColor`, `border`, `boxShadow` を `theme.palette` / `theme.custom` 由来の変数に置き換え
   - 例: `glassBackgroundColor`, `glassBorderColor`, `paperBackgroundColor` を theme.custom に定義

5. **cardStyles.js**
   - `getBookCardSx`, `getMemoCardSx` の `backgroundColor`, `boxShadow` を theme から取得
   - theme.custom に `glassBackgroundColor`, `cardSurfaceColor` 等を追加し、mode で切り替え

6. **PageHeader.jsx**
   - ハードコードの `rgba(255,255,255,...)` を theme 参照に変更
   - theme.custom.pageHeader に `surfaceColor`, `textColor` 等を追加

### Phase 3: プリセット・UI

7. **themePresets.js**
   - 各プリセットに `dark` オブジェクトを追加（library-classic, minimal-light, slim-compact）
   - 共通の dark デフォルトを fallbacks または createThemeFromPreset 内で定義

8. **Settings.jsx**
   - テーマ選択に「ノーマル/ダーク」の切り替え（ToggleButton または Switch）を追加
   - `updatePreferences({ themeMode: value })` を呼び出す

9. **fallbacks.js**
   - ダーク用の decorative fallback を追加（オプション）

### Phase 4: テスト・検証

10. 既存テストの修正（createThemeFromPreset.test.js 等）
11. ビジュアル確認（各テーマ × ノーマル/ダークの6パターン）
12. 背景画像（library-classic）のダークモード時の見え方の調整

---

## 6. 注意点・リスク

| 項目 | 内容 |
|------|------|
| 背景画像 | library-classic は画像＋オーバーレイ。ダーク時は overlay を強めて暗くするか、画像の上に暗いオーバーレイを重ねる必要あり |
| コントラスト | ダークモードでは WCAG のコントラスト比を満たすよう、文字色・背景色を調整すること |
| 既存ユーザー | themeMode が未設定のユーザーは `'normal'` 扱いとし、既存挙動を維持 |
| チャート色 | Stats の chartColors（bar, memo）はダーク背景でも見やすい色に変更可能。プリセットの chartColors を dark 用に上書き |

---

## 7. まとめ

| 項目 | 可否 | 備考 |
|------|------|------|
| ノーマル/ダークの追加 | ✅ 可能 | 2軸方式で themePresetId + themeMode を導入 |
| MUI palette.mode の利用 | ✅ 可能 | 文字・背景の基本は MUI に任せられる |
| decorative / custom のダーク対応 | ✅ 可能 | プリセットの dark 拡張と createThemeFromPreset の分岐で対応 |
| ハードコード色の排除 | ✅ 必要 | createThemeFromPreset, cardStyles, PageHeader 等をテーマ参照に統一 |
| 工数見積もり | 中程度 | Phase 1〜3 で 2〜3 日、Phase 4 含めると 3〜4 日程度 |

**推奨**: Phase 1 で基盤を整え、Phase 2 でハードコード色を段階的に排除しつつ、Phase 3 でプリセットと Settings UI を完成させる。
