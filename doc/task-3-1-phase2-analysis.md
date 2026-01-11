# Task 3.1 Phase 2: TypographyのfontSize上書き分析

**作成日**: 2026-01-11  
**タスク**: Task 3.1 Phase 2 - TypographyのfontSize上書きの重複排除

---

## テーマ設定

`src/theme/appTheme.js`のTypography設定：

- **h6**: `0.9rem` (モバイル) / `1.1rem` (デスクトップ)
- **body1**: `0.9rem` (モバイル) / `1rem` (デスクトップ)
- **body2**: `0.8rem` (モバイル) / `0.9rem` (デスクトップ)
- **caption**: `0.7rem` (モバイル) / `0.8rem` (デスクトップ)
- **subtitle1**: テーマに定義なし（デフォルト値を使用）

---

## コンポーネントでのfontSize上書きパターン

### 1. body2 variant + fontSize: { xs: '0.8rem', sm: '0.9rem' }

**テーマ設定と一致**: テーマのbody2設定と完全に一致

**使用箇所**:
- `ExternalBookSearch.jsx`: 2箇所（著者、出版社）
- その他のコンポーネントでも複数箇所

**削除可否**: ✅ **削除可能**（テーマ設定と同じ値のため）

---

### 2. body2 variant + その他の値

**テーマ設定と不一致**: テーマのbody2設定とは異なる値

**使用箇所**:
- `BookCard.jsx`: `{ xs: '0.75rem', sm: '0.8rem', md: '0.9rem' }` - テーマより小さい
- `BookCard.jsx`: `{ xs: '0.7rem', sm: '0.75rem', md: '0.8rem' }` - テーマより小さい

**削除可否**: ❌ **削除不可**（意図的に小さくしている可能性）

---

### 3. h6 variant + fontSize上書き

**使用箇所**:
- `BookCard.jsx`: `{ xs: '0.9rem', sm: '1rem', md: '1.1rem' }` - テーマ（sm: '1.1rem'）と微妙に異なる
- `ExternalBookSearch.jsx`: `{ xs: '1rem', sm: '1.25rem' }` - テーマ（xs: '0.9rem', sm: '1.1rem'）と異なる

**削除可否**: ❌ **削除不可**（意図的に異なるサイズを使用）

---

### 4. subtitle1 variant + fontSize上書き

**テーマ設定**: subtitle1はテーマに定義なし（Material-UIデフォルト使用）

**使用箇所**:
- `ExternalBookSearch.jsx`: `{ xs: '0.9rem', sm: '1rem' }`

**削除可否**: ⚠️ **検討必要**（テーマに定義がないため、デフォルト値との比較が必要）

---

### 5. caption variant + fontSize上書き

**使用箇所**:
- `BookCard.jsx`: `{ xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }` - テーマ（xs: '0.7rem', sm: '0.8rem'）より小さい

**削除可否**: ❌ **削除不可**（意図的に小さくしている）

---

## 結論

### 削除可能なパターン

**body2 variant + fontSize: { xs: '0.8rem', sm: '0.9rem' }**

- テーマ設定と完全に一致
- 複数のコンポーネントで使用されている
- 削除しても視覚的な変化なし

### 削除不可なパターン

- body2 variant + その他の値（意図的に小さくしている）
- h6 variant + fontSize上書き（意図的に異なるサイズを使用）
- caption variant + fontSize上書き（意図的に小さくしている）
- subtitle1 variant + fontSize上書き（テーマに定義がないため、検討必要）

---

## 推奨アプローチ

### Phase 2.1: body2 variantの一致パターンを削除（優先度高）

1. `body2` variantで`fontSize: { xs: '0.8rem', sm: '0.9rem' }`を使用している箇所を検索
2. 該当するfontSize上書きを削除
3. テスト実行で視覚的回帰がないことを確認

### Phase 2.2: その他のパターンの検討（優先度低）

- subtitle1のテーマ定義追加の検討
- 他のvariantパターンの統一性検討

---

## 次のステップ

Phase 2.1から開始し、body2 variantの一致パターンを削除します。
