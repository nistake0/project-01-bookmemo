import React from 'react';
import { useSwipeable } from 'react-swipeable';

export default function MyPage() {
  const handlers = useSwipeable({
    onSwipedLeft: () => alert('左スワイプ!'),
    onSwipedRight: () => alert('右スワイプ!'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>react-swipeable サンプル</h2>
      <div
        {...handlers}
        style={{
          background: '#fff',
          border: '1px solid #ccc',
          padding: 48,
          fontSize: 18,
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        このエリアを左右にスワイプ（またはドラッグ）してみてください
      </div>
    </div>
  );
} 