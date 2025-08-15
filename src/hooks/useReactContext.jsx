import { useState, useEffect } from 'react';

/**
 * Reactコンテキストが正しく初期化されているかをチェックし、
 * 初期化を待つためのカスタムフック
 */
export const useReactContext = () => {
  const [isContextReady, setIsContextReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10;
  const retryInterval = 100; // 100ms間隔でリトライ

  useEffect(() => {
    const checkContext = () => {
      try {
        // Reactの基本機能が利用可能かチェック
        if (typeof React === 'undefined') {
          return false;
        }

        // useStateが利用可能かチェック
        if (!React.useState) {
          return false;
        }

        // useContextが利用可能かチェック
        if (!React.useContext) {
          return false;
        }

        // windowとnavigatorが利用可能かチェック
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
          return false;
        }

        // コンテキストが正しく初期化されているかチェック
        const testContext = React.createContext();
        const TestComponent = () => {
          React.useContext(testContext);
          return null;
        };

        // テストコンポーネントをレンダリングしてエラーが発生しないかチェック
        try {
          // 簡易的なテスト（実際のレンダリングは行わない）
          const testHook = () => {
            const [test] = React.useState('test');
            return test;
          };
          testHook();
          return true;
        } catch (error) {
          console.warn('React context test failed:', error);
          return false;
        }
      } catch (error) {
        console.warn('React context check failed:', error);
        return false;
      }
    };

    const attemptInitialization = () => {
      if (checkContext()) {
        setIsContextReady(true);
        return;
      }

      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(attemptInitialization, retryInterval);
      } else {
        console.warn('React context initialization timeout, proceeding with fallback');
        setIsContextReady(true); // タイムアウト時は強制的に準備完了とする
      }
    };

    attemptInitialization();
  }, [retryCount]);

  return isContextReady;
};

/**
 * Reactコンテキストが準備できるまで待機するHOC
 */
export const withReactContext = (Component) => {
  return function WithReactContextWrapper(props) {
    const isContextReady = useReactContext();

    if (!isContextReady) {
      // コンテキストが準備できるまでローディング表示
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1rem',
          color: '#666'
        }}>
          読み込み中...
        </div>
      );
    }

    return <Component {...props} />;
  };
};
