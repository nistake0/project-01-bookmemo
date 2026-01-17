# メモテキスト改善 - 設計検討

## 📋 概要

メモ内のテキストについて、以下の2つの改善を検討します：
1. **URLをハイパーリンクにする**: メモ内のURL部分をクリック可能なリンクに変換
2. **テキストの選択・コピーを可能にする**: 現在選択できないメモテキストを選択・コピー可能に

---

## 🔍 現状分析

### メモテキストの表示箇所

1. **MemoCard.jsx** - カード表示（一覧画面）
   - `whiteSpace: 'nowrap'` - 改行なし
   - `overflow: 'hidden'` - オーバーフロー非表示
   - `textOverflow: 'ellipsis'` - 省略表示
   - **問題**: テキスト選択ができない（`user-select`の制限 + カード全体がクリック可能）

2. **MemoEditor.jsx** - 詳細表示（ダイアログ）
   - `whiteSpace: 'pre-line'` - 改行対応
   - **問題**: URLリンク化なし、テキスト選択は可能だが明示的でない

3. **SearchResults.jsx** - 検索結果表示
   - メモテキストの一部表示
   - **問題**: URLリンク化なし

### 現在の制約

- `index.css`でグローバルに`user-select: none`が設定されている
- 一部コンポーネント（`BookInfo.jsx`）で`userSelect: 'none'`を明示的に設定
- メモテキストはプレーンテキストとして表示（URL検出・リンク化なし）

---

## ✅ 修正可能性の確認

### 1. URLをハイパーリンクにする

**技術的実現可能性**: ✅ **可能**

**方法**:
- URL検出用のユーティリティ関数を作成
- テキストをパースしてURL部分を`<a>`タグに変換
- Reactコンポーネントで安全にレンダリング（XSS対策）

**実装方針**:
```javascript
// utils/textUtils.js
export const detectUrls = (text) => {
  // URL正規表現で検出
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // URL部分をリンクに変換
};

// コンポーネント
const LinkifiedText = ({ text }) => {
  const parts = detectUrls(text);
  return (
    <>
      {parts.map((part, idx) => 
        part.isUrl ? (
          <a key={idx} href={part.text} target="_blank" rel="noopener noreferrer">
            {part.text}
          </a>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </>
  );
};
```

**考慮事項**:
- XSS対策: `dangerouslySetInnerHTML`は使わず、React要素として構築
- セキュリティ: `rel="noopener noreferrer"`を必ず設定
- パフォーマンス: 長いテキストでも効率的に処理

### 2. テキストの選択・コピーを可能にする

**技術的実現可能性**: ✅ **可能**

**方法**:
- CSSの`user-select: text`を明示的に設定
- カード全体のクリックイベントとテキスト選択の競合を解決

**実装方針**:

#### MemoCard.jsx（カード表示）
```javascript
// 問題: カード全体がクリック可能で、テキスト選択と競合
// 解決策: テキスト部分に`userSelect: 'text'`を設定し、クリックイベントを調整

<Typography
  variant="body1"
  sx={{
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'text', // テキスト選択を有効化
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    msUserSelect: 'text',
  }}
  onMouseDown={(e) => {
    // テキスト選択中はカードクリックを無効化
    if (window.getSelection().toString()) {
      e.stopPropagation();
    }
  }}
>
  {shortText}
</Typography>
```

#### MemoEditor.jsx（詳細表示）
```javascript
// 既に`whiteSpace: 'pre-line'`で改行対応済み
// テキスト選択を明示的に有効化

<Typography 
  variant="body1" 
  sx={{ 
    whiteSpace: 'pre-line', 
    mb: 2,
    userSelect: 'text', // 明示的に有効化
    WebkitUserSelect: 'text',
    MozUserSelect: 'text',
    msUserSelect: 'text',
  }} 
  data-testid="memo-detail-text"
>
  {editingMemo?.text}
</Typography>
```

**考慮事項**:
- カード全体のクリックイベントとの競合回避
- スワイプジェスチャ（モバイル）との競合回避
- テキスト選択時の視覚的フィードバック

---

## 🎯 実装方針

### Phase 1: URLリンク化機能

**実装内容**:
1. `src/utils/textUtils.js` - URL検出・リンク化ユーティリティ
   - `detectUrls(text)`: テキストからURLを検出
   - `linkifyText(text)`: URLをリンクに変換したReact要素を生成
2. `src/components/LinkifiedText.jsx` - リンク化テキストコンポーネント
   - テキストを受け取り、URL部分をリンクに変換して表示
   - XSS対策を実装
3. 適用箇所:
   - `MemoEditor.jsx` - 詳細表示のテキスト
   - `SearchResults.jsx` - 検索結果のメモテキスト
   - （オプション）`MemoCard.jsx` - カード表示（短縮表示のため優先度低）

**テスト**:
- URL検出のテストケース（各種URL形式）
- XSS対策のテスト
- 長いテキストでのパフォーマンステスト

### Phase 2: テキスト選択・コピー機能

**実装内容**:
1. `MemoCard.jsx`の修正
   - テキスト部分に`userSelect: 'text'`を設定
   - カードクリックイベントとの競合回避
   - スワイプジェスチャとの競合回避
2. `MemoEditor.jsx`の修正
   - テキスト選択を明示的に有効化
   - コピー機能の追加（オプション）
3. `SearchResults.jsx`の修正
   - メモテキストの選択を有効化

**テスト**:
- テキスト選択の動作確認
- カードクリックとの競合回避の確認
- スワイプジェスチャとの競合回避の確認

---

## ⚠️ 注意事項

### セキュリティ
- URLリンク化時は必ず`rel="noopener noreferrer"`を設定
- XSS対策: `dangerouslySetInnerHTML`は使用しない
- URL検証: 不正なURLの検出と処理

### UX
- カード全体のクリック機能を維持
- テキスト選択とクリックの競合を適切に処理
- モバイルでのスワイプジェスチャとの競合回避

### パフォーマンス
- 長いテキストでのURL検出処理の最適化
- 大量のメモ表示時のパフォーマンス影響の確認

---

## 📝 実装チェックリスト

### Phase 1: URLリンク化
- [ ] `src/utils/textUtils.js`の作成
  - [ ] URL検出関数の実装
  - [ ] リンク化関数の実装
  - [ ] ユニットテストの作成
- [ ] `src/components/LinkifiedText.jsx`の作成
  - [ ] コンポーネントの実装
  - [ ] XSS対策の実装
  - [ ] ユニットテストの作成
- [ ] `MemoEditor.jsx`への適用
- [ ] `SearchResults.jsx`への適用
- [ ] 動作確認

### Phase 2: テキスト選択・コピー
- [ ] `MemoCard.jsx`の修正
  - [ ] `userSelect: 'text'`の設定
  - [ ] クリックイベントとの競合回避
  - [ ] スワイプジェスチャとの競合回避
- [ ] `MemoEditor.jsx`の修正
  - [ ] テキスト選択の明示的有効化
- [ ] `SearchResults.jsx`の修正
- [ ] 動作確認（PC・モバイル）

---

## 🎨 UI/UX設計

### URLリンクのスタイル
- デフォルトのリンクスタイル（MUIテーマに準拠）
- ホバー時の視覚的フィードバック
- アクセシビリティ: キーボードナビゲーション対応

### テキスト選択の視覚的フィードバック
- ブラウザ標準の選択ハイライト
- 選択中のカーソル表示

---

## 📊 期待される効果

1. **ユーザビリティ向上**:
   - URLをクリックして直接アクセス可能
   - テキストをコピーして他のアプリで利用可能

2. **機能性向上**:
   - メモ内のURLを有効活用
   - テキストの再利用性向上

3. **アクセシビリティ向上**:
   - テキスト選択による情報アクセスの改善

---

## 🔄 次のステップ

1. **設計確認**: この設計方針の確認と承認
2. **Phase 1実装**: URLリンク化機能の実装
3. **Phase 2実装**: テキスト選択・コピー機能の実装
4. **テスト**: 包括的なテストの実施
5. **動作確認**: PC・モバイルでの動作確認

---

**作成日**: 2026年1月17日  
**作成者**: AI Assistant  
**ステータス**: 設計検討中
