# デザイン改善の実装サンプルコード

## 1. 背景画像の実装（App.jsx / index.css）

### オプションA: CSSで実装（推奨）

```css
/* src/index.css に追加 */
#app-scroll-container {
  /* 背景画像の設定 */
  background-image: 
    url('/library-background.jpg'),  /* メイン背景画像 */
    url('/library-pattern.svg');      /* 既存のパターン（オーバーレイ） */
  
  background-size: 
    cover,                            /* 画像を画面全体にカバー */
    320px 320px;                      /* パターンは繰り返し */
  
  background-position: 
    center center,                    /* 背景画像は中央 */
    0 calc(var(--bg-offset, 0px));    /* パターンはパララックス効果 */
  
  background-repeat: 
    no-repeat,                        /* 背景画像は繰り返さない */
    repeat;                           /* パターンは繰り返す */
  
  background-attachment: fixed;       /* スクロール時も背景を固定 */
  background-blend-mode: overlay;     /* ブレンドモードで統合 */
  
  /* 背景の色調調整（オーバーレイ） */
  position: relative;
}

/* 背景の色調調整レイヤー（オプション） */
#app-scroll-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(245, 247, 250, 0.3) 0%,      /* 上部は明るく */
    rgba(139, 69, 19, 0.1) 50%,       /* 中央は茶色のオーバーレイ */
    rgba(15, 23, 42, 0.2) 100%        /* 下部は暗く */
  );
  pointer-events: none;
  z-index: 0;
}

/* コンテンツは背景の上に表示 */
#app-scroll-container > * {
  position: relative;
  z-index: 1;
}
```

### オプションB: App.jsxで実装

```jsx
// App.jsx の AppRoutes コンポーネント内
<Box
  id="app-scroll-container"
  sx={{
    minHeight: '100vh',
    backgroundImage: [
      'url(/library-background.jpg)',
      'url(/library-pattern.svg)',
    ],
    backgroundSize: ['cover', '320px 320px'],
    backgroundPosition: [
      'center center',
      `0 calc(var(--bg-offset, 0px))`,
    ],
    backgroundRepeat: ['no-repeat', 'repeat'],
    backgroundAttachment: 'fixed',
    backgroundBlendMode: 'overlay',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'fixed',
      inset: 0,
      background: `linear-gradient(
        180deg,
        rgba(245, 247, 250, 0.3) 0%,
        rgba(139, 69, 19, 0.1) 50%,
        rgba(15, 23, 42, 0.2) 100%
      )`,
      pointerEvents: 'none',
      zIndex: 0,
    },
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
  }}
>
  {/* 既存のコンテンツ */}
</Box>
```

---

## 2. BookCard の改善実装

```jsx
// src/components/BookCard.jsx の Card コンポーネント
<Card 
  sx={{ 
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: { xs: '140px', sm: '160px' },
    
    // ガラスモーフィズム強化
    backgroundColor: 'rgba(255, 255, 255, 0.75)',  // 透明度向上
    backdropFilter: 'blur(20px) saturate(180%)',
    
    // 装飾的な枠線（古い本の装丁風）
    border: '2px solid rgba(139, 69, 19, 0.2)',
    borderRadius: 3,
    
    // 強化された影
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,
    
    position: 'relative',
    overflow: 'visible',  // 装飾がはみ出せるように
    
    // ホバー時のアニメーション
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `
        0 12px 40px rgba(0, 0, 0, 0.16),
        0 4px 12px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.6)
      `,
      borderColor: 'rgba(139, 69, 19, 0.3)',
    },
    
    // 装飾的な内側の枠
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      bottom: 8,
      border: '1px solid rgba(139, 69, 19, 0.1)',
      borderRadius: 2,
      pointerEvents: 'none',
      zIndex: 0,
    },
    
    // 本のページのような中央の装飾線
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '50%',
      width: 1,
      height: '100%',
      background: 'linear-gradient(to bottom, transparent, rgba(139, 69, 19, 0.1), transparent)',
      pointerEvents: 'none',
      zIndex: 0,
    },
  }}
  onClick={onClick}
  data-testid={testId || `book-card-${book.id}`}
>
  <CardContent sx={{ 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column',
    p: { xs: 1.5, sm: 2 },
    position: 'relative',
    zIndex: 1,  // コンテンツは装飾の上に
    '&:last-child': { pb: { xs: 1.5, sm: 2 } }
  }}>
    {/* 既存のコンテンツ */}
  </CardContent>
</Card>
```

---

## 3. PageHeader の装飾強化実装

```jsx
// src/components/common/PageHeader.jsx
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <Paper
      elevation={0}
      data-testid="page-header"
      sx={(theme) => {
        return {
          p: 0,
          borderRadius: { xs: 16, sm: 20 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          
          // ガラスモーフィズム強化
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(24px) saturate(180%)',
          
          // 装飾的な枠線
          border: '3px solid rgba(139, 69, 19, 0.25)',
          
          // 紙のテクスチャ（既存のpaper-texture.jpgを使用）
          backgroundImage: [
            'url(/paper-texture.jpg)',
            'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))',
          ],
          backgroundBlendMode: 'overlay',
          backgroundSize: '200% 200%, cover',
          backgroundPosition: '0 0, center',
          
          // 強化された影
          boxShadow: `
            0 18px 50px rgba(15, 23, 42, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6)
          `,
          
          // 装飾的な角の金具風（左上・右上）
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(135deg, rgba(184, 134, 11, 0.15) 0%, transparent 30%),
              linear-gradient(225deg, rgba(184, 134, 11, 0.15) 0%, transparent 30%),
              linear-gradient(45deg, transparent 0%, rgba(184, 134, 11, 0.08) 50%, transparent 100%),
              linear-gradient(315deg, transparent 0%, rgba(184, 134, 11, 0.08) 50%, transparent 100%)
            `,
            pointerEvents: 'none',
            zIndex: 0,
          },
          
          // タイトル周りの装飾線
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '10%',
            right: '10%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.3), transparent)',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
        };
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          textAlign: 'center',
          color: 'text.primary',
          position: 'relative',
          zIndex: 1  // コンテンツは装飾の上に
        }}
      >
        {/* 既存のタイトル・サブタイトル */}
      </Box>
    </Paper>
  );
};
```

---

## 4. 装飾コンポーネントの実装

```jsx
// src/components/common/DecorativeCorner.jsx
import React from 'react';
import { Box } from '@mui/material';

/**
 * カードの角に装飾的な金具風の装飾を追加
 */
const DecorativeCorner = ({ position = 'top-left', size = 24 }) => {
  const positions = {
    'top-left': { top: 0, left: 0, transform: 'rotate(0deg)' },
    'top-right': { top: 0, right: 0, transform: 'rotate(90deg)' },
    'bottom-left': { bottom: 0, left: 0, transform: 'rotate(-90deg)' },
    'bottom-right': { bottom: 0, right: 0, transform: 'rotate(180deg)' },
  };
  
  return (
    <Box
      sx={{
        position: 'absolute',
        ...positions[position],
        width: size,
        height: size,
        opacity: 0.4,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        {/* 角の装飾（L字型） */}
        <path
          d="M 0 0 L 24 0 L 24 4 L 4 4 L 4 24 L 0 24 Z"
          fill="rgba(184, 134, 11, 0.4)"
          stroke="rgba(139, 69, 19, 0.5)"
          strokeWidth="0.5"
        />
        {/* 内側の装飾線 */}
        <path
          d="M 2 2 L 22 2 L 22 6 L 6 6 L 6 22 L 2 22 Z"
          fill="none"
          stroke="rgba(184, 134, 11, 0.3)"
          strokeWidth="0.3"
        />
      </svg>
    </Box>
  );
};

export default DecorativeCorner;
```

### BookCard での使用例

```jsx
// BookCard.jsx に追加
import DecorativeCorner from './common/DecorativeCorner';

<Card sx={{ /* 既存のスタイル */ }}>
  <DecorativeCorner position="top-left" />
  <DecorativeCorner position="top-right" />
  {/* 既存のコンテンツ */}
</Card>
```

---

## 5. 背景画像の取得方法（具体的な手順）

### 具体的な候補一覧

**`doc/design-image-candidates.md`** に、選定済みの **具体的なURL・説明・選び方** をまとめています。  
実装時はここから候補を選び、ダウンロード → 最適化 → `public/` 配置してください。

### Unsplash からの取得（手順）

1. **候補Docを開く**: `doc/design-image-candidates.md` でURLを確認
2. **URLを開く**: 例) https://unsplash.com/photos/YTJCRRNi-bM （NYPL書棚）
3. **ダウンロード**: 右上の「Download」で高解像度版を取得
4. **最適化**: [Squoosh](https://squoosh.app/) 等で WebP 化 or 1920×1080 程度にリサイズ（2MB以下推奨）
5. **配置**: `public/library-background.jpg` または `.webp` として保存

### 推奨画像のURL例（Unsplash）

候補Docに詳細あり。例のみ：
- https://unsplash.com/photos/YTJCRRNi-bM （NYPL・茶色書棚）
- https://unsplash.com/photos/GWCvnsMtiBg （ウェルズ大聖堂図書館）
- https://unsplash.com/photos/5-qP-0ea_uo （ノルウェー国立図書館）

**注意**: 実際の使用時は、各サイトから直接ダウンロードし、利用規約を確認してください。

---

## 6. モバイル対応の考慮

```css
/* モバイルでは背景画像を簡略化 */
@media (max-width: 768px) {
  #app-scroll-container {
    background-image: url('/library-pattern.svg');  /* パターンのみ */
    background-size: 320px 320px;
    background-color: #f5f7fa;  /* フォールバック */
  }
  
  /* カードの透明度を少し上げる（読みやすさ優先） */
  .MuiCard-root {
    backgroundColor: 'rgba(255, 255, 255, 0.85)';
  }
}
```

---

## 7. パフォーマンス最適化

```jsx
// 背景画像の遅延読み込み（オプション）
const [backgroundLoaded, setBackgroundLoaded] = useState(false);

useEffect(() => {
  const img = new Image();
  img.src = '/library-background.jpg';
  img.onload = () => setBackgroundLoaded(true);
}, []);

// App.jsx で使用
<Box
  sx={{
    backgroundImage: backgroundLoaded 
      ? 'url(/library-background.jpg)' 
      : 'none',
    // ...
  }}
>
```

---

## 8. 実装チェックリスト

- [ ] 背景画像をダウンロード・最適化
- [ ] `public/` に画像を配置
- [ ] `index.css` または `App.jsx` で背景設定
- [ ] `BookCard.jsx` の透明度・装飾を更新
- [ ] `PageHeader.jsx` の装飾を追加
- [ ] モバイルでの表示確認
- [ ] パフォーマンステスト（Lighthouse等）
- [ ] アクセシビリティ確認（コントラスト比）

---

**次のステップ**: 背景画像を取得後、Phase 1から順に実装を開始します。

---

## サブエージェントでの実行

アート・グラフィック関連の実装は **`artistic-graphics` サブエージェント** で行う。

- 指定: `.claude/agents/artistic-graphics.md`
- 別セッションで「Phase 1 の背景実装」「カード装飾の適用」等を依頼する。
