// Service Worker for background audio playback
const CACHE_NAME = 'baby-sleep-app-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/sleep-sounds.html',
    '/baby-time.html',
    '/styles.css',
    '/app.js',
    '/baby-time.js',
    '/manifest.json',
    '/assets/images/default-cover.svg',
    '/assets/images/icon-192x192.svg',
    '/assets/images/hero-baby.svg',
    '/assets/audio/white-noise.mp3',
    '/assets/audio/gentle-rain.mp3',
    '/assets/audio/coffee-shop.mp3',
    '/assets/audio/ocean-waves.mp3',
    '/audio-worklet.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    event.waitUntil(clients.claim());
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Special handling for audio files to ensure they continue playing in background
    if (event.request.url.match(/\.(mp3|aac|wav|ogg)$/)) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Cache the audio file
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For YouTube API requests, always fetch from network
    if (event.request.url.includes('youtube.com') || event.request.url.includes('googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For all other requests, use the standard cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then(response => {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Background sync for audio playback
self.addEventListener('sync', event => {
    if (event.tag === 'audio-playback') {
        event.waitUntil(
            // Send a message to all clients to keep audio playing
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'keep-audio-playing',
                        timestamp: Date.now()
                    });
                });
            })
        );
    }
});

// Handle messages from clients
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'register-audio-playback') {
        // Register for background sync
        event.waitUntil(
            self.registration.sync.register('audio-playback')
                .then(() => {
                    console.log('Background sync registered for audio playback');
                })
                .catch(err => {
                    console.error('Background sync registration failed:', err);
                })
        );
    }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data.type === 'audioState') {
        // Store the current audio state
        self.audioState = {
            isPlaying: event.data.isPlaying,
            soundId: event.data.soundId
        };
        
        // Broadcast the state to all clients
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'audioState',
                    isPlaying: event.data.isPlaying,
                    soundId: event.data.soundId
                });
            });
        });
    }
});

// Keep the service worker alive with a periodic heartbeat
setInterval(() => {
    if (self.audioState && self.audioState.isPlaying) {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'audioState',
                    isPlaying: true,
                    soundId: self.audioState.soundId
                });
            });
        });
    }
}, 5000); 