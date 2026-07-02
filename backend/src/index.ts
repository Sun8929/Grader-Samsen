import express from 'express'
import cors from 'cors'
import http from 'http'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import { loadEnv } from './env.js'
import { authRouter } from './routes/auth.js'
import { classroomsRouter } from './routes/classrooms.js'
import { problemsRouter } from './routes/problems.js'
import { assignmentsRouter } from './routes/assignments.js'

const { port, frontendUrl } = loadEnv()

const app = express()

// Enable Gzip Compression to speed up response data transfers
app.use(compression())

// Global general API rate limiter: max 150 requests per minute
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150,
  message: { error: 'Too many requests from this IP, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Specific rate limiter for auth (login/register) to prevent brute force: max 20 requests per 5 minutes
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: { error: 'Too many login attempts, please try again after 5 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply rate limiters
app.use('/api/', globalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)


app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }

      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      if (isLocalhost || origin === frontendUrl) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/classrooms', classroomsRouter)
app.use('/api/problems', problemsRouter)
app.use('/api/assignments', assignmentsRouter)

// Fallback to JSON for 404
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` })
})

// Error handler to prevent HTML responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})
const startServer = (currentPort: number) => {
  const server = http.createServer(app)

  // Keep-alive timeouts configuration for high concurrency optimization
  server.keepAliveTimeout = 61000 // 61 seconds (slightly higher than default client timeouts)
  server.headersTimeout = 65000 // 65 seconds

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WARNING] Port ${currentPort} is already in use. Trying port ${currentPort + 1}...`)
      startServer(currentPort + 1)
    } else {
      console.error('Server error:', err)
    }
  })

  server.listen(currentPort, () => {
    console.log(`Backend running on http://localhost:${currentPort}`)
    if (currentPort !== port) {
      console.warn(`[WARNING] Backend fell back to port ${currentPort} because the configured port ${port} was occupied.`)
    }
  })
}

startServer(port)
