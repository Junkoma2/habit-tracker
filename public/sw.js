const CACHE = 'habit-tracker-__APP_VERSION__'
const BASE = '/habit-tracker'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([
        BASE + '/',
        BASE + '/index.html',
        BASE + '/manifest.webmanifest',
        BASE + '/icon.svg',
      ])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      })
      .catch(() =>
        caches.match(e.request).then(cached => cached ?? caches.match(BASE + '/'))
      )
  )
})
