import { useState } from 'react';

/**
 * 外部検索URLを生成する
 * @param {string} query - 検索クエリ
 * @param {string} service - 検索サービス（'google' | 'amazon' | 'rakuten'）
 * @returns {string} 検索URL
 */
const createSearchUrl = (query, service = 'google') => {
  const encodedQuery = encodeURIComponent(query);
  const urls = {
    google: `https://www.google.com/search?q=${encodedQuery}`,
    amazon: `https://www.amazon.co.jp/s?k=${encodedQuery}`,
    rakuten: `https://books.rakuten.co.jp/rb/Search?qt=${encodedQuery}`,
  };
  return urls[service] || urls.google;
};

/**
 * テキストコピー・外部検索用のフック
 * BookInfo.jsxで使用
 * 
 * @param {Object} options - オプション
 * @param {Function} options.showSnackbar - Snackbar表示関数（オプション）
 * @param {boolean} options.enableExternalSearch - 外部検索機能の有効/無効（デフォルト: true）
 * @returns {Object} フックの戻り値
 */
export function useTextCopyMenu(options = {}) {
  const {
    showSnackbar,
    enableExternalSearch = true,
  } = options;
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  
  /**
   * 通常のクリック/タップでメニューを表示
   */
  const handleClick = (event, text, book = null) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('[useTextCopyMenu] handleClick called', { text, currentTarget: event.currentTarget });
    setAnchorEl(event.currentTarget);
    setSelectedText(text);
    setSelectedBook(book);
  };
  
  /**
   * 右クリック/長押し（コンテキストメニュー）でメニューを表示
   */
  const handleContextMenu = (event, text, book = null) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('[useTextCopyMenu] handleContextMenu called', { text, currentTarget: event.currentTarget });
    setAnchorEl(event.currentTarget);
    setSelectedText(text);
    setSelectedBook(book);
  };
  
  /**
   * メニューを閉じる
   */
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  /**
   * テキストをコピー
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      if (showSnackbar) {
        showSnackbar('コピーしました', 'success');
      }
      handleClose();
    } catch (err) {
      console.error('コピーに失敗しました:', err);
      if (showSnackbar) {
        showSnackbar('コピーに失敗しました', 'error');
      }
    }
  };
  
  /**
   * 外部検索を実行
   * @param {string} service - 検索サービス（'google' | 'amazon' | 'rakuten'）
   */
  const handleExternalSearch = (service) => {
    if (!enableExternalSearch) return;
    
    let query = selectedText;
    // 書籍情報がある場合、タイトルを選択したときはタイトル + 著者で検索（精度向上）
    if (selectedBook?.author && selectedText === selectedBook.title) {
      query = `${selectedText} ${selectedBook.author}`;
    }
    const url = createSearchUrl(query, service);
    window.open(url, '_blank', 'noopener,noreferrer');
    handleClose();
  };
  
  return {
    handleClick,
    handleContextMenu,
    menuProps: {
      anchorEl,
      open: Boolean(anchorEl),
      onClose: handleClose,
    },
    handleCopy,
    handleExternalSearch,
    selectedText,
  };
}
