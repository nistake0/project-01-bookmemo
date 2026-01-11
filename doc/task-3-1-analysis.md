# Task 3.1: コンポーネントスタイルの重複排除 - 分析結果

**作成日**: 2026-01-11  
**タスク**: Task 3.1: コンポーネントスタイルの重複排除

---

## 分析結果

### 1. TextFieldのfontSize上書きの重複

**重複パターン**:
- `BookForm.jsx`で複数のTextFieldが `'& .MuiOutlinedInput-root': { fontSize: { xs: '0.9rem', sm: '1rem' } }` を指定
- テーマの `MuiTextField.styleOverrides` で `'& .MuiInputBase-root': { fontSize: '0.9rem' (モバイル) / '1rem' (デスクトップ) }` が既に定義されている

**問題点**:
- `MuiOutlinedInput-root` は `MuiInputBase-root` を継承しているため、テーマ設定で既にカバーされている可能性が高い
- 個別コンポーネントでの上書きは不要な可能性がある

**影響範囲**:
- `BookForm.jsx`: 約10箇所で `MuiOutlinedInput-root` のfontSize上書き
- その他のコンポーネントでも同様のパターンが存在する可能性

### 2. TypographyのfontSize上書き

**重複パターン**:
- 多くのコンポーネントでTypographyコンポーネントの `sx` プロップでfontSizeを上書き
- テーマの `typography` セクションでvariantごとに定義されているが、個別に上書きされている

**問題点**:
- variantを適切に使用すれば、テーマ設定が適用される
- 個別の上書きは、特別な理由がない限り不要

**影響範囲**:
- `BookCard.jsx`: 7箇所
- `BookForm.jsx`: 複数箇所
- `ExternalBookSearch.jsx`: 17箇所
- その他のコンポーネントにも多数存在

---

## 推奨アプローチ

### Phase 1: TextFieldの重複排除（優先度高）

1. **検証**: テーマの `MuiInputBase-root` 設定が `MuiOutlinedInput-root` にも適用されるか確認
2. **削除**: 確認できたら、`BookForm.jsx`などの `MuiOutlinedInput-root` fontSize上書きを削除
3. **テスト**: 視覚的回帰がないことを確認

### Phase 2: Typographyの重複排除（優先度中）

1. **分析**: 各コンポーネントでTypographyのfontSize上書きを調査
2. **分類**: 
   - variantを適切に使用できるもの（削除可能）
   - 特別な理由で上書きが必要なもの（残す）
3. **削除**: 削除可能な上書きを削除
4. **テスト**: 視覚的回帰がないことを確認

---

## 注意事項

- テーマ設定と個別コンポーネントの上書きの関係を理解することが重要
- 視覚的回帰を防ぐため、変更後は必ず動作確認が必要
- 大規模な変更のため、段階的に実施することを推奨

---

## 次のステップ

1. TextFieldの重複排除から開始（Phase 1）
2. 成功したら、Typographyの重複排除に進む（Phase 2）
3. その他の共通スタイルパターンも調査・対応
