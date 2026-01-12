# 書籍情報のテキストコピー・外部検索機能 - 設計検討

**作成日**: 2026-01-11  
**目的**: 書籍名、著者名、出版社をタッチ・クリックでコピー、および外部検索などのアクションを選択できる機能の設計を検討

---

## 要望の整理

1. **基本機能**: 書籍名、著者名、出版社をタッチ・クリックでテキストをコピー
2. **拡張機能（できれば）**: コピーと外部ブラウザで検索などのアクションを選択できる

---

## 現状分析

### 表示箇所の特定

書籍名、著者名、出版社が表示されている主要なコンポーネント：

1. **`BookInfo.jsx`** (書籍詳細ページ)
   - タイトル: `Typography variant="h4"` (line 38-40)
   - 著者: `Typography variant="h6"` (line 41-43)
   - 出版社: `Typography variant="body1"` (line 44-48)

2. **`BookCard.jsx`** (書籍一覧のカード)
   - タイトル: `Typography variant="h6"` (line 76-93)
   - 著者: `Typography variant="body2"` (line 94-106)
   - 出版社: `Typography variant="body2"` (line 125-138)

3. **`ExternalBookSearch.jsx`** (外部検索結果)
   - タイトル、著者、出版社が表示 (line 380-413)

4. **`SearchResults.jsx`** (検索結果)
   - タイトル、著者が表示 (line 217-227)

5. **`BookEditDialog.jsx`** (編集ダイアログ)
   - 表示のみ（編集フォームなのでコピー機能は不要か）

### 現在の実装

- すべて`Typography`コンポーネントで表示
- クリック時の特別な処理はなし
- カード全体のクリック処理はあるが、個別のテキスト要素のクリック処理はなし

---

## 設計方針の検討

### 1. UI/UX設計

#### アプローチA: コンテキストメニュー方式（推奨）

**概要**: 長押し（タッチ）または右クリック（マウス）でメニューを表示

**メリット**:
- ✅ 標準的なUXパターン（多くのアプリで採用）
- ✅ テキスト選択との競合が少ない
- ✅ モバイル・デスクトップ両方に対応
- ✅ MUIの`Menu`コンポーネントが利用可能

**デメリット**:
- ⚠️ 長押しの認識（300-500ms）が必要
- ⚠️ 実装がやや複雑

**実装イメージ**:
```jsx
<Typography
  onContextMenu={handleContextMenu}
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
  {book.title}
</Typography>

<Menu
  anchorEl={anchorEl}
  open={menuOpen}
  onClose={handleMenuClose}
>
  <MenuItem onClick={handleCopy}>コピー</MenuItem>
  <MenuItem onClick={handleGoogleSearch}>Google検索</MenuItem>
  <MenuItem onClick={handleAmazonSearch}>Amazon検索</MenuItem>
</Menu>
```

#### アプローチB: クリック/タップでメニュー表示

**概要**: 通常のクリック/タップでメニューを表示

**メリット**:
- ✅ シンプルな実装
- ✅ 直感的な操作

**デメリット**:
- ❌ 既存のクリック処理（カード全体のクリックなど）と競合する可能性
- ❌ テキスト選択と競合する可能性
- ❌ カード全体のクリック処理がある場合、重複クリックの問題

#### アプローチC: アイコンボタン方式

**概要**: テキストの横に小さなアイコンボタンを表示

**メリット**:
- ✅ 明確な操作対象
- ✅ 競合が少ない

**デメリット**:
- ❌ UIが煩雑になる
- ❌ スペースを消費する
- ❌ モバイルで小さくて押しにくい可能性

**実装イメージ**:
```jsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Typography>{book.title}</Typography>
  <IconButton size="small" onClick={handleMenuOpen}>
    <MoreVertIcon />
  </IconButton>
</Box>
```

### 2. 実装技術

#### Clipboard API

**使用API**: `navigator.clipboard.writeText()`

**実装例**:
```javascript
const handleCopy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    // 成功時のフィードバック（Snackbarなど）
  } catch (err) {
    console.error('コピーに失敗しました:', err);
    // フォールバック: 古いAPI (document.execCommand)
  }
};
```

**考慮事項**:
- HTTPS環境またはlocalhostでのみ動作
- フォールバック処理が必要な場合がある

#### 外部検索URL生成

**検索エンジン/サービスのURL形式**:

1. **Google検索**
   - `https://www.google.com/search?q={encodedQuery}`

2. **Amazon検索**
   - `https://www.amazon.co.jp/s?k={encodedQuery}`

3. **楽天ブックス検索**
   - `https://books.rakuten.co.jp/rb/Search?qt={encodedQuery}`

4. **openBD検索** (API)
   - API形式なので、ブラウザ検索には不向き

**実装例**:
```javascript
const createSearchUrl = (query, service = 'google') => {
  const encodedQuery = encodeURIComponent(query);
  const urls = {
    google: `https://www.google.com/search?q=${encodedQuery}`,
    amazon: `https://www.amazon.co.jp/s?k=${encodedQuery}`,
    rakuten: `https://books.rakuten.co.jp/rb/Search?qt=${encodedQuery}`,
  };
  return urls[service];
};

const handleExternalSearch = (text, service) => {
  const url = createSearchUrl(text, service);
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

#### メニューコンポーネント

**MUIコンポーネント**: `Menu` または `Popover`

**推奨**: `Menu`コンポーネント
- コンテキストメニューに適している
- アクセシビリティ対応
- キーボード操作対応

**実装例**:
```jsx
const [anchorEl, setAnchorEl] = useState(null);
const [selectedText, setSelectedText] = useState('');

const handleContextMenu = (event, text) => {
  event.preventDefault();
  setAnchorEl(event.currentTarget);
  setSelectedText(text);
};

<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
>
  <MenuItem onClick={() => handleCopy(selectedText)}>
    <ListItemIcon><ContentCopyIcon /></ListItemIcon>
    <ListItemText>コピー</ListItemText>
  </MenuItem>
  <MenuItem onClick={() => handleExternalSearch(selectedText, 'google')}>
    <ListItemIcon><SearchIcon /></ListItemIcon>
    <ListItemText>Google検索</ListItemText>
  </MenuItem>
  <MenuItem onClick={() => handleExternalSearch(selectedText, 'amazon')}>
    <ListItemIcon><ShoppingCartIcon /></ListItemIcon>
    <ListItemText>Amazon検索</ListItemText>
  </MenuItem>
</Menu>
```

### 3. タッチ操作の考慮

#### 長押し検出

**実装方法**:
```javascript
const [touchTimer, setTouchTimer] = useState(null);

const handleTouchStart = (event, text) => {
  const timer = setTimeout(() => {
    // 長押し検出（300-500ms）
    handleContextMenu(event, text);
  }, 400);
  setTouchTimer(timer);
};

const handleTouchEnd = () => {
  if (touchTimer) {
    clearTimeout(touchTimer);
    setTouchTimer(null);
  }
};

const handleTouchMove = () => {
  // タッチ移動時はキャンセル
  if (touchTimer) {
    clearTimeout(touchTimer);
    setTouchTimer(null);
  }
};
```

**考慮事項**:
- タッチ移動時のキャンセル処理
- テキスト選択との競合を避ける
- 適切なタイミング（400ms程度）

---

## 設計案の比較

| アプローチ | 実装難易度 | UX | 既存機能との競合 | 推奨度 |
|----------|----------|-----|----------------|--------|
| A: コンテキストメニュー | 中 | ⭐⭐⭐⭐ | 低 | ✅ 推奨 |
| B: クリック/タップ | 低 | ⭐⭐ | 高 | ❌ 非推奨 |
| C: アイコンボタン | 低 | ⭐⭐⭐ | 低 | ⚠️ 検討 |

---

## 推奨設計案

### アプローチA: コンテキストメニュー方式

#### 実装方針

1. **共通コンポーネント/フックの作成**
   - `useTextCopyMenu.js` - テキストコピー・外部検索用のフック
   - `TextCopyMenu.jsx` - メニューコンポーネント（オプション）

2. **適用箇所**
   - `BookInfo.jsx`: タイトル、著者、出版社
   - `BookCard.jsx`: タイトル、著者、出版社
   - `ExternalBookSearch.jsx`: タイトル、著者、出版社
   - `SearchResults.jsx`: タイトル、著者（出版社は表示されていない）

3. **機能**
   - コピー
   - Google検索
   - Amazon検索
   - 楽天ブックス検索（オプション）

#### 実装ステップ

**Phase 1: 共通フックの作成**
- `useTextCopyMenu.js`の実装
- Clipboard APIの実装
- 外部検索URL生成の実装

**Phase 2: BookInfo.jsxへの適用**
- 書籍詳細ページでの動作確認
- テストの追加

**Phase 3: BookCard.jsxへの適用**
- カード全体のクリック処理との競合回避
- テストの追加

**Phase 4: その他のコンポーネントへの適用**
- ExternalBookSearch.jsx
- SearchResults.jsx

#### 実装の詳細設計

**useTextCopyMenu.js のインターフェース**:
```javascript
export function useTextCopyMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  
  const handleContextMenu = (event, text) => {
    event.preventDefault();
    event.stopPropagation(); // 親要素のクリックを防ぐ
    setAnchorEl(event.currentTarget);
    setSelectedText(text);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      // Snackbarでフィードバック
      handleClose();
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };
  
  const handleExternalSearch = (service) => {
    const url = createSearchUrl(selectedText, service);
    window.open(url, '_blank', 'noopener,noreferrer');
    handleClose();
  };
  
  const menuProps = {
    anchorEl,
    open: Boolean(anchorEl),
    onClose: handleClose,
  };
  
  return {
    handleContextMenu,
    menuProps,
    handleCopy,
    handleExternalSearch,
  };
}
```

**コンポーネントでの使用例**:
```jsx
function BookInfo({ book }) {
  const { handleContextMenu, menuProps, handleCopy, handleExternalSearch } = useTextCopyMenu();
  
  return (
    <>
      <Typography
        onContextMenu={(e) => handleContextMenu(e, book.title)}
        sx={{ cursor: 'context-menu' }}
      >
        {book.title}
      </Typography>
      
      <Menu {...menuProps}>
        <MenuItem onClick={handleCopy}>
          <ListItemIcon><ContentCopyIcon /></ListItemIcon>
          <ListItemText>コピー</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExternalSearch('google')}>
          <ListItemIcon><SearchIcon /></ListItemIcon>
          <ListItemText>Google検索</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExternalSearch('amazon')}>
          <ListItemIcon><ShoppingCartIcon /></ListItemIcon>
          <ListItemText>Amazon検索</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
```

---

## 考慮事項

### 1. 既存機能との競合

**BookCard.jsxの場合**:
- カード全体に`onClick`がある
- テキスト要素のコンテキストメニューは`event.stopPropagation()`で親要素のクリックを防ぐ必要がある
- ただし、コンテキストメニューは通常のクリックとは別なので、問題ないはず

### 2. モバイル対応

**タッチ操作**:
- 長押し検出の実装が必要
- `onTouchStart`, `onTouchEnd`, `onTouchMove`の処理
- テキスト選択との競合を避ける

**実装例**:
```javascript
const handleTouchStart = (event, text) => {
  touchStartTime = Date.now();
  touchStartPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  
  touchTimer = setTimeout(() => {
    handleContextMenu(event, text);
  }, 400);
};

const handleTouchEnd = () => {
  if (touchTimer) {
    clearTimeout(touchTimer);
  }
};

const handleTouchMove = (event) => {
  // 移動距離が大きい場合はキャンセル
  const moveDistance = Math.sqrt(
    Math.pow(event.touches[0].clientX - touchStartPos.x, 2) +
    Math.pow(event.touches[0].clientY - touchStartPos.y, 2)
  );
  if (moveDistance > 10) {
    if (touchTimer) {
      clearTimeout(touchTimer);
    }
  }
};
```

### 3. アクセシビリティ

- キーボード操作対応（Menuコンポーネントが標準で対応）
- スクリーンリーダー対応（aria-labelの追加）
- フォーカス管理

### 4. ユーザーフィードバック

**コピー成功時**:
- Snackbarで「コピーしました」を表示

**エラー時**:
- エラーメッセージの表示
- フォールバック処理（古いAPIの使用）

---

## 実装の優先順位

### 最小実装（Phase 1）

1. **コピー機能のみ**
   - コンテキストメニュー（右クリック/長押し）
   - Clipboard API
   - 適用: BookInfo.jsxのみ

2. **外部検索機能の追加（Phase 2）**
   - Google検索、Amazon検索
   - 適用: 全コンポーネント

3. **その他の検索サービス（Phase 3）**
   - 楽天ブックス検索など

---

## テスト方針

### ユニットテスト

1. **useTextCopyMenuフック**
   - Clipboard APIのモック
   - メニューの開閉
   - コピー処理
   - 外部検索URL生成

2. **コンポーネント**
   - コンテキストメニューの表示
   - メニュー項目のクリック
   - コピー処理の実行

### E2Eテスト（オプション）

- 実際のクリップボード操作（難しい場合が多い）
- ブラウザ検索の実行（確認が難しい）

---

## 次のステップ

1. **設計方針の決定**
   - アプローチA（コンテキストメニュー）で進めるか確認
   - 最小実装（コピー機能のみ）から始めるか確認

2. **実装開始**
   - Phase 1: 共通フックの作成
   - Phase 2: BookInfo.jsxへの適用

3. **動作確認**
   - モバイル・デスクトップ両方で動作確認
   - 既存機能との競合確認

---

## 参考資料

- MUI Menu: https://mui.com/material-ui/react-menu/
- Clipboard API: https://developer.mozilla.org/ja/docs/Web/API/Clipboard_API
- コンテキストメニューのベストプラクティス
