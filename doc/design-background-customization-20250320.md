# 背景カスタマイズ機能 設計・実装計画

**文書日**: 2025-03-20  
**対象**: アプリ背景をユーザーが選択できるようにする機能

---

## 1. 要件

- 複数の背景候補からユーザーが選択可能
- テーマ「ミニマル（ライト）」では背景設定があっても表示しない（単色のみ）
- 「背景なし」＝ベタ単色のオプションを用意し、このときだけ色選択を可能にする
- 背景画像を library-background.jpg 以外にも追加し選択可能にする

---

## 2. 設計方針

### 2.0 ミニマルテーマと背景色

`backgroundDisplay === 'solid-only'` のテーマ（ミニマル等）では、背景画像・パターンは表示しないが、**背景色の変更UIは表示する**。ユーザーは単色の色を選べる。

### 2.1 テーマの背景ポリシー（宣言的）

`themePresetId === 'minimal-light'` の条件分岐を避け、テーマプリセットに `backgroundDisplay` を追加する。

| 値              | 意味                                               |
| --------------- | -------------------------------------------------- |
| `'full'`        | 画像・パターン・ベタ色を利用可能。ユーザーの背景設定に従う |
| `'solid-only'`  | 画像・パターンは表示しない。常に単色のみ                   |

### 2.2 テーマと背景の包含関係

テーマは背景を包含する。各テーマに `defaultBackgroundPresetId` を持たせる。

- `backgroundPresetId` 未設定時: テーマの `defaultBackgroundPresetId` を使用
- `backgroundDisplay === 'solid-only'` のテーマ: 画像は表示しない（`defaultBackgroundPresetId` は参照されない）

### 2.3 ベタ色の初期色

テーマモード（normal/dark）に依存。`preferences.backgroundColor` 未設定時は、`createThemeFromPreset` の `effectivePreset.backgroundColor` を使用。

### 2.4 背景プリセットの構造

フラット構造。`thumbnail` フィールドでプレビュー用画像を指定。`type: 'solid'` の場合は `thumbnail: null` とし、UI で代替表示。

---

## 3. データモデル

### 3.1 preferences 拡張

```javascript
{
  themePresetId: 'library-classic',
  themeMode: 'normal',
  backgroundPresetId: 'library-patterned',  // 新規
  backgroundColor: '#eef2ff'                 // 新規（ベタ色モード時のみ使用）
}
```

### 3.2 テーマプリセット拡張（themePresets.js）

各プリセットに追加:

- `backgroundDisplay: 'full' | 'solid-only'`
- `defaultBackgroundPresetId: string`

### 3.3 背景プリセット定義（backgroundPresets.js 新規）

| フィールド   | 説明                                      |
| ------------ | ----------------------------------------- |
| id           | 一意ID                                    |
| name         | 表示名                                    |
| description  | 説明文                                    |
| type         | 'solid' \| 'image'                        |
| image        | 画像URL（type: 'image' 時）               |
| pattern      | パターンURL（オプション）                 |
| thumbnail    | サムネイルURL（type: 'image' 時。本画像の流用可） |

**初期セット**: `none`（solid）, `library`（image）, `library-patterned`（image+pattern）, `bookshelf`（image）の4種。拡張可能。

**配置**: 背景画像は `public/backgrounds/` に配置（他アセットと分離）。

---

## 4. 適用ロジック

```
テーマ取得 → backgroundDisplay?
  ├ solid-only → 単色のみ表示（effectivePreset.backgroundColor）
  └ full → backgroundPresetId?
        ├ none → backgroundColor で表示
        └ image preset → image/pattern で表示
```

---

## 5. 実装計画

### Phase 1: 基盤

- constants/userSettings.js: `DEFAULT_BACKGROUND_PRESET_ID`, `backgroundPresetId`, `backgroundColor` を `DEFAULT_USER_SETTINGS` に追加
- theme/backgroundPresets.js: 新規作成
- theme/themePresets.js: `backgroundDisplay`, `defaultBackgroundPresetId` を各プリセットに追加
- hooks/useUserSettings.jsx: 新フィールドの読み書き対応

### Phase 2: テーマ生成

- theme/createThemeFromPreset.js: 引数に `backgroundPresetId`, `backgroundColor` を追加。`backgroundDisplay`, `defaultBackgroundPresetId` に基づく判定を実装
- components/ThemeProviderWithUserSettings.jsx: `createThemeFromPreset` に新引数を渡す

### Phase 3: UI

- pages/Settings.jsx: 表示設定に「背景」セクションを追加。`backgroundDisplay === 'solid-only'` のときは非表示
- 背景選択UI: サムネイル付きで候補を表示
- 色選択UI: `backgroundPresetId === 'none'` 時のみ表示

### Phase 4: アセット・テスト

- サムネイル: 初期は本画像を CSS で縮小表示
- ユニットテスト: createThemeFromPreset, backgroundPresets
- E2E: 背景選択・色選択の基本フロー

---

## 6. 関連ドキュメント

- ARCHITECTURE.md §3.1 設定・テーマ・プロフィール
- doc/design-system-overview.md
- doc/discussion-user-profile-and-theme-tasks.md
