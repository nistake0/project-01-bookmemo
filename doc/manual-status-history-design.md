# 手作業ステータス履歴追加機能 設計ドキュメント

## 1. 概要

### 目的
既存の書籍（既に読了・読書中）に対して、過去の日時でステータス変更履歴を手動で追加する機能を実装する。

### 背景
- ステータス履歴機能は2025年9月20日に実装完了
- 既存の書籍には履歴データが存在しない
- ユーザーが過去の読書履歴を記録したい需要がある

### 要件
- 書籍詳細ページから履歴を手動追加
- 日時を自由に指定可能
- 既存の履歴と整合性を保つ
- ユーザーが誤操作しにくいUI
- 既存システムへの影響を最小限に抑制

## 2. 機能設計

### 2.1 機能範囲

#### Phase 1: 履歴追加機能（優先実装）
- ✅ 手動履歴追加ダイアログ
- ✅ 日時・ステータス選択機能
- ✅ 書籍詳細ページトップに最新履歴表示
- ✅ 履歴タブ内に追加ボタン

#### Phase 2: 編集・削除機能（将来実装）
- ⏳ 履歴編集機能
- ⏳ 履歴削除機能
- ⏳ 一括操作機能

### 2.2 UI/UX設計

#### 書籍詳細ページの構成
```
[書籍詳細ページ]
┌─────────────────────────────────┐
│ 📖 書籍情報                     │
│ タイトル: サンプル本            │
│ 著者: 著者名                    │
│                                 │
│ 📊 最新ステータス履歴 ← 新規追加 │
│ ● 2024/09/20 読書中 ← 積読      │
│                                 │
│ [メモ一覧] [ステータス履歴]     │
└─────────────────────────────────┘
```

#### ステータス履歴タブの構成
```
[ステータス履歴タブ]
┌─────────────────────────────────┐
│ 📊 ステータス履歴                │
│                                 │
│ [履歴追加] ← 新規追加           │
│                                 │
│ ● 2024/09/20 読書中 ← 積読      │
│ ● 2024/09/15 積読               │
└─────────────────────────────────┘
```

#### 履歴追加ダイアログの構成
```
[履歴追加ダイアログ]
┌─────────────────────────────────┐
│ 📝 ステータス履歴を追加          │
│                                 │
│ 日時: [2024/09/15] [14:30]      │
│ ステータス: [読書中 ▼]          │
│ 前のステータス: [積読 ▼]        │
│                                 │
│ [保存] [キャンセル]             │
└─────────────────────────────────┘
```

## 3. 技術設計

### 3.1 コンポーネント設計

#### 新規コンポーネント
```javascript
// 1. 最新履歴表示（書籍詳細ページトップ用）
<LatestStatusHistory bookId={bookId} />

// 2. 履歴追加ダイアログ
<ManualHistoryAddDialog 
  open={dialogOpen} 
  onClose={handleClose} 
  onAdd={handleAdd} 
  bookId={bookId}
/>
```

#### 既存コンポーネントの拡張
```javascript
// StatusHistoryTimeline に履歴追加ボタンを追加
<StatusHistoryTimeline bookId={bookId} showAddButton={true} />
```

### 3.2 フック設計

#### useBookStatusHistory の拡張
```javascript
export const useBookStatusHistory = (bookId) => {
  // 既存機能（変更なし）
  const { history, loading, error } = fetchStatusHistory(bookId);
  const { addStatusHistory } = addStatusHistory(bookId);
  
  // 新機能追加
  const { addManualStatusHistory } = addManualStatusHistory(bookId);
  const latestHistory = history.length > 0 ? history[0] : null;
  
  return {
    // 既存API（後方互換性維持）
    history,
    loading,
    error,
    addStatusHistory,
    
    // 新API
    latestHistory,
    addManualStatusHistory
  };
};
```

### 3.3 データ構造

#### 履歴データ（既存構造を維持）
```javascript
{
  id: "自動生成ID",
  status: "読書中",
  previousStatus: "積読",
  changedAt: "2024-09-20T10:30:00Z",
  userId: "ユーザーID"
}
```

#### 手動追加時の処理
```javascript
const addManualStatusHistory = async (date, status, previousStatus) => {
  // 1. バリデーション
  if (!isValidDate(date) || !isValidStatus(status)) {
    throw new Error('Invalid input');
  }
  
  // 2. 履歴追加
  const newHistory = {
    status,
    previousStatus,
    changedAt: date,
    userId: user.uid
  };
  
  // 3. 履歴リストを日時順で再ソート
  const updatedHistory = [...history, newHistory]
    .sort((a, b) => b.changedAt.toDate() - a.changedAt.toDate());
  
  return updatedHistory;
};
```

## 4. 実装計画

### 4.1 実装順序

#### Step 1: フック拡張
- `useBookStatusHistory` に `addManualStatusHistory` 関数追加
- `latestHistory` 取得機能追加

#### Step 2: コンポーネント作成
- `LatestStatusHistory` コンポーネント作成
- `ManualHistoryAddDialog` コンポーネント作成

#### Step 3: 既存コンポーネント更新
- `StatusHistoryTimeline` に履歴追加ボタン追加
- `BookDetail` ページに最新履歴表示追加

#### Step 4: 統合テスト
- 既存機能の動作確認
- 新機能の動作確認
- エラーハンドリングの確認

### 4.2 テスト戦略

#### ユニットテスト
- `useBookStatusHistory` フックの新機能テスト
- `LatestStatusHistory` コンポーネントテスト
- `ManualHistoryAddDialog` コンポーネントテスト

#### 統合テスト
- 書籍詳細ページでの新機能動作確認
- 既存機能への影響確認
- エラーケースの動作確認

#### 既存テストの維持
- 既存の339テストが全て通過することを確認
- 新機能追加による既存機能への影響を防止

## 5. リスク管理

### 5.1 技術的リスク

#### 低リスク
- **既存APIの変更なし**: 後方互換性を維持
- **段階的実装**: 既存機能への影響を最小化
- **既存データ構造維持**: データ整合性を保持

#### 対策
- 既存テストの継続実行
- 段階的な機能追加
- ロールバック計画の準備

### 5.2 ユーザビリティリスク

#### 考慮事項
- 新機能の学習コスト
- 誤操作の可能性
- UIの複雑化

#### 対策
- 直感的なUI設計
- 適切なバリデーション
- 段階的な機能公開

## 6. 成功指標

### 6.1 機能指標
- ✅ 手動履歴追加が正常に動作
- ✅ 最新履歴が書籍詳細ページに表示
- ✅ 既存機能に影響なし
- ✅ 全テストが通過

### 6.2 ユーザビリティ指標
- ✅ 直感的な操作フロー
- ✅ 適切なエラーメッセージ
- ✅ レスポンシブデザイン対応

## 7. 将来の拡張

### 7.1 Phase 2機能（編集・削除）
- 履歴編集ダイアログ
- 履歴削除確認ダイアログ
- 一括操作機能

### 7.2 追加機能検討
- 履歴のエクスポート機能
- 履歴統計の表示
- 履歴のバックアップ機能

## 8. 実装開始準備

### 8.1 前提条件
- 既存のステータス履歴機能が正常動作
- 全テスト（339テスト）が通過
- 本番環境での動作確認済み

### 8.2 実装環境
- 開発環境: `project-01-bookmemo-2`
- 本番環境: `project-01-bookmemo-prod`
- テスト環境: Jest + React Testing Library

### 8.3 実装開始
この設計に基づいて実装を開始する。
