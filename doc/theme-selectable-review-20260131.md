# ユーザー選択可能なテーマ実装のための現状レビュー

**作成日**: 2025年1月31日  
**目的**: アプリのアートデザイン全体をユーザーが選択可能なテーマとし、ユーザーごとに記憶する機能を実現するにあたり、現状実装の何が問題になるかを特定する

---

## 1. 目標とする機能

- **テーマ選択**: 背景画像、カードデザイン、色彩、明度などを選択肢から選べる
- **ユーザーごとの記憶**: Firestore 等に保存し、ログイン・デバイスを変えても同一ユーザーで同じテーマが適用される

---

## 2. 現状の実装と問題点

### 2.1 テーマ・ThemeProvider の構造

| 現状 | 問題 |
|------|------|
| `appTheme` は単一の静的な `createTheme()` の戻り値 | テーマの切り替えができない。`ThemeProvider theme={appTheme}` は固定 |
| アプリ起動時に一度だけ生成 | ユーザー選択に応じて動的にテーマを差し替える仕組みがない |
| 認証前でも同じ ThemeProvider を利用 | ユーザー未ログイン時はデフォルトテーマを使う設計が必要 |

**必要な変更**: テーマを動的に生成するファクトリ（`createThemeFromPreset(presetId)`）または複数プリセットの用意。`ThemeProvider` にユーザー設定に応じたテーマを渡す。

---

### 2.2 背景画像・パターン

| 箇所 | 現状 | 問題 |
|------|------|------|
| **App.jsx** | `PATHS.LIBRARY_BACKGROUND()` 等を CSS 変数に直接渡す | 画像パスが固定。テーマごとに切り替えできない |
| **appTheme MuiCssBaseline** | `backgroundImage: 'var(--bm-library-image), var(--bm-library-bg)'` で変数を参照 | 変数は App.jsx で設定されるため、テーマオブジェクトからは制御していない |
| **paths.js** | `LIBRARY_BACKGROUND: () => buildPath('/library-background.jpg')` | 1つの画像のみ。複数候補の定義・選択ができない |

**問題の本質**:
- 背景画像は CSS 変数経由で `#app-scroll-container` に渡されている
- 変数は `Box` の `sx` で設定されており、テーマとは独立
- テーマ切り替え時に CSS 変数を更新する仕組みが必要

**必要な変更**:
- テーマプリセットごとに背景画像パスを定義
- テーマ適用時に CSS 変数を書き換える、またはテーマ対応のコンテキストで変数を注入

---

### 2.3 グラデーション・オーバーレイ

| 箇所 | 現状 | 問題 |
|------|------|------|
| **appTheme MuiCssBaseline** | `#app-scroll-container::before` に `linear-gradient(...)` がハードコード | 色・明度をテーマで変えられない |
| グラデーション色 | `rgba(245, 247, 250, 0.3)`, `rgba(139, 69, 19, 0.1)`, `rgba(15, 23, 42, 0.2)` | 固定値。テーマパレットを参照していない |

**必要な変更**: オーバーレイの色・透明度をテーマの `palette` や `custom.overlay` から取得する形に変更。

---

### 2.4 カード・Paper のデザイン

| 箇所 | 現状 | 問題 |
|------|------|------|
| **appTheme MuiCard / MuiPaper** | `backgroundColor`, `border`, `boxShadow` が固定 | テーマプリセットごとの変更がしづらい |
| **BookCard.jsx** | `sx` で独自スタイルを直書き（茶系ボーダー、影、`::before`/`::after`） | テーマの `components.MuiCard` を上書き。テーマ切り替え時も同じ見た目のまま |
| **MemoCard.jsx** | 同様に茶系装飾を直書き | 同上 |
| **SearchResults.jsx** | 書籍＝茶系、メモ＝紫系をそれぞれ直書き | テーマと無関係。色がコンポーネントに埋め込まれている |
| **PageHeader.jsx** | 紙テクスチャ、茶系グラデーション、装飾線を直書き | 同上 |

**問題の本質**:
- デザイン値がコンポーネント内にハードコードされており、`theme` から取得していない
- テーマを差し替えても、これらのコンポーネントの見た目は変わらない

**必要な変更**:
- カード系スタイルを `theme.palette` や `theme.custom.card` 等から参照
- テーマプリセットごとに `palette.decorative.brown` 等を変更すれば、一括で見た目が変わる設計にする

---

### 2.5 色・装飾のハードコード一覧

| コンポーネント | ハードコードされている値 | テーマ化の難易度 |
|---------------|-------------------------|-----------------|
| **appTheme** | `#eef2ff`, `rgba(245,247,250,0.3)` 等のオーバーレイ | テーマ定義内なので、プリセットごとに差し替え可能 |
| **BookCard** | `rgba(139,69,19,0.2)`, `rgba(139,69,19,0.1)` 等 | `theme.palette` 参照に置換が必要 |
| **MemoCard** | 同上（茶系） | 同上 |
| **SearchResults renderBookResult** | 同上 | 同上 |
| **SearchResults renderMemoResult** | `rgba(123,104,238,0.25)` 等（紫系） | 同上 |
| **PageHeader** | `rgba(139,69,19,0.25)`, `rgba(184,134,11,0.15)` 等 | 同上 |
| **DecorativeCorner** | `rgba(184,134,11,0.4)`, `rgba(139,69,19,0.5)` | SVG 内の色。`theme` または props で渡す必要あり |

---

### 2.6 ユーザー設定の保存・取得

| 現状 | 問題 |
|------|------|
| **Firestore `users/{userId}`** | ドキュメントは存在するが、タグ履歴のサブコレクションのみ使用 | テーマ設定用のフィールド（例: `theme`, `themePreset`）がない |
| **localStorage** | PWA インストール状態、検索キャッシュ等に使用 | デバイス単位。ユーザー単位・クラウド保存ではない |
| **テーマ設定の保存先** | なし | ユーザーごとの記憶のため、Firestore 等への保存が必要 |

**必要な変更**:
- `users/{userId}` に `settings` フィールドまたは `settings` サブコレクションを追加
- `{ themePresetId: 'library-classic' | 'minimal' | ... }` のような形で保存
- 未ログイン時は localStorage で暫定保存し、ログイン後に Firestore と同期する設計も検討可能

---

### 2.7 テーマ適用のタイミング

| 現状 | 問題 |
|------|------|
| **App.jsx** | `ThemeProvider theme={appTheme}` はマウント時に固定 | ユーザー設定読み込み後にテーマを切り替える必要がある |
| **認証** | `AuthProvider` が `ThemeProvider` の外側 | ユーザーIDは取得可能だが、テーマ読み込み前に ThemeProvider がマウントされる |

**必要な変更**:
- テーマ設定用の `ThemePreferencesProvider` または `useThemePreference` フックを用意
- ユーザー設定読み込み完了後に `ThemeProvider` へ渡すテーマを更新
- 初回表示時はデフォルトテーマで描画し、設定読み込み後に差し替え（フラッシュを避ける工夫も検討）

---

### 2.8 背景の CSS 変数と Box の sx

| 現状 | 問題 |
|------|------|
| **App.jsx Box** | `'--bm-library-image': url("...")` を `sx` で直接指定 | 画像パスが PATHS に依存し、テーマと連動していない |
| **useBackgroundParallax** | `--bg-offset` のみ操作 | パララックス用。テーマ切替の対象外でよい |

**必要な変更**:
- テーマまたは `ThemePreferencesContext` から背景画像パスを取得
- それを CSS 変数にセットするコンポーネント/フックを用意

---

### 2.9 index.css との関係

| 現状 | 問題 |
|------|------|
| **index.css** | `#f5f7fa`, `#222` 等がハードコード | テーマと無関係。グローバルスタイルがテーマの色に追従していない |
| **:root** | ダーク系のデフォルトがあるが、実質は MUI が支配 | テーマ切り替え時も index.css はそのまま |

**必要な変更**: 可能な範囲でテーマ由来の色に寄せる。あるいは index.css の影響を最小化する。

---

### 2.10 画像リソースの管理

| 現状 | 問題 |
|------|------|
| **public/** | `library-background.jpg`, `library-pattern.svg`, `paper-texture.jpg` 等が固定で配置 | テーマごとの背景画像を追加する場合、ファイルとパスの管理が必要 |
| **paths.js** | 単一パスしか返さない | 複数テーマ用のパスを返す API が必要 |

**必要な変更**:
- テーマプリセット ID から画像パスを解決するマッピング（例: `THEME_IMAGES[presetId].background`）
- 新規テーマ追加時は、対応する画像を public に配置し、マッピングに追加

---

## 3. 問題の分類と優先度

### 3.1 アーキテクチャレベル（必須）

| 問題 | 影響 | 対応 |
|------|------|------|
| テーマが静的に固定 | テーマ切り替えができない | テーマファクトリ/プリセットの導入 |
| ユーザー設定の保存先がない | ユーザーごとの記憶ができない | Firestore `users/{userId}` に設定フィールド追加 |
| テーマ適用タイミングが固定 | 設定読み込み後に反映できない | ThemePreferencesContext + 非同期読み込み |

### 3.2 デザイン値の散在（必須）

| 問題 | 影響 | 対応 |
|------|------|------|
| コンポーネント内の色・スタイルのハードコード | テーマ切り替えで見た目が変わらない | すべて `theme.palette` / `theme.custom` 参照に置換 |
| appTheme 内の固定値 | プリセット間で差し替え可能だが、現状は単一 | プリセットごとの theme オブジェクトを生成 |
| DecorativeCorner の SVG 色 | テーマに追従しない | `theme` または props で色を渡す |

### 3.3 背景・オーバーレイ（必須）

| 問題 | 影響 | 対応 |
|------|------|------|
| 背景画像パスが固定 | テーマごとの背景に切り替えられない | テーマプリセットと画像パスのマッピング |
| オーバーレイのグラデーションが固定 | 明度・色彩の選択肢を反映できない | オーバーレイ色をテーマパレットから取得 |

### 3.4 既存機能との整合（推奨）

| 問題 | 影響 | 対応 |
|------|------|------|
| 未ログイン時のテーマ | ログイン前はどのテーマを使うか | デフォルトテーマ or localStorage の前回選択 |
| PWA / オフライン | オフライン時の設定読み込み | ローカルキャッシュや localStorage との併用 |

---

## 4. 実装の依存関係と推奨順序

```
1. テーマプリセットの定義（色・背景パス・オーバーレイ等）
   ↓
2. テーマファクトリ createThemeFromPreset(presetId)
   ↓
3. Firestore users/{userId} に settings.themePresetId 等を追加
   ↓
4. useThemePreference フック（取得・保存・state）
   ↓
5. App.jsx で ThemeProvider に動的テーマを渡す
   ↓
6. 背景画像・CSS 変数をテーマ連動で設定
   ↓
7. 各コンポーネントのハードコードを theme 参照に置換
   （BookCard, MemoCard, SearchResults, PageHeader, DecorativeCorner）
   ↓
8. テーマ選択 UI（設定画面やドロワー内）
```

---

## 5. テーマプリセットの設計例

```javascript
// 例: テーマプリセットの構造
const THEME_PRESETS = {
  'library-classic': {
    name: '図書館（クラシック）',
    background: { image: '/library-background.jpg', pattern: '/library-pattern.svg' },
    overlay: { top: 'rgba(245,247,250,0.3)', mid: 'rgba(139,69,19,0.1)', bottom: 'rgba(15,23,42,0.2)' },
    card: { accent: 'brown', glassOpacity: 0.75, decorativeCorners: true },
  },
  'minimal-light': {
    name: 'ミニマル（ライト）',
    background: { image: null, pattern: null }, // 単色背景
    overlay: { top: 'transparent', mid: 'transparent', bottom: 'transparent' },
    card: { accent: 'neutral', glassOpacity: 0.9, decorativeCorners: false },
  },
  // ...
};
```

---

## 6. まとめ

### 現状でテーマ選択実装の障壁となっている点

1. **テーマが単一・静的**: 動的切り替えの仕組みがない  
2. **デザイン値のハードコード**: BookCard, MemoCard, SearchResults, PageHeader, DecorativeCorner がテーマ非依存  
3. **背景がテーマと分離**: CSS 変数と画像パスがテーマと連動していない  
4. **ユーザー設定の永続化がない**: Firestore にテーマ設定用のスキーマがない  
5. **テーマ適用タイミングが固定**: ユーザー設定読み込み後の反映パスがない  

### デザインシステム一元化との関係

- デザインシステム一元化（パレット拡張、テーマ参照への置換）は、**テーマ選択の前提**となる
- まず一元化を進め、その上でテーマプリセットとユーザー設定の仕組みを追加する順序が現実的

---

**関連ドキュメント**:
- `doc/design-review-and-centralization-20260131.md` - デザイン実装の再レビュー
- `doc/design-system-centralization-analysis.md` - デザインシステム一元化の分析
