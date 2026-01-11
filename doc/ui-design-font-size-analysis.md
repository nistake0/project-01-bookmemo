# フォントサイズ一元化の現状分析

**作成日**: 2026-01-11  
**目的**: 「全体的にフォントサイズを少しだけ小さく」というような修正を一元的に対応可能かどうかを分析

---

## 現状の分析結果

### ✅ 一元化されている部分

1. **Typography のベース設定** (`src/theme/appTheme.js` の `typography` セクション)
   - h1, h2, h3, h4, h5, h6, body1, body2, caption のフォントサイズ
   - これらは `variant` プロップで使用する場合、テーマ設定が適用される

2. **主要コンポーネントのグローバル設定** (`src/theme/appTheme.js` の `components.styleOverrides` セクション)
   - TextField: `fontSize: '0.9rem'` (モバイル) / `'1rem'` (デスクトップ)
   - Button: `fontSize: '0.9rem'` (モバイル) / `'1rem'` (デスクトップ)
   - Chip: `fontSize: '0.8rem'` (モバイル) / `'0.9rem'` (デスクトップ)
   - BottomNavigationAction: `fontSize: '0.7rem'` (モバイル) / `'0.8rem'` (デスクトップ)

### ❌ 一元化されていない部分

多くのコンポーネントで `sx` プロップを使って個別に `fontSize` が上書きされている。

**主な例:**
- `BookCard.jsx`: 7箇所で個別に fontSize を指定
- `BookForm.jsx`: 15箇所で個別に fontSize を指定
- `ExternalBookSearch.jsx`: 17箇所で個別に fontSize を指定
- その他のコンポーネントにも多数存在

**問題点:**
- `sx` プロップで指定された `fontSize` は、テーマ設定を上書きするため、テーマ変更が反映されない
- 個別コンポーネントごとに手動で修正する必要がある

---

## 結論

### 現時点での回答: **部分的には可能、完全には不可能**

1. **Typography の variant を使用している部分**: テーマの `typography` 設定を変更すれば反映される
2. **主要コンポーネント（TextField, Button など）**: テーマの `components.styleOverrides` を変更すれば反映される
3. **個別コンポーネントで `sx` で上書きしている部分**: テーマ変更が反映されない

### 全体的にフォントサイズを小さくする場合の対応方法

#### 方法1: テーマ設定の変更（部分的に効果がある）
- `appTheme.js` の `typography` セクションを変更
- `components.styleOverrides` を変更
- → これだけでは、個別コンポーネントで上書きされている部分は変更されない

#### 方法2: 完全に一元化する（推奨されるが作業量が多い）
- 個別コンポーネントの `sx` プロップから `fontSize` を削除
- Typography の `variant` を適切に使用する
- 必要最小限の上書きのみを残す
- → Task 3.1（コンポーネントスタイルの重複排除）で対応可能

---

## 推奨事項

1. **短期対応**: テーマ設定を変更することで、主要部分は調整可能
2. **長期対応**: Task 3.1 で個別コンポーネントのフォントサイズ上書きを削減し、より一元化を進める

---

## 参考データ

- テーマ設定で定義されているフォントサイズ: `src/theme/appTheme.js`
- 個別コンポーネントで上書きされている箇所: 48箇所（components） + 3箇所（pages）
