# 書籍一覧のカード横スライド現象 - 原因調査

**調査日**: 2026-02-01  
**現象**: カードが1列表示の幅のとき、カードを左方向にフリック/ドラッグでスライドできてしまう

---

## 調査結果

### 1. 想定原因: #app-scroll-container の overflow-x

**場所**: `src/App.jsx` 343-356行

```jsx
<Box
  id="app-scroll-container"
  sx={{
    height: '100vh',
    overflowY: 'auto',        // 縦スクロールのみ指定
    WebkitOverflowScrolling: 'touch',
    // overflowX は未指定
  }}
>
```

**CSSの仕様**: `overflow-y: auto` のみ指定した場合、`overflow-x` は未指定だと `auto` と解釈される（一方が visible 以外のとき、他方は auto になる）。

**結果**: コンテンツがわずかでも横にはみ出すと、#app-scroll-container で横スクロールが有効になり、タッチで左右にドラッグできる。

---

### 2. 横オーバーフローを起こしうる要因

| 要因 | 内容 |
|------|------|
| **サブピクセル** | padding, gap, margin の計算で 1px 程度のずれが出る可能性 |
| **MUI Tabs (scrollable)** | `variant="scrollable"` により、タブが横スクロール可能。タブ内部の overflow が親に影響する場合あり |
| **Grid** | `gridTemplateColumns: '1fr'` でも、子要素の min-width やコンテンツ幅で親をはみ出す可能性 |
| **-webkit-overflow-scrolling: touch** | iOS の慣性スクロールで、縦スクロール時に横方向の操作が紛れ込む可能性 |

---

### 3. 補足: 画面下部メニューはスライドしない

AppBottomNav は `#app-scroll-container` の**外側**にあり、`position: fixed` でビューポートに固定されている。横スライドが起きるのはスクロールコンテナ内のコンテンツのみで、下部メニューは影響を受けない。この観察から、原因が `#app-scroll-container` であることが裏付けられる。

### 4. その他の確認済みポイント

- **BookCard**: `useSwipeable` 等のスワイプ処理なし
- **グローバルスワイプ**（App.jsx）: 戻る/進む用。`[data-allow-local-swipe]` の外ではカードのスワイプは行わない設計
- **index.css**: `html, body, #root` に `overflow-x: hidden` あり。ただし #app-scroll-container が独自のスクロールコンテキストを持つため、その外側の設定だけでは抑止できない
- **useBackgroundParallax**: 縦スクロール量のみ使用。横方向の挙動には関与しない

---

## 対応案

### 案A: overflow-x を明示的に hidden にする（推奨）

`#app-scroll-container` に `overflowX: 'hidden'` を追加し、横スクロールを禁止する。

```jsx
sx={{
  height: '100vh',
  overflowY: 'auto',
  overflowX: 'hidden',  // 追加
  WebkitOverflowScrolling: 'touch',
  // ...
}}
```

**メリット**: 変更箇所が少なく、意図が明確  
**デメリット**: 横にはみ出したコンテンツは見切れる（書籍一覧では想定していない挙動のため問題になりにくい）

### 案B: overflow 一括指定

```jsx
overflow: 'hidden auto',  // x: hidden, y: auto
```

案Aと同様の効果。

---

## 結論

**主因**: `#app-scroll-container` で `overflow-x` が未指定のため、デフォルトで `auto` となり、わずかな横オーバーフローでも横スクロールが有効になっている。

**推奨対応**: 案A により `overflowX: 'hidden'` を追加する。

---

## 実装（2026-02-01）

- `src/App.jsx`: `#app-scroll-container` に `overflowX: 'hidden'` を追加
