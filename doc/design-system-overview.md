# デザインシステム概要

**作成日**: 2025年1月31日  
**目的**: アプリのデザイン設計の一覧と、新規テーマ・コンポーネント追加時の参照用

---

## 1. アーキテクチャ

```
themePresets.js     → プリセット定義（背景・色・装飾フラグ）
       ↓
createThemeFromPreset.js  → MUI テーマ生成
       ↓
ThemeProviderWithUserSettings  → ユーザー設定から presetId を取得し ThemeProvider に渡す
       ↓
各コンポーネント  → useTheme() で theme.palette.decorative, theme.custom を参照
```

---

## 2. プリセット構成（themePresets.js）

| プロパティ | 説明 | library-classic | minimal-light |
|------------|------|-----------------|---------------|
| background.image | 背景画像 | library-background.jpg | none |
| background.pattern | 背景パターン | library-pattern.svg | none |
| overlay | グラデーションオーバーレイ | 茶系 | transparent |
| backgroundColor | ベース背景色 | #eef2ff | #f5f5f5 |
| cardAccent | カードのアクセントキー | brown | neutral |
| cardDecorations | 角・内枠・中央縦線の有無 | すべて true | すべて false |
| glassEffect | 透明度・blur・saturate | 0.75, 20px, 180% | 0.9, 12px, 140% |
| pageHeader | ページタイトル用 | 紙テクスチャ・金系・角丸 | なし・淡色・角丸0 |

---

## 3. パレット（theme.palette.decorative）

| キー | 用途 | 主なプロパティ |
|------|------|----------------|
| brown | 図書館系カード・書籍 | main, light, lighter, border, borderHover |
| gold | PageHeader・DecorativeCorner | accent, subtle, stroke, strokeLight |
| memo | メモカード（SearchResults 等） | main, light, lighter, border, borderHover, shadow, shadowHover |
| neutral | ミニマル系 | light, lighter, border, borderHover |

---

## 4. theme.custom（プリセット由来）

| キー | 内容 |
|------|------|
| cardAccent | 'brown' \| 'neutral' |
| cardDecorations | { corners, innerBorder, centerLine } |
| glassEffect | { opacity, blur, saturate } |
| pageHeader | { backgroundImage, goldOverlay, centerLine, borderRadius, accentKey } |
| backgroundVars | CSS 変数（--bm-library-image, --bm-library-bg） |

---

## 5. テーマ参照コンポーネント一覧

| コンポーネント | 参照する theme 値 |
|----------------|-------------------|
| BookCard | decorative[cardAccent], cardDecorations, glassEffect |
| MemoCard | 同上 |
| SearchResults | bookAccent, memoAccent, decorations, glass |
| PageHeader | pageHeader, decorative[accentKey], decorative.gold |
| DecorativeCorner | decorative.gold, decorative[accentKey] |
| BookDetail | 同上（Paper の detailCardSx） |

---

## 6. 新規プリセット追加時の手順

1. `themePresets.js` にプリセットオブジェクトを追加
2. `THEME_PRESET_IDS` に ID を追加
3. 必要なら `palette.decorative` に新アクセント色を追加
4. Settings のテーマ選択 UI は `getThemePresets` から自動取得

---

## 7. 関連ドキュメント

- `doc/design-element-classification-and-policy.md` - 要素分類とテーマ方針（書籍/メモ分離、統一の設計）
- `doc/design-centralization-and-theme-discussion.md` - 設計の経緯・論点
- `doc/theme-selectable-review-20260131.md` - テーマ選択実装の障壁分析
- `doc/discussion-user-profile-and-theme-tasks.md` - ユーザー設定・テーマタスク分離
