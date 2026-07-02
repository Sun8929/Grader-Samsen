interface CacheEntry {
  data: any
  expiresAt: number
}

const cacheStore = new Map<string, CacheEntry>()

/**
 * Express middleware to cache responses in memory
 * @param durationSeconds Cache lifetime in seconds
 */
export const cacheMiddleware = (durationSeconds: number) => {
  return (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next()
    }

    const key = req.originalUrl || req.url
    const cached = cacheStore.get(key)

    if (cached && Date.now() < cached.expiresAt) {
      res.setHeader('X-Cache', 'HIT')
      return res.json(cached.data)
    }

    res.setHeader('X-Cache', 'MISS')

    // Intercept res.json to capture the response body
    const originalJson = res.json
    res.json = function (body: any) {
      if (res.statusCode === 200) {
        cacheStore.set(key, {
          data: body,
          expiresAt: Date.now() + durationSeconds * 1000,
        })
      }
      return originalJson.call(this, body)
    }

    next()
  }
}

/**
 * Utility to clear specific keys from the cache store
 * @param pattern string or RegExp to match cache keys to clear
 */
export const clearCache = (pattern: string | RegExp) => {
  for (const key of cacheStore.keys()) {
    const shouldDelete = typeof pattern === 'string' 
      ? key.includes(pattern) 
      : pattern.test(key)
    
    if (shouldDelete) {
      cacheStore.delete(key)
    }
  }
}
