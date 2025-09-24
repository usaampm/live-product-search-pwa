// Service Worker for PWA 商品查找系統
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `live-product-search-${CACHE_VERSION}`;

// 需要快取的靜態資源
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/search.js',
  '/js/data.js',
  '/manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  console.log('[SW] 安裝中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 快取靜態資源');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] 安裝完成');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] 安裝失敗:', error);
      })
  );
});

// 啟用 Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] 啟用中...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return cacheName.startsWith('live-product-search-') && 
                   cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            console.log('[SW] 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] 啟用完成');
      return self.clients.claim();
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 只處理 HTTP/HTTPS 請求
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // 處理頁面導航請求
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // 處理靜態資源請求
  if (STATIC_CACHE_URLS.some(staticUrl => request.url.includes(staticUrl))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // 處理 Google Apps Script API 請求
  if (request.url.includes('script.google.com')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // 預設處理
  event.respondWith(handleDefaultRequest(request));
});

// 處理頁面導航請求
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log('[SW] 網路失敗，使用快取:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const fallbackResponse = await caches.match('/');
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return new Response('系統離線中，請稍後重試', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 處理靜態資源請求（快取優先）
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] 靜態資源載入失敗:', error);
    throw error;
  }
}

// 處理 API 請求（網路優先，失敗時通知用戶）
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] API 請求失敗:', error);
    
    // 通知前端 API 失敗
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'API_ERROR',
          message: '無法連接到搜尋服務，請檢查網路連線'
        });
      });
    });
    
    throw error;
  }
}

// 預設請求處理
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 訊息處理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker 已載入');