import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import BookForm from './BookForm';
import { renderWithProviders, resetMocks } from '../test-utils';
import { createMockBook } from '../test-factories';

/**
 * BookForm コンポーネントのユニットテスト
 * 
 * テスト対象の機能:
 * - 書籍情報入力フォームの表示
 * - バリデーション（タイトル必須チェック）
 * - ISBNによる書籍情報の自動取得
 * - Firestoreへの書籍データ保存
 * - エラーハンドリング
 */

// axios モック
jest.mock('axios', () => ({
  get: jest.fn(),
}));

describe('BookForm', () => {
  const mockOnBookAdded = jest.fn();

  beforeEach(() => {
    resetMocks();
  });

  /**
   * テストケース: フォームフィールドの表示確認
   * 
   * 目的: 書籍追加フォームに必要なすべての入力フィールドが正しく表示されることを確認
   */
  it('renders form fields', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // 必須入力フィールドの存在確認
    expect(screen.getByTestId('book-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-author-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publisher-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-publishdate-input')).toBeInTheDocument();
    expect(screen.getByTestId('book-tags-input')).toBeInTheDocument();
    
    // 機能ボタンの存在確認
    expect(screen.getByTestId('book-fetch-button')).toBeInTheDocument();
    expect(screen.getByTestId('book-add-submit')).toBeInTheDocument();
  }, 10000);

  /**
   * テストケース: タイトル未入力時のバリデーション
   * 
   * 目的: タイトルが入力されていない状態でフォームを送信した場合、適切なエラーメッセージが表示されることを確認
   */
  it('shows error when submitting without title', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-form')).toBeInTheDocument();
    }, { timeout: 10000 });

    // フォームの送信をシミュレート（タイトル未入力）
    fireEvent.submit(screen.getByTestId('book-form'));

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-form-error')).toHaveTextContent('タイトルは必須です');
    }, { timeout: 10000 });
  }, 15000);

  /**
   * テストケース: ISBN未入力時のエラーハンドリング
   * 
   * 目的: ISBNが入力されていない状態で書籍情報取得ボタンをクリックした場合、適切なエラーメッセージが表示されることを確認
   */
  it('shows error when ISBN is empty and fetch button is clicked', async () => {
    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-fetch-button')).toBeInTheDocument();
    }, { timeout: 10000 });

    // ISBN未入力で書籍情報取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-form-error')).toHaveTextContent('ISBNを入力してください');
    }, { timeout: 10000 });
  }, 15000);

  /**
   * テストケース: 正常な書籍追加処理
   * 
   * 目的: 必要な情報が入力された状態でフォームを送信した場合、Firestoreにデータが保存され、コールバックが呼ばれることを確認
   */
  it('calls onBookAdded when form is submitted successfully', async () => {
    const { addDoc } = require('firebase/firestore');
    addDoc.mockResolvedValue({ id: 'test-book-id' });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-form')).toBeInTheDocument();
    }, { timeout: 10000 });

    // タイトルを入力
    const titleInput = screen.getByTestId('book-title-input');
    fireEvent.change(titleInput, { target: { value: 'テスト本' } });

    // フォームを送信
    fireEvent.submit(screen.getByTestId('book-form'));

    // Firestoreに正しいデータが保存されることを確認
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'テスト本',
          userId: 'test-user-id',
        })
      );
    });

    // onBookAddedコールバックが正しいIDで呼ばれることを確認
    expect(mockOnBookAdded).toHaveBeenCalledWith('test-book-id');
  }, 15000);

  /**
   * テストケース: ISBN取得機能（基本）
   * 
   * 目的: ISBN取得ボタンをクリックした場合、OpenBDから書籍情報が取得されることを確認
   */
  it('fetches book info by ISBN', async () => {
    const axios = require('axios');
    
    axios.get.mockResolvedValue({
      data: [{
        summary: {
          title: 'ISBN取得テスト本',
          author: 'ISBN取得テスト著者',
          publisher: 'テスト出版社',
          pubdate: '2024-01-01',
          cover: 'https://example.com/cover.jpg'
        }
      }]
    });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // ISBNを入力
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '978-4-1234-5678-9' } });

    // ISBN取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // 書籍情報が取得されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toHaveValue('ISBN取得テスト本');
      expect(screen.getByTestId('book-author-input')).toHaveValue('ISBN取得テスト著者');
    });
  }, 15000);

  /**
   * テストケース: ISBN取得機能（詳細）
   * 
   * 目的: ISBN取得時に出版社と出版日も正しく取得されることを確認
   */
  it('fetches complete book info including publisher and publish date', async () => {
    const axios = require('axios');
    const mockBookData = {
      summary: {
        title: 'テスト駆動開発',
        author: 'Kent Beck／著 和田卓人／訳',
        publisher: 'オーム社',
        pubdate: '2017-08-25',
        cover: 'https://cover.openbd.jp/9784873119485.jpg',
      },
    };
    axios.get.mockResolvedValue({ data: [mockBookData] });

    renderWithProviders(<BookForm onBookAdded={mockOnBookAdded} />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByTestId('book-isbn-input')).toBeInTheDocument();
    }, { timeout: 10000 });

    // ISBNを入力
    const isbnInput = screen.getByTestId('book-isbn-input');
    fireEvent.change(isbnInput, { target: { value: '9784873119485' } });

    // ISBN取得ボタンをクリック
    const fetchButton = screen.getByTestId('book-fetch-button');
    fireEvent.click(fetchButton);

    // 全ての書籍情報が取得されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('book-title-input')).toHaveValue('テスト駆動開発');
      expect(screen.getByTestId('book-author-input')).toHaveValue('Kent Beck／著 和田卓人／訳');
      expect(screen.getByTestId('book-publisher-input')).toHaveValue('オーム社');
      expect(screen.getByTestId('book-publishdate-input')).toHaveValue('2017-08-25');
    });

    // openBD APIが正しいURLで呼ばれることを確認
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.openbd.jp/v1/get?isbn=9784873119485'
    );
  }, 15000);
}); 