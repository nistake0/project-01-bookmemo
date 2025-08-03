import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TagSearchField from './TagSearchField';

// Material-UIテーマの設定
const theme = createTheme();

// テスト用のラッパーコンポーネント
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// モック関数
const mockOnTagsChange = jest.fn();

// useAuthとuseTagHistoryのモック
jest.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false
  })
}));

jest.mock('../../hooks/useTagHistory', () => ({
  useTagHistory: () => ({
    tagOptions: ['小説', '名作', '技術書', 'ビジネス'],
    loading: false,
    fetchTagHistory: jest.fn()
  })
}));

describe('TagSearchField', () => {
  beforeEach(() => {
    mockOnTagsChange.mockClear();
  });

  describe('基本的なレンダリング', () => {
    test('コンポーネントが正しくレンダリングされる', () => {
      renderWithTheme(
        <TagSearchField selectedTags={[]} onTagsChange={mockOnTagsChange} />
      );

      expect(screen.getByText('タグ検索')).toBeInTheDocument();
      expect(screen.getByTestId('tag-autocomplete')).toBeInTheDocument();
      expect(screen.getByTestId('tag-search-input')).toBeInTheDocument();
    });

    test('デフォルト値でレンダリングされる', () => {
      renderWithTheme(
        <TagSearchField onTagsChange={mockOnTagsChange} />
      );

      expect(screen.getByText('タグ検索')).toBeInTheDocument();
      expect(screen.getByTestId('tag-autocomplete')).toBeInTheDocument();
    });

    test('選択されたタグが表示される', () => {
      const selectedTags = ['小説', '名作'];
      renderWithTheme(
        <TagSearchField selectedTags={selectedTags} onTagsChange={mockOnTagsChange} />
      );

      expect(screen.getByTestId('selected-tag-小説')).toBeInTheDocument();
      expect(screen.getByTestId('selected-tag-名作')).toBeInTheDocument();
    });
  });

  describe('説明テキストの表示', () => {
    test('タグが選択されていない場合の説明テキスト', () => {
      renderWithTheme(
        <TagSearchField selectedTags={[]} onTagsChange={mockOnTagsChange} />
      );

      expect(screen.getByText('タグを選択すると、そのタグを持つ本やメモを検索できます')).toBeInTheDocument();
    });

    test('タグが選択されている場合の説明テキスト', () => {
      const selectedTags = ['小説', '名作'];
      renderWithTheme(
        <TagSearchField selectedTags={selectedTags} onTagsChange={mockOnTagsChange} />
      );

      expect(screen.getByText('選択されたタグ: 小説, 名作')).toBeInTheDocument();
    });
  });

  describe('タグの追加・削除', () => {
    test('タグを削除できる', async () => {
      const selectedTags = ['小説', '名作'];
      renderWithTheme(
        <TagSearchField selectedTags={selectedTags} onTagsChange={mockOnTagsChange} />
      );

      const deleteButton = screen.getByTestId('selected-tag-小説').querySelector('[data-testid="CancelIcon"]');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnTagsChange).toHaveBeenCalledWith(['名作']);
      });
    });
  });

  describe('Autocomplete機能', () => {
    test('タグオプションが表示される', () => {
      renderWithTheme(
        <TagSearchField selectedTags={[]} onTagsChange={mockOnTagsChange} />
      );

      const input = screen.getByTestId('tag-search-input');
      fireEvent.focus(input);

      // タグオプションが利用可能
      expect(screen.getByTestId('tag-autocomplete')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    test('onTagsChangeが未定義でもエラーが発生しない', () => {
      expect(() => {
        renderWithTheme(
          <TagSearchField selectedTags={[]} />
        );
      }).not.toThrow();
    });

    test('selectedTagsが未定義でもデフォルト値で動作する', () => {
      expect(() => {
        renderWithTheme(
          <TagSearchField onTagsChange={mockOnTagsChange} />
        );
      }).not.toThrow();

      expect(screen.getByTestId('tag-autocomplete')).toBeInTheDocument();
    });
  });

  describe('タグの種類による動作', () => {
    test('bookタイプでレンダリングされる', () => {
      renderWithTheme(
        <TagSearchField type="book" selectedTags={[]} onTagsChange={mockOnTagsChange} />
      );

      expect(screen.getByText('タグ検索')).toBeInTheDocument();
    });

    test('memoタイプでレンダリングされる', () => {
      renderWithTheme(
        <TagSearchField type="memo" selectedTags={[]} onTagsChange={mockOnTagsChange} />
      );

      expect(screen.getByText('タグ検索')).toBeInTheDocument();
    });
  });
}); 