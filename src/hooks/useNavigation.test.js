import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigation } from './useNavigation';

// useNavigate, useLocationをモック
const mockNavigate = jest.fn();
const mockLocation = {
  pathname: '/book/123',
  state: null,
  key: 'test-key',
  search: '',
  hash: ''
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const wrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/book/123']}>
    {children}
  </MemoryRouter>
);

describe('useNavigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocation.state = null;
  });

  describe('handleBack', () => {
    it('location.stateにreturnPathとsearchStateがない場合は通常の戻る', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('location.stateにreturnPathとsearchStateがある場合はstateを復元して戻る', () => {
      mockLocation.state = {
        returnPath: '/tags',
        searchState: { query: 'test', results: [] }
      };

      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/tags', {
        state: { restoreSearch: { query: 'test', results: [] } }
      });
    });

    it('location.stateにsearchStateがない場合は通常の戻る', () => {
      mockLocation.state = {
        returnPath: '/tags'
      };

      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('location.stateにreturnPathがない場合は通常の戻る', () => {
      mockLocation.state = {
        searchState: { query: 'test', results: [] }
      };

      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('handleForward', () => {
    it('navigate(1)を呼び出す', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      act(() => {
        result.current.handleForward();
      });

      expect(mockNavigate).toHaveBeenCalledWith(1);
    });
  });

  describe('location', () => {
    it('現在のlocationを返す', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });

      expect(result.current.location).toEqual(mockLocation);
    });
  });
});
