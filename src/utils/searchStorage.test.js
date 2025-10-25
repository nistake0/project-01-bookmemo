import { saveSearchResults, restoreSearchResults, clearSearchResults } from './searchStorage';

// sessionStorageのモック
let mockStorage = {};
const mockSessionStorage = {
  getItem: jest.fn((key) => mockStorage[key] || null),
  setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
  removeItem: jest.fn((key) => { delete mockStorage[key]; }),
  clear: jest.fn(() => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); })
};

beforeAll(() => {
  Object.defineProperty(global, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });
});

describe('searchStorage', () => {
  beforeEach(() => {
    mockStorage = {};
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveSearchResults', () => {
    it('検索結果をsessionStorageに保存する', () => {
      const results = [
        { id: '1', type: 'book', title: 'テスト本' },
        { id: '2', type: 'memo', text: 'テストメモ' }
      ];

      saveSearchResults(results);

      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(2);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'lastSearchResults',
        JSON.stringify(results)
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'lastSearchTimestamp',
        expect.any(String)
      );
    });

    it('空の配列も保存できる', () => {
      const results = [];
      saveSearchResults(results);
      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('restoreSearchResults', () => {
    it('sessionStorageから検索結果を復元する', () => {
      const results = [
        { id: '1', type: 'book', title: 'テスト本' }
      ];
      const now = Date.now().toString();

      mockStorage['lastSearchResults'] = JSON.stringify(results);
      mockStorage['lastSearchTimestamp'] = now;

      const restored = restoreSearchResults();

      expect(restored).toEqual(results);
    });

    it('データが存在しない場合はnullを返す', () => {
      const restored = restoreSearchResults();
      expect(restored).toBeNull();
    });

    it('タイムスタンプがない場合はnullを返す', () => {
      mockStorage['lastSearchResults'] = JSON.stringify([{ id: '1' }]);

      const restored = restoreSearchResults();

      expect(restored).toBeNull();
    });

    it('30分以上経過したデータは無視し、クリアする', () => {
      const results = [{ id: '1', type: 'book' }];
      const oldTimestamp = (Date.now() - 31 * 60 * 1000).toString(); // 31分前

      mockStorage['lastSearchResults'] = JSON.stringify(results);
      mockStorage['lastSearchTimestamp'] = oldTimestamp;

      const restored = restoreSearchResults();

      expect(restored).toBeNull();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('lastSearchResults');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('lastSearchTimestamp');
    });

    it('JSONのパースエラーを処理する', () => {
      mockStorage['lastSearchResults'] = 'invalid json';
      mockStorage['lastSearchTimestamp'] = Date.now().toString();

      const restored = restoreSearchResults();

      expect(restored).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('clearSearchResults', () => {
    it('sessionStorageから検索結果をクリアする', () => {
      mockStorage['lastSearchResults'] = '[]';
      mockStorage['lastSearchTimestamp'] = '123';

      clearSearchResults();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('lastSearchResults');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('lastSearchTimestamp');
    });
  });
});
