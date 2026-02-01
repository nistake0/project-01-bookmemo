# メモカード テストカバレッジ レビュー

**作成日**: 2025年1月31日  
**目的**: MemoCard 統一化の事前に、不足テストを特定し追加する

---

## 1. 現状のテストカバレッジ

### 1.1 MemoCard.test.jsx でカバーされている機能

| 機能 | テスト | 状態 |
|------|--------|------|
| 全フィールド表示（text, comment, page, tags, createdAt） | renders memo card with all information | ✅ |
| 最小限フィールド表示 | renders memo card with minimal information | ✅ |
| 編集・削除ボタン（デスクトップ） | handles edit and delete button clicks on desktop | ✅ |
| カードクリック → onClick | calls onClick when card is clicked | ✅ |
| createdAt null | handles memo without createdAt.toDate method | ✅ |
| 空テキスト | handles memo with empty text | ✅ |
| tags null | handles memo with null tags | ✅ |
| モバイル表示（スワイプ、ボタン非表示） | renders mobile version with swipe actions | ✅ |
| デスクトップ表示（ボタン表示） | shows desktop buttons on larger screens | ✅ |
| ランク表示（あり/なし/未設定） | 3テスト | ✅ |
| 長文レイアウト（モバイル/PC） | 2テスト | ✅ |
| 各種組み合わせ | 複数 | ✅ |

### 1.2 主な機能で不足しているテスト

| 機能 | 不足内容 | 優先度 |
|------|----------|--------|
| **テキスト選択中のクリック無効化** | テキスト選択中にカードをクリックしても onClick が呼ばれない | 高 |
| **改行を含むテキストの2行表示** | 改行で分割し2行まで表示されること | 中 |
| **onEdit/onDelete 省略時** | ボタン表示時のみ必要。省略時のエラー回避 | 中（統一後に重要） |
| **showActions=false** | 編集・削除ボタンが非表示（統一後追加） | 高（統一実装時） |
| **bookTitle 表示** | 検索コンテキストで書籍名表示（統一後追加） | 高（統一実装時） |

---

## 2. 追加すべきテスト（統一化前に実施）

### 2.1 テキスト選択中のクリック無効化

```javascript
// window.getSelection をモックし、テキスト選択中は onClick が呼ばれないことを確認
```

### 2.2 改行を含むテキストの2行表示

```javascript
// テキストに改行が含まれる場合、最初の2行が表示されることを確認
// "行1\n行2\n行3" → "行1" "行2" が表示、"行3" は表示されない
```

### 2.3 onEdit/onDelete が undefined の場合（オプション）

現状 MemoCard は onEdit, onDelete を必須としていないが、ボタンクリック時に呼ぶ。  
書籍詳細では常に渡す。統一後 showActions=false ならボタンがなく、呼ばれない。  
現時点では、ボタン表示時に undefined を渡した場合のエラーは、呼び出し元の責任とする。  
→ **統一実装時に showActions テストと合わせて対応**

---

## 3. 統一実装時に追加するテスト ✅ 完了

- showActions=false のとき編集・削除ボタンが表示されない ✅
- bookTitle があるときヘッダーに書籍名が表示される ✅

---

## 4. 実施方針

1. **今すぐ追加**: テキスト選択中のクリック無効化、改行テキスト2行表示 ✅ 完了（2025-01-31）
2. **統一実装時追加**: showActions, bookTitle, variant 関連

---

## 5. 追加済みテスト（2025-01-31）

- `does not call onClick when text is selected` - テキスト選択中は onClick が呼ばれない
- `displays first 2 lines when text contains newlines` - 改行を含むテキストで最初の2行が表示される
