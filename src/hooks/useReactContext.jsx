import React from 'react';

/**
 * Reactコンテキストが正しく初期化されているかをチェックする関数
 */
const checkReactContext = () => {
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

    // Reactの基本機能が利用可能であることを確認
    return true;
  } catch (error) {
    console.warn('React context check failed:', error);
    return false;
  }
};

/**
 * Reactコンテキストが準備できるまで待機するHOC
 */
export const withReactContext = (Component) => {
  return function WithReactContextWrapper(props) {
    const [isContextReady, setIsContextReady] = React.useState(false);
    const [retryCount, setRetryCount] = React.useState(0);
    const maxRetries = 20; // リトライ回数を増やす
    const retryInterval = 50; // 間隔を短くする

    React.useEffect(() => {
      const attemptInitialization = () => {
        if (checkReactContext()) {
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
