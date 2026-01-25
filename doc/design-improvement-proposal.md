# アート的なデザイン改善提案

## 📚 背景画像リソース

### 推奨無料素材サイト

1. **Unsplash** (https://unsplash.com)
   - 検索: "vintage library", "old library bookshelf", "european library"
   - 商用利用可、クレジット不要
   - 高解像度（4K対応）

2. **Pexels** (https://www.pexels.com)
   - 検索: "library interior", "bookshelf vintage"
   - 商用利用可

3. **Pixabay** (https://pixabay.com)
   - 検索: "library bookshelf", "vintage library"
   - 商用利用可

### 推奨画像の特徴
- **色調**: 暖色系（茶色、ベージュ、クリーム色）が古い図書館らしさを演出
- **構図**: 書棚が斜めに見える構図（パースペクティブ）が良い
- **明度**: やや暗めで、カードの白が映えるもの
- **解像度**: 1920x1080以上推奨（パフォーマンス考慮）

### 具体的な画像候補
**`doc/design-image-candidates.md`** に、Unsplash・Pexels の **具体的なURL・候補一覧** を記載しています。  
（例: NYPLローズ閲覧室、ウェルズ大聖堂図書館、ノルウェー国立図書館、ストックホルム市立図書館 など）  
実装時はこのファイルを参照して画像を選定してください。

### 画像の最適化
- WebP形式に変換（ファイルサイズ削減）
- 複数サイズを用意（レスポンシブ対応）
- 遅延読み込み（lazy loading）

---

## 🎨 デザイン改善案

### 1. 背景画像の実装

```css
/* index.css または App.jsx のスタイル */
#app-scroll-container {
  background-image: 
    url('/library-background.jpg'),  /* メイン背景 */
    url('/library-pattern.svg');      /* 既存パターン（オーバーレイ） */
  background-size: 
    cover,                            /* 画像をカバー */
    320px 320px;                      /* パターンは繰り返し */
  background-position: 
    center center,                    /* 背景画像は中央 */
    0 calc(var(--bg-offset, 0px));    /* パターンはパララックス */
  background-repeat: 
    no-repeat,                        /* 背景画像は繰り返さない */
    repeat;                           /* パターンは繰り返す */
  background-attachment: fixed;       /* スクロール時も固定 */
  background-blend-mode: overlay;     /* ブレンドモードで統合 */
}
```

### 2. カードの透明度向上と装飾

#### BookCard の改善
- **ガラスモーフィズム強化**: 透明度を上げ、背景を透かす
- **装飾枠**: 古い本の装丁をイメージした枠線
- **影の強化**: カードが浮き上がるような影

```jsx
// BookCard.jsx の sx プロパティ例
sx={{
  backgroundColor: 'rgba(255, 255, 255, 0.75)',  // 透明度向上（以前は0.9程度）
  backdropFilter: 'blur(20px) saturate(180%)',   // ブラー強化
  border: '2px solid rgba(139, 69, 19, 0.2)',    // 茶色の枠線（本の装丁風）
  borderRadius: 3,
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5)      // 内側のハイライト
  `,
  position: 'relative',
  '&::before': {  // 装飾的な角の装飾
    content: '""',
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    border: '1px solid rgba(139, 69, 19, 0.1)',
    borderRadius: 2,
    pointerEvents: 'none',
  },
  '&::after': {  // 本のページのような装飾線
    content: '""',
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 1,
    height: '100%',
    background: 'linear-gradient(to bottom, transparent, rgba(139, 69, 19, 0.1), transparent)',
    pointerEvents: 'none',
  },
}}
```

### 3. PageHeader の装飾強化

#### 装飾要素の追加
- **角の装飾**: 古い本の角の金具をイメージ
- **タイトル周りの装飾**: 装飾的な枠線
- **背景の質感**: 紙のテクスチャを重ねる

```jsx
// PageHeader.jsx の改善例
sx={(theme) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.7)',  // 透明度向上
  backdropFilter: 'blur(24px) saturate(180%)',
  border: '3px solid rgba(139, 69, 19, 0.25)',
  borderRadius: { xs: 16, sm: 20 },
  position: 'relative',
  overflow: 'hidden',
  // 装飾的な角の金具風
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, transparent 50%),
      linear-gradient(225deg, rgba(184, 134, 11, 0.1) 0%, transparent 50%),
      linear-gradient(45deg, transparent 0%, rgba(184, 134, 11, 0.05) 50%, transparent 100%),
      linear-gradient(315deg, transparent 0%, rgba(184, 134, 11, 0.05) 50%, transparent 100%)
    `,
    pointerEvents: 'none',
  },
  // タイトル周りの装飾枠
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
  },
  // 紙のテクスチャ（既存のpaper-texture.jpgを使用）
  backgroundImage: `
    url('/paper-texture.jpg'),
    linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.5))
  `,
  backgroundBlendMode: 'overlay',
  backgroundSize: '200% 200%, cover',
  backgroundPosition: '0 0, center',
})}
```

### 4. 追加の装飾要素

#### 装飾的なSVGパターン
- **本の装丁パターン**: カードの周囲に装飾的なパターン
- **ページの角折れ**: 本のページが折れているような装飾
- **金具の装飾**: 古い本の金具をイメージした小さな装飾

```jsx
// 装飾コンポーネント例: DecorativeCorner.jsx
const DecorativeCorner = ({ position = 'top-left' }) => {
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
        width: 24,
        height: 24,
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path
          d="M 0 0 L 24 0 L 24 4 L 4 4 L 4 24 L 0 24 Z"
          fill="rgba(184, 134, 11, 0.4)"
          stroke="rgba(139, 69, 19, 0.3)"
          strokeWidth="0.5"
        />
      </svg>
    </Box>
  );
};
```

---

## 🎯 実装優先順位

### Phase 1: 背景画像の追加（最優先）
1. 背景画像をダウンロード・最適化
2. `public/` に配置
3. `App.jsx` または `index.css` で背景設定

### Phase 2: カードの透明度向上
1. `BookCard.jsx` の透明度調整
2. ガラスモーフィズム強化
3. 装飾枠の追加

### Phase 3: ヘッダーの装飾強化
1. `PageHeader.jsx` の装飾追加
2. 背景テクスチャの統合

### Phase 4: 追加装飾要素
1. 装飾コンポーネントの作成
2. カードへの装飾適用

---

## 📝 注意事項

### パフォーマンス
- 背景画像は適切なサイズに最適化（WebP推奨）
- `background-attachment: fixed` はモバイルでパフォーマンス低下の可能性
- 必要に応じて `will-change` や `transform: translateZ(0)` でGPU加速

### アクセシビリティ
- 背景画像が濃い場合は、テキストのコントラスト比を確保
- `prefers-reduced-motion` に対応（既存の `useBackgroundParallax` で対応済み）

### レスポンシブ
- モバイルでは背景画像を簡略化する可能性
- カードの透明度は画面サイズに応じて調整

---

## 🖼️ サンプル画像の取得方法

### 推奨検索キーワード（Unsplash）
- "vintage library interior"
- "old european library bookshelf"
- "classic library reading room"
- "antique bookshelf with books"
- "historic library architecture"

### 画像の選定基準
1. **色調**: 暖色系（茶色、ベージュ、クリーム）
2. **明度**: やや暗め（カードの白が映える）
3. **構図**: 書棚が斜めに見える（パースペクティブ）
4. **解像度**: 1920x1080以上
5. **ライセンス**: 商用利用可

---

## 💡 追加のアート的提案

### 1. ホバー時のアニメーション
- カードにマウスオーバー時に、本が開くようなアニメーション
- 影が大きくなる、わずかに浮き上がる

### 2. ページ遷移のアニメーション
- 本のページをめくるようなトランジション
- フェードではなく、スライド＋回転

### 3. 装飾的なアイコン
- 本のアイコンを装飾的なスタイルに変更
- 手描き風のアイコンセットの使用

### 4. カスタムフォント
- タイトルに装飾的なフォント（例: Playfair Display, Cormorant）
- 本文は読みやすさを優先

---

## 🔧 実装開始の準備

1. **背景画像の選定・ダウンロード**
   - Unsplash等から適切な画像を選定
   - WebP形式に変換（必要に応じて）

2. **画像の配置**
   - `public/library-background.jpg` または `.webp` として配置

3. **段階的な実装**
   - Phase 1から順に実装
   - 各フェーズで動作確認

---

**次のステップ**: 背景画像を選定・ダウンロード後、実装を開始します。

---

## 🤖 サブエージェント運用

**アート・グラフィック周りの作業は別サブエージェントで実行する。**

- **エージェント**: `.claude/agents/artistic-graphics.md`
- **役割**: 背景画像、カード・ヘッダー装飾、見た目の調整など、見た目専用
- **運用**: 新しいチャット／セッションを開き、このエージェントを指定して「デザイン改善を実装して」等と依頼する。メイン開発エージェントのコンテキストを汚さない。
