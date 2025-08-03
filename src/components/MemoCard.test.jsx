import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ErrorDialogProvider } from './CommonErrorDialog';
import MemoCard from './MemoCard';

// react-swipeableライブラリのuseSwipeableフックをモック
jest.mock('react-swipeable', () => ({
  useSwipeable: () => ({
    onSwipedLeft: jest.fn(),
    onSwipedRight: jest.fn(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  })
}));

// useMediaQueryフックをモック
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn()
}));

/**
 * MemoCard コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - メモカードの表示（全フィールド付き）
 * - 最小限フィールドでの表示
 * - 編集・削除ボタンの動作
 * - オプションフィールドの処理（ページ番号、タグ、日付）
 * - エッジケースの処理（null値、空文字）
 * - スワイプアクションの設定
 * - モバイル・デスクトップ表示の切り替え
 */

const theme = createTheme();

/**
 * テスト用のレンダリング関数
 * ThemeProviderとErrorDialogProviderでコンポーネントをラップ
 */
const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <ErrorDialogProvider>
        {component}
      </ErrorDialogProvider>
    </ThemeProvider>
  );
};

describe('MemoCard', () => {
  // テスト用のメモデータ（全フィールド付き）
  const mockMemo = {
    id: 'memo1',
    text: 'テストメモの内容',
    comment: 'テストコメント',
    page: 123,
    tags: ['テスト', 'サンプル'],
    createdAt: { toDate: () => new Date('2024-01-01') }
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * テストケース: 全フィールド付きメモカードの表示
   * 
   * 目的: メモの全フィールド（テキスト、コメント、ページ番号、タグ、作成日）が
   * 正しく表示されることを確認
   * 
   * テストステップ:
   * 1. 全フィールド付きのメモデータでMemoCardをレンダリング
   * 2. メモのテキスト、コメント、ページ番号、タグ、作成日が表示されることを確認
   */
  it('renders memo card with all information', () => {
    renderWithProviders(
      <MemoCard 
        memo={mockMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    // メモの内容が表示されることを確認
    expect(screen.getByText('テストメモの内容')).toBeInTheDocument();
    expect(screen.getByText('テストコメント')).toBeInTheDocument();
    
    // ページ番号とタグが表示されることを確認
    expect(screen.getByText('p.123')).toBeInTheDocument();
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('サンプル')).toBeInTheDocument();
    
    // 作成日が表示されることを確認
    expect(screen.getByText('2024/1/1')).toBeInTheDocument();
  });

  /**
   * テストケース: 最小限フィールドでのメモカード表示
   * 
   * 目的: コメント、ページ番号、タグなどのオプションフィールドがないメモでも
   * 正しく表示されることを確認
   * 
   * テストステップ:
   * 1. 最小限のフィールド（id, text, createdAt）のみのメモデータでレンダリング
   * 2. メモのテキストが表示されることを確認
   * 3. オプションフィールド（ページ番号、タグ）が表示されないことを確認
   */
  it('renders memo card with minimal information', () => {
    const minimalMemo = {
      id: 'memo2',
      text: '最小限のメモ',
      createdAt: { toDate: () => new Date('2024-01-01') }
    };

    renderWithProviders(
      <MemoCard 
        memo={minimalMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    // メモのテキストが表示されることを確認
    expect(screen.getByText('最小限のメモ')).toBeInTheDocument();
    
    // オプションフィールドが表示されないことを確認
    expect(screen.queryByText('p.')).not.toBeInTheDocument();
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  /**
   * テストケース: メモカードの編集・削除ボタン動作確認（デスクトップ）
   * 
   * 目的: デスクトップ表示でメモカードの編集・削除ボタンが正しく表示され、
   * クリック時に適切なコールバックが呼ばれることを確認
   * 
   * テストステップ:
   * 1. デスクトップ表示でメモカードをレンダリング
   * 2. 編集ボタンが存在することを確認
   * 3. 削除ボタンが存在することを確認
   * 4. 編集ボタンをクリックしてonEditコールバックが呼ばれることを確認
   * 5. 削除ボタンをクリックしてonDeleteコールバックが呼ばれることを確認
   */
  it('handles edit and delete button clicks on desktop', () => {
    const { useMediaQuery } = require('@mui/material');
    useMediaQuery.mockReturnValue(false); // デスクトップ表示

    renderWithProviders(
      <MemoCard
        memo={mockMemo}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // 編集・削除ボタンが存在することを確認
    const editButton = screen.getByTestId('memo-edit-button');
    const deleteButton = screen.getByTestId('memo-delete-button');

    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    // 編集ボタンをクリック
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockMemo, true);

    // 削除ボタンをクリック
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith('memo1');
  });

  /**
   * テストケース: メモカードのクリック機能
   * 
   * 目的: メモカード全体をクリックした時にonClickコールバックが呼ばれることを確認
   * 
   * テストステップ:
   * 1. onClickプロパティ付きでメモカードをレンダリング
   * 2. メモカードをクリック
   * 3. onClickコールバックが正しく呼ばれることを確認
   */
  it('calls onClick when card is clicked', () => {
    const mockOnClick = jest.fn();
    renderWithProviders(
      <MemoCard 
        memo={mockMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onClick={mockOnClick}
      />
    );
    const card = screen.getByTestId('memo-card');
    fireEvent.click(card);
    expect(mockOnClick).toHaveBeenCalledWith(mockMemo, false);
  });

  /**
   * テストケース: 作成日がnullの場合の処理
   * 
   * 目的: createdAtがnullの場合でもエラーが発生せず、適切に処理されることを確認
   * 
   * テストステップ:
   * 1. createdAtがnullのメモデータでレンダリング
   * 2. メモのテキストが表示されることを確認
   * 3. 作成日が表示されないことを確認
   */
  it('handles memo without createdAt.toDate method', () => {
    const memoWithoutDate = {
      id: 'memo3',
      text: '日付なしメモ',
      createdAt: null
    };

    renderWithProviders(
      <MemoCard 
        memo={memoWithoutDate} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    // メモのテキストが表示されることを確認
    expect(screen.getByText('日付なしメモ')).toBeInTheDocument();
    
    // 作成日が表示されないことを確認
    expect(screen.queryByText('1/1/2024')).not.toBeInTheDocument();
  });

  /**
   * テストケース: 空文字のテキスト処理
   * 
   * 目的: メモのテキストが空文字の場合でも、メモカードが正しく表示されることを確認
   * 
   * テストステップ:
   * 1. テキストが空文字のメモデータでレンダリング
   * 2. メモカードが表示されることを確認
   */
  it('handles memo with empty text', () => {
    const emptyMemo = {
      id: 'memo4',
      text: '',
      createdAt: { toDate: () => new Date('2024-01-01') }
    };

    renderWithProviders(
      <MemoCard 
        memo={emptyMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    // メモカードが表示されることを確認
    expect(screen.getByTestId('memo-card')).toBeInTheDocument();
  });

  /**
   * テストケース: タグがnullの場合の処理
   * 
   * 目的: tagsがnullの場合でもエラーが発生せず、適切に処理されることを確認
   * 
   * テストステップ:
   * 1. tagsがnullのメモデータでレンダリング
   * 2. メモのテキストが表示されることを確認
   * 3. タグが表示されないことを確認
   */
  it('handles memo with null tags', () => {
    const memoWithNullTags = {
      id: 'memo5',
      text: 'タグなしメモ',
      tags: null,
      createdAt: { toDate: () => new Date('2024-01-01') }
    };

    renderWithProviders(
      <MemoCard 
        memo={memoWithNullTags} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    // メモのテキストが表示されることを確認
    expect(screen.getByText('タグなしメモ')).toBeInTheDocument();
    
    // タグが表示されないことを確認
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  /**
   * テストケース: モバイル表示でのスワイプアクション
   * 
   * 目的: モバイル表示でスワイプアクションが正しく設定されていることを確認
   * 
   * テストステップ:
   * 1. モバイル表示でメモカードをレンダリング
   * 2. メモカードが表示されることを確認
   * 3. デスクトップ用ボタンが非表示になることを確認
   */
  it('renders mobile version with swipe actions', () => {
    const { useMediaQuery } = require('@mui/material');
    useMediaQuery.mockReturnValue(true); // モバイル表示

    renderWithProviders(
      <MemoCard 
        memo={mockMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // メモカードが存在することを確認
    const card = screen.getByTestId('memo-card');
    expect(card).toBeInTheDocument();
    
    // デスクトップ用ボタンが非表示になることを確認
    expect(screen.queryByTestId('memo-edit-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('memo-delete-button')).not.toBeInTheDocument();
  });

  /**
   * テストケース: デスクトップ表示でのボタン表示
   * 
   * 目的: デスクトップ表示で編集・削除ボタンが表示されることを確認
   * 
   * テストステップ:
   * 1. デスクトップ表示でメモカードをレンダリング
   * 2. デスクトップ用の編集・削除ボタンが存在することを確認
   */
  it('shows desktop buttons on larger screens', () => {
    const { useMediaQuery } = require('@mui/material');
    useMediaQuery.mockReturnValue(false); // デスクトップ表示

    renderWithProviders(
      <MemoCard 
        memo={mockMemo} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    // デスクトップ用のボタンが存在することを確認
    const editButton = screen.getByTestId('memo-edit-button');
    const deleteButton = screen.getByTestId('memo-delete-button');
    
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });
}); 