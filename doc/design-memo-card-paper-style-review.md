# メモカード「紙片」デザイン変更のレビュー

**作成日**: 2025年1月31日  
**目的**: 図書館テーマでメモカードを「丸角をやめ、角が一つ折れた紙片風」にする際、テーマ/カード実装の十分性を評価する

---

## 1. 要件

| プリセット | 書籍カード | メモカード |
|------------|------------|------------|
| **library-classic** | 現状維持（丸角、DecorativeCorner 等） | 丸角をやめる、角が一つ折れてある紙片風 |
| **minimal-light** | 現状維持 | 現状維持（書籍と同一でよい） |

---

## 2. 現状の実装構造

### 2.1 メモカードを使用する箇所

| 箇所 | コンポーネント | スタイル取得 |
|------|----------------|--------------|
| 書籍詳細のメモ一覧 | MemoCard | getMemoCardSx(theme), getMemoDecorations(theme) |
| 検索結果のメモ表示 | SearchResults renderMemoResult | getMemoCardSx(theme, { borderRadius: 2, ... }) |
| メモ詳細 | MemoEditor Dialog | カードスタイル不使用（Dialog 内の通常レイアウト） |

### 2.2 テーマから参照している値

- `theme.custom.memoDecorations` → corners, innerBorder, centerLine
- `theme.custom.memoAccent`
- `theme.custom.glassEffect`, cardShadow, cardShadowHover
- `getMemoCardSx` の options: borderRadius, innerBorderInset, useMemoAccentShadow, hoverTransform

### 2.3 現在の制御の境界

- **borderRadius**: getMemoCardSx の `options.borderRadius`（デフォルト 3）。SearchResults は `borderRadius: 2` を明示渡し。
- **角装飾**: `decorations.corners` が true のとき MemoCard / SearchResults が DecorativeCorner を描画。図書館では `corners: true`。
- **折り目装飾**: 未サポート。

---

## 3. レビュー結論：実装側の修正が必要か

### 3.1 結論：**テーマ／cardStyles の拡張で対応可能。コンポーネントの大幅な変更は不要**

必要な作業は以下に限定できる。

1. **themePresets / createThemeFromPreset の拡張**（新規プロパティ追加）
2. **cardStyles.js の getMemoCardSx 拡張**（折り目用 CSS 生成）
3. **SearchResults のオプション削除**（テーマ優先のための軽微な修正）

---

## 4. 詳細レビュー

### 4.1 borderRadius（丸角をやめる）

| 項目 | 現状 | 対応方針 |
|------|------|----------|
| テーマでの指定 | memoDecorations に borderRadius なし | memoDecorations.borderRadius を追加 |
| cardStyles | options.borderRadius ?? 3 | options.borderRadius ?? theme.custom.memoDecorations?.borderRadius ?? 3 |
| コンポーネント | SearchResults が `borderRadius: 2` を渡している | **修正必要**: 削除しテーマに委ねる |
| MemoCard | borderRadius を渡していない | 修正不要（テーマが効く） |

→ **SearchResults の `borderRadius: 2` 削除のみ**で、テーマ制御に統一できる。

### 4.2 折り目（角が一つ折れている）

| 項目 | 現状 | 対応方針 |
|------|------|----------|
| 実装場所 | なし | getMemoCardSx 内で `::after` 等の擬似要素で生成 |
| テーマでの指定 | なし | memoDecorations.foldedCorner, foldedCornerPosition 等を追加 |
| コンポーネント | - | 追加の描画ロジック・JSX は不要 |

折り目は `::after` で角に三角形を描く CSS で実現可能。例:

```css
/* 右上に折り目 */
&::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 24px 24px 0;
  border-color: transparent rgba(0,0,0,0.08) transparent transparent;
}
```

これを getMemoCardSx の返す `sx` に含めればよい。**新規コンポーネントや条件分岐の追加は不要**。

### 4.3 DecorativeCorner（金具風の角装飾）

| 項目 | 現状 | 対応方針 |
|------|------|----------|
| 表示条件 | decorations.corners | 折り目デザイン時は corners: false にして非表示 |
| コンポーネント | MemoCard, SearchResults が条件描画 | 既存ロジックのまま（corners で制御） |

→ **themePresets で library-classic の memoDecorations.corners を false にする**だけで、DecorativeCorner は表示されなくなる。

### 4.4 内枠・中央線

| 項目 | 現状 | 対応方針 |
|------|------|----------|
| 図書館メモ | innerBorder: true, centerLine: false | 紙片風なら innerBorder も false にするか検討 |

紙片の印象を強めるなら、`innerBorder: false` も検討の余地あり。現状のままでも大きな問題はない。

---

## 5. テーマ化の十分性の評価

### 5.1 十分と判断できる理由

1. **角丸・折り目・角装飾の有無**  
   すべて themePresets の memoDecorations で制御可能。

2. **見た目の生成**  
   getMemoCardSx 内の sx（疑似要素含む）で完結し、MemoCard / SearchResults の JSX や条件分岐は不要。

3. **プリセット差**  
   library-classic と minimal-light で memoDecorations を変えるだけで、書籍カードとメモカードの差別化が可能。

### 5.2 必要な軽微な修正

| ファイル | 内容 | 理由 |
|----------|------|------|
| SearchResults.jsx | getMemoCardSx 呼び出しから `borderRadius: 2` を削除 | テーマの borderRadius を有効にするため |

この程度であれば、「テーマ／デザイン一元化が十分でない」とするほどの構造変更には当たらない。

---

## 6. 実装タスク案

### Phase 1: テーマ・cardStyles の拡張

1. **themePresets.js**
   - library-classic の memoDecorations に以下を追加:
     - `borderRadius: 0`
     - `corners: false`（DecorativeCorner 非表示）
     - `foldedCorner: true`
     - `foldedCornerPosition: 'top-right'`（任意）
     - 必要に応じて `innerBorder: false`

2. **createThemeFromPreset.js**
   - memoDecorations のデフォルト／マージ処理に上記プロパティを反映

3. **cardStyles.js (getMemoCardSx)**
   - borderRadius: `options.borderRadius ?? theme.custom?.memoDecorations?.borderRadius ?? 3`
   - memoDecorations.foldedCorner が true のとき、`::after` で折り目用の三角形を追加
   - innerBorder / centerLine の条件に foldedCorner があれば考慮（競合しない範囲で）

### Phase 2: 軽微なコンポーネント修正

4. **SearchResults.jsx**
   - getMemoCardSx の options から `borderRadius: 2` を削除

### Phase 3: テスト・ドキュメント

5. cardStyles.test.js に foldedCorner 関連のテストを追加
6. design-system-overview.md 等を更新

---

## 7. MemoEditor のメモ詳細について

MemoEditor の詳細表示は Dialog 内の通常レイアウトであり、getMemoCardSx を使っていない。

- メモカードの「紙片」デザインを、詳細ダイアログ内にも適用したい場合は、Dialog 内に Paper/Card を置き、getMemoCardSx を適用する変更が必要。
- 現タスクの範囲を「MemoCard と SearchResults のメモカード」に限定するなら、MemoEditor の変更は対象外としてよい。

---

## 8. まとめ

- **テーマ化・デザイン一元化は十分**と判断できる。
- 必要なのは **themePresets / createThemeFromPreset / cardStyles の拡張** と、**SearchResults の borderRadius 指定削除** のみ。
- 折り目表現は cardStyles 内の CSS 疑似要素で実現可能で、新規コンポーネントや大きな実装変更は不要。
- この方針で先行して実装してよい。

---

## 9. 実装完了（2025-01-31）

- themePresets.js: library-classic の memoDecorations に borderRadius: 0, corners: false, innerBorder: false, foldedCorner: true, foldedCornerPosition: 'top-right' を追加
- cardStyles.js: getMemoCardSx に foldedCorner 用の ::after 疑似要素、borderRadius のテーマ参照を追加
- SearchResults.jsx: borderRadius: 2 を削除
- cardStyles.test.js: foldedCorner 関連のテストを追加

### 追加修正（メモスタイル統一）

- SearchResults.jsx: 検索結果のメモ内コンテンツ（テキスト・コメント枠）を grey/primary から memo アクセント色（lighter, light）に変更
- MemoEditor.jsx: メモ詳細表示（view モード）を getMemoCardSx でラップした Paper で囲み、メモカードスタイルを適用
