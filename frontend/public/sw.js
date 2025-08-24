// Service Worker for Budgeto PWA
// Provides caching, offline functionality, and performance optimizations

const CACHE_NAME = 'budgeto-v1';
const STATIC_CACHE = 'budgeto-static-v1';
const DYNAMIC_CACHE = 'budgeto-dynamic-v1';
const API_CACHE = 'budgeto-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/dashboard',
  '/transactions',
  '/budgets',
  '/settings',
  '/manifest.json',
  '/_next/static/css',
  '/_next/static/js'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/transactions',
  '/api/budgets',
  '/api/gamification/me',
  '/api/categories'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

self.addEventListener('install', (event) => {
  console.log('💾 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Other requests (images, fonts, etc.)
  event.respondWith(handleDynamicContent(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Always try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache:', url.pathname);
    
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'ServiceWorker-Cache');
      return response;
    }
    
    // Return offline response for specific endpoints
    return createOfflineResponse(url.pathname);
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle navigation with cache-first, fallback to network
async function handleNavigation(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    return caches.match('/');
  }
}

// Handle dynamic content with stale-while-revalidate
async function handleDynamicContent(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background to update cache
  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Network failed, ignore
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return networkFetch;
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/') ||
         pathname.startsWith('/static/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.ico') ||
         pathname === '/manifest.json';
}

// Create offline response for API endpoints
function createOfflineResponse(pathname) {
  const offlineData = {
    error: 'offline',
    message: 'You are currently offline. Some features may be limited.',
    pathname
  };
  
  // Specific offline responses
  if (pathname === '/api/transactions') {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    });
  }
  
  if (pathname === '/api/budgets') {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    });
  }
  
  if (pathname === '/api/gamification/me') {
    return new Response(JSON.stringify({
      xp: 0,
      level: 1,
      streak_count: 0,
      offline: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    });
  }
  
  // Default offline response
  return new Response(JSON.stringify(offlineData), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Served-By': 'ServiceWorker-Offline'
    }
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
  
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync pending transactions when back online
async function syncPendingTransactions() {
  try {
    const pendingTransactions = await getFromIndexedDB('pendingTransactions');
    
    for (const transaction of pendingTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': transaction.authToken
          },
          body: JSON.stringify(transaction.data)
        });
        
        if (response.ok) {
          await removeFromIndexedDB('pendingTransactions', transaction.id);
          console.log('✅ Synced transaction:', transaction.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Sync notifications
async function syncNotifications() {
  try {
    const response = await fetch('/api/achievements/notifications');
    if (response.ok) {
      const notifications = await response.json();
      
      // Show new notifications
      for (const notification of notifications.notifications) {
        if (!notification.read) {
          self.registration.showNotification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            tag: `notification-${notification.id}`,
            data: notification
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to sync notifications:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data,
      actions: data.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-dismiss.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// IndexedDB helpers for offline storage
async function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BudgetoOfflineDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BudgetoOfflineDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

console.log('🎯 Budgeto Service Worker loaded successfully');