const CACHE_NAME = 'bookmemo-v3';
const STATIC_CACHE = 'bookmemo-static-v3';
const DYNAMIC_CACHE = 'bookmemo-dynamic-v3';

// キャッシュする静的ファイル
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// フェッチ時の処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 開発環境の場合はキャッシュをスキップ
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // 静的ファイルのキャッシュ戦略（Cache First）
  if (isStaticFile(request)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((fetchResponse) => {
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return fetchResponse;
            });
        })
    );
    return;
  }

  // APIリクエストのキャッシュ戦略（Stale While Revalidate）
  if (isApiRequest(request)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              const fetchPromise = fetch(request)
                .then((networkResponse) => {
                  if (networkResponse.status === 200) {
                    cache.put(request, networkResponse.clone());
                  }
                  return networkResponse;
                })
                .catch(() => {
                  // ネットワークエラーの場合はキャッシュを返す
                  return cachedResponse;
                });

              return cachedResponse || fetchPromise;
            });
        })
    );
    return;
  }



  // SPAルーティングのフォールバック処理
  // ページリクエスト（HTML）の場合はindex.htmlを返す
  if (request.method === 'GET' && request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 404エラーの場合はindex.htmlを返す（SPAルーティング用）
          if (response.status === 404) {
            // ベースパスを考慮したindex.htmlのパス
            const basePath = '/project-01-bookmemo/';
            const indexPath = url.pathname.startsWith(basePath) ? basePath + 'index.html' : '/index.html';
            return caches.match(indexPath) || fetch(indexPath);
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラーの場合もindex.htmlを返す
          const basePath = '/project-01-bookmemo/';
          const indexPath = url.pathname.startsWith(basePath) ? basePath + 'index.html' : '/index.html';
          return caches.match(indexPath) || fetch(indexPath);
        })
    );
    return;
  }

  // その他のリクエストはネットワークファースト
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// 静的ファイルかどうかを判定
function isStaticFile(request) {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    (url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.jpg') ||
     url.pathname.endsWith('.jpeg') ||
     url.pathname.endsWith('.gif') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.ico') ||
     url.pathname.endsWith('.woff') ||
     url.pathname.endsWith('.woff2') ||
     url.pathname.endsWith('.ttf') ||
     url.pathname.endsWith('.eot'))
  );
}

// APIリクエストかどうかを判定
function isApiRequest(request) {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    (url.pathname.includes('/api/') ||
     url.hostname.includes('firebase') ||
     url.hostname.includes('googleapis'))
  );
}

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : '新しい通知があります',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'アプリを開く',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BookMemo', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
