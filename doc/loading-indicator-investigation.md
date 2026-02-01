# 読み込み表示の実装調査

**調査日**: 2026-02-01  
**目的**: 「読み込み中」表示が2種類あるかの確認と統一方針

---

## 調査結果

### 1. LoadingIndicator（共通コンポーネント）

| 使用箇所 | variant | 挙動 |
|----------|---------|------|
| App (認証) | fullPage | 画面中央・固定オーバーレイ |
| BookList | fullPage | 同上（early return） |
| BookDetail | fullPage | 同上（early return） |
| **Stats** | **inline** | ページヘッダー表示後、コンテンツ上部にインライン表示 |
| Settings | inline | 同上 |
| SearchResults | inline | 検索結果エリア内 |
| TagStats | inline | タグ統計セクション内 |
| MemoMoveDialog | inline | ダイアログ内 |
| StatusHistoryTimeline | inline | 履歴セクション内 |

### 2. LoadingIndicator 以外の実装

| 箇所 | 実装 | 備考 |
|------|------|------|
| MemoList | `<Typography>メモを読み込み中...</Typography>` | LoadingIndicator 未使用 |
| useReactContext | `<div>読み込み中...</div>` (インラインスタイル) | ルートラッパー、ThemeProvider 外の可能性 |
| TagList | `<CircularProgress />` | MUI のスピナーのみ |
| ExternalBookSearch | CircularProgress (ボタン内) | 検索ボタンの startIcon |
| FullTextSearch | CircularProgress (ボタン内) | 同上 |
| CameraOCR | CircularProgress (ボタン内) | 同上 |

---

## 現象の原因

**統計ページ**では、BookList と異なり:

- `variant="inline"` を明示指定
- ページ全体を early return せず、PageHeader を表示した上でコンテンツ領域に LoadingIndicator を表示
- そのため「画面上部・別デザイン（インラインのコンパクト表示）」になる

**本一覧**では:

- `variant="fullPage"` を指定
- loading 時に early return で LoadingIndicator のみ表示
- そのため「画面中央・fullPage デザイン」になる

---

## 対応方針・実施状況

1. **Stats**: ページ全体の読み込み時は BookList と同様に early return + fullPage に変更 ✅
2. **Settings**: 同様に fullPage 化を検討（ページ全体の初回読み込み時）
3. **MemoList, useReactContext, TagList**: LoadingIndicator への統一 ✅（2026-02-01 完了）
   - MemoList: `variant="inline"`, `message="メモを読み込み中..."`
   - useReactContext: `variant="fullPage"`, ThemeProvider 外のため createTheme() でラップ
   - TagList: `variant="inline"`, `message="タグを読み込み中..."`, `size="small"`
