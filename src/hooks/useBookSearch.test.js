import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookSearch } from './useBookSearch';
import { useAuth } from '../auth/AuthProvider';
import { ErrorDialogContext } from '../components/CommonErrorDialog';
import axios from 'axios';

// モック設定
jest.mock('../firebase', () => ({
  db: {},
}));

jest.mock('../auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('axios');

describe('useBookSearch', () => {
  const mockUser = { uid: 'test-user-id' };
  const mockSetGlobalError = jest.fn();

  // Provider ラッパー
  const wrapper = ({ children }) => (
    <ErrorDialogContext.Provider value={{ setGlobalError: mockSetGlobalError }}>
      {children}
    </ErrorDialogContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトモック設定
    useAuth.mockReturnValue({ user: mockUser });
  });

  const renderUseBookSearch = () => {
    return renderHook(() => useBookSearch(), { wrapper });
  };

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderUseBookSearch();

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('');
      expect(result.current.searchPerformed).toBe(false);
      expect(typeof result.current.searchBookByIsbn).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.clearSearch).toBe('function');
    });
  });

  describe('searchBookByIsbn関数', () => {
    it('OpenBD APIで書籍情報を正常に取得できる', async () => {
      const { result } = renderUseBookSearch();

      const mockOpenbdResponse = {
        data: [{
          summary: {
            title: 'テスト本',
            author: 'テスト著者',
            publisher: 'テスト出版社',
            pubdate: '2024-01-01',
            cover: 'https://example.com/cover.jpg',
            subject: '小説',
            ndc: '913',
          }
        }]
      };

      axios.get.mockResolvedValueOnce(mockOpenbdResponse);

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchBookByIsbn('9784873119485');
      });

      expect(axios.get).toHaveBeenCalledWith('https://api.openbd.jp/v1/get?isbn=9784873119485');
      expect(searchResult).toEqual({
        isbn: '9784873119485',
        title: 'テスト本',
        author: 'テスト著者',
        publisher: 'テスト出版社',
        publishedDate: '2024-01-01',
        coverImageUrl: 'https://example.com/cover.jpg',
        tags: ['小説', '913'],
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.searchPerformed).toBe(true);
    });

    it('OpenBDで情報が取得できない場合、Google Books APIを呼び出す', async () => {
      const { result } = renderUseBookSearch();

      // OpenBD APIは空の結果を返す
      const mockOpenbdResponse = { data: [null] };
      // Google Books APIは結果を返す
      const mockGoogleResponse = {
        data: {
          items: [{
            volumeInfo: {
              title: 'Google Books テスト本',
              authors: ['Google著者'],
              publisher: 'Google出版社',
              publishedDate: '2024-02-01',
              imageLinks: {
                thumbnail: 'https://example.com/google-cover.jpg'
              },
              categories: ['Fiction', 'Technology']
            }
          }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockOpenbdResponse) // OpenBD
        .mockResolvedValueOnce(mockGoogleResponse); // Google Books

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchBookByIsbn('9784873119485');
      });

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(axios.get).toHaveBeenNthCalledWith(1, 'https://api.openbd.jp/v1/get?isbn=9784873119485');
      expect(axios.get).toHaveBeenNthCalledWith(2, 'https://www.googleapis.com/books/v1/volumes?q=isbn:9784873119485');
      
      expect(searchResult).toEqual({
        isbn: '9784873119485',
        title: 'Google Books テスト本',
        author: 'Google著者',
        publisher: 'Google出版社',
        publishedDate: '2024-02-01',
        coverImageUrl: 'https://example.com/google-cover.jpg',
        tags: ['Fiction', 'Technology'],
      });
    });

    it('ISBNが空の場合、エラーを設定する', async () => {
      const { result } = renderUseBookSearch();

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchBookByIsbn('');
      });

      expect(searchResult).toBeNull();
      expect(result.current.error).toBe('ISBNを入力してください');
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('OpenBD APIでエラーが発生した場合、エラー状態を設定する', async () => {
      const { result } = renderUseBookSearch();

      axios.get.mockRejectedValue(new Error('Network error'));

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchBookByIsbn('9784873119485');
      });

      expect(searchResult).toBeNull();
      expect(result.current.error).toBe('書籍情報の取得に失敗しました');
      expect(mockSetGlobalError).toHaveBeenCalledWith('書籍情報の取得に失敗しました');
      expect(result.current.loading).toBe(false);
    });

    it('書籍情報が見つからない場合、エラー状態を設定する', async () => {
      const { result } = renderUseBookSearch();

      // OpenBD APIは空の結果を返す
      const mockOpenbdResponse = { data: [null] };
      // Google Books APIも空の結果を返す
      const mockGoogleResponse = { data: { items: [] } };

      axios.get
        .mockResolvedValueOnce(mockOpenbdResponse)
        .mockResolvedValueOnce(mockGoogleResponse);

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchBookByIsbn('9784873119485');
      });

      expect(searchResult).toBeNull();
      expect(mockSetGlobalError).toHaveBeenCalledWith('書籍情報が見つかりませんでした');
      expect(result.current.loading).toBe(false);
    });

    it('Google Books APIでエラーが発生してもOpenBDの結果を返す', async () => {
      const { result } = renderUseBookSearch();

      // OpenBD APIは結果を返す
      const mockOpenbdResponse = {
        data: [{
          summary: {
            title: 'OpenBD テスト本',
            author: 'OpenBD著者',
            publisher: 'OpenBD出版社',
            pubdate: '2024-01-01',
            cover: 'https://example.com/openbd-cover.jpg',
          }
        }]
      };

      axios.get
        .mockResolvedValueOnce(mockOpenbdResponse) // OpenBD成功
        .mockRejectedValueOnce(new Error('Google API error')); // Google Books失敗

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchBookByIsbn('9784873119485');
      });

      expect(searchResult).toEqual({
        isbn: '9784873119485',
        title: 'OpenBD テスト本',
        author: 'OpenBD著者',
        publisher: 'OpenBD出版社',
        publishedDate: '2024-01-01',
        coverImageUrl: 'https://example.com/openbd-cover.jpg',
        tags: [],
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe('clearError関数', () => {
    it('エラーをクリアできる', async () => {
      const { result } = renderUseBookSearch();

      // エラーを設定
      await act(async () => {
        await result.current.searchBookByIsbn('');
      });

      expect(result.current.error).toBe('ISBNを入力してください');

      // エラーをクリア
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('clearSearch関数', () => {
    it('検索状態をクリアできる', async () => {
      const { result } = renderUseBookSearch();

      // 検索を実行
      const mockResponse = {
        data: [{
          summary: {
            title: 'テスト本',
          }
        }]
      };
      axios.get.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.searchBookByIsbn('9784873119485');
      });

      expect(result.current.searchPerformed).toBe(true);

      // 検索状態をクリア
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchPerformed).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('ローディング状態', () => {
    it('検索中はローディング状態がtrueになる', async () => {
      const { result } = renderUseBookSearch();

      // 遅延するレスポンスを設定
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      axios.get.mockReturnValue(delayedPromise);

      // 検索を開始（非同期で実行）
      const searchPromise = result.current.searchBookByIsbn('9784873119485');

      // ローディング状態を確認
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // 検索完了
      resolvePromise({
        data: [{
          summary: {
            title: 'テスト本',
          }
        }]
      });

      await act(async () => {
        await searchPromise;
      });

      // 完了後はfalse
      expect(result.current.loading).toBe(false);
    });
  });
});
